import { Client } from 'pg';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import 'dotenv/config';

const appName = process.argv[2] || 'outline';
const dbUrl = process.argv[3] || process.env.OUTLINE_DATABASE_URL;

if (!dbUrl) {
  console.error('Error: Database URL not provided');
  process.exit(1);
}

const outFile = `integrations/${appName}/schema.ts`;

async function generateSchema() {
  // Parse the URL to modify connection parameters
  const url = new URL(dbUrl || 'http://localhost:5432');
  
  // If using pooler (port 6543), suggest direct connection
  if (url.port === '6543') {
    console.log('⚠️  Detected pooler connection (port 6543)');
    console.log('💡 Consider using direct connection (port 5432) for better reliability');
    
    // Optionally auto-switch to direct connection
    const directUrl = dbUrl?.replace(':6543', ':5432');
    console.log('🔄 Attempting direct connection...');
    return generateSchemaWithUrl(directUrl);
  }
  
  return generateSchemaWithUrl(dbUrl || '');
}

async function generateSchemaWithUrl(connectionString) {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 60000,  // Increased timeout
    idleTimeoutMillis: 30000,
    query_timeout: 120000,  // Increased query timeout
    // Additional connection options for better reliability
    ssl: {
      rejectUnauthorized: false  // For Supabase connections
    },
    keepAlive: true,
    keepAliveInitialDelayMillis: 30000,
  });

  try {
    console.log('🔌 Connecting to database...');
    console.log(`📡 Target: ${new URL(connectionString).hostname}:${new URL(connectionString).port}`);
    
    await client.connect();
    console.log('✅ Connected successfully!');

    // Test connection with a simple query first
    console.log('🔍 Testing connection...');
    await client.query('SELECT 1');
    console.log('✅ Connection test passed!');

    // Get all tables with retry logic
    console.log('📊 Fetching table information...');
    const tablesResult = await executeWithRetry(client, `
      SELECT 
        table_name,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`📊 Found ${tablesResult.rows.length} tables`);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found in public schema');
      return;
    }

    // Get columns for each table
    console.log('📋 Fetching column information...');
    const columnsResult = await executeWithRetry(client, `
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        tc.constraint_type
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage kcu 
        ON c.table_name = kcu.table_name 
        AND c.column_name = kcu.column_name
      LEFT JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position
    `);

    // Generate basic schema structure
    let schemaContent = `import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';

// Generated schema for ${appName}
// Generated at: ${new Date().toISOString()}
// Tables found: ${tablesResult.rows.map(r => r.table_name).join(', ')}

`;

    // Group columns by table
    const tableColumns = {};
    columnsResult.rows.forEach(col => {
      if (!tableColumns[col.table_name]) {
        tableColumns[col.table_name] = [];
      }
      tableColumns[col.table_name].push(col);
    });

    // Generate table definitions
    tablesResult.rows.forEach(table => {
      const tableName = table.table_name;
      const columns = tableColumns[tableName] || [];
      
      schemaContent += `export const ${tableName} = pgTable('${tableName}', {\n`;
      
      columns.forEach(col => {
        const colName = col.column_name;
        let colType = 'text()';
        
        // Map PostgreSQL types to Drizzle types
        switch (col.data_type) {
          case 'uuid':
            colType = 'uuid()';
            break;
          case 'integer':
          case 'bigint':
            colType = 'integer()';
            break;
          case 'serial':
          case 'bigserial':
            colType = 'serial()';
            break;
          case 'boolean':
            colType = 'boolean()';
            break;
          case 'timestamp with time zone':
          case 'timestamp without time zone':
            colType = 'timestamp()';
            break;
          case 'jsonb':
            colType = 'jsonb()';
            break;
          case 'text':
          case 'character varying':
          case 'varchar':
          default:
            colType = 'text()';
        }
        
        // Apply constraints
        if (col.is_nullable === 'NO') {
          colType = colType.replace(')', '.notNull()');
        }
        
        if (col.constraint_type === 'PRIMARY KEY') {
          colType = colType.replace(')', '.primaryKey()');
        }
        
        schemaContent += `  ${colName}: ${colType},\n`;
      });
      
      schemaContent += `});\n\n`;
    });

    // Ensure output directory exists
    mkdirSync(dirname(outFile), { recursive: true });
    
    // Write schema file
    writeFileSync(outFile, schemaContent);
    
    console.log(`✅ Schema generated successfully at ${outFile}`);
    console.log(`📝 Generated ${tablesResult.rows.length} table definitions`);
    
  } catch (error) {
    console.error('❌ Error generating schema:', error.message);
    
    if (error.message.includes('timeout') || error.code === 'CONNECT_TIMEOUT') {
      console.error('\n🌐 Connection timeout detected. Troubleshooting steps:');
      console.error('1. ✅ Use direct connection URL (port 5432 instead of 6543)');
      console.error('2. 🔄 Try a different network (mobile hotspot, VPN)');
      console.error('3. 🔒 Check if your ISP blocks PostgreSQL ports');
      console.error('4. 📍 Verify database region matches your location');
      console.error('5. 🔑 Confirm database credentials are correct');
    }
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n🔍 DNS resolution failed. Try:');
      console.error('1. 📡 Check your internet connection');
      console.error('2. 🌐 Try different DNS servers (8.8.8.8, 1.1.1.1)');
      console.error('3. 🔄 Flush DNS cache');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function executeWithRetry(client, query, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.query(query);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`⚠️  Query failed (attempt ${i + 1}/${maxRetries}), retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

generateSchema();