import { Client } from 'pg';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import 'dotenv/config';

// Parse command line arguments
const args = process.argv.slice(2);
const appName = args[0] || 'main';
const dbEnvVar = args[1] || 'DATABASE_URL';

// Get database URL from environment variable
const dbUrl = process.env[dbEnvVar];

if (!dbUrl) {
  console.error(`Error: Environment variable '${dbEnvVar}' not found`);
  console.error(`Usage: ts-node generator.ts <app-name> <env-var-name>`);
  console.error(`Example: ts-node generator.ts main DIRECT_URL`);
  process.exit(1);
}

const outFile = `integrations/${appName}/schema.ts`;

console.log(`Received arguments: { appName: '${appName}', dbEnvVar: '${dbEnvVar}' }`);
console.log(`Reading env var '${dbEnvVar}': ${dbUrl.replace(/:[^:@]*@/, ':****@')}`);

async function generateSchema() {
  // Parse the URL to check connection type
  const url = new URL(dbUrl || '');
  
  // If using pooler (port 6543), suggest direct connection
  if (url.port === '6543') {
    console.log('⚠️  Detected pooler connection (port 6543)');
    console.log('💡 Consider using direct connection (port 5432) for better reliability');
    
    // Optionally auto-switch to direct connection
    const directUrl = dbUrl?.replace(':6543', ':5432');
    console.log('🔄 Attempting direct connection...');
    return generateSchemaWithUrl(directUrl || '');
  }
  
  return generateSchemaWithUrl(dbUrl || '');
}

async function generateSchemaWithUrl(connectionString: string) {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 60000,
    query_timeout: 120000,
    ssl: {
      rejectUnauthorized: false
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

    // Get columns for each table with better constraint detection
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
        c.ordinal_position,
        CASE 
          WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
          WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY'
          ELSE NULL 
        END as constraint_type
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position
    `);

    // Generate schema structure
    let schemaContent = `import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';

// Generated schema for ${appName}
// Generated at: ${new Date().toISOString()}
// Tables found: ${tablesResult.rows.map((r: any) => r.table_name).join(', ')}

`;

    // Group columns by table
    const tableColumns: Record<string, any[]> = {};
    columnsResult.rows.forEach((col: any) => {
      if (!tableColumns[col.table_name]) {
        tableColumns[col.table_name] = [];
      }
      tableColumns[col.table_name].push(col);
    });

    // Generate table definitions
    tablesResult.rows.forEach((table: any) => {
      const tableName = table.table_name;
      const columns = tableColumns[tableName] || [];
      
      schemaContent += `export const ${tableName} = pgTable('${tableName}', {\n`;
      
      columns.forEach((col: any) => {
        const colName = col.column_name;
        let colType = mapPostgresToDrizzleType(col);
        
        // Apply constraints
        if (col.is_nullable === 'NO') {
          colType = colType.replace(')', '.notNull()');
        }
        
        if (col.constraint_type === 'PRIMARY KEY') {
          colType = colType.replace(')', '.primaryKey()');
        }
        
        // Handle defaults
        if (col.column_default) {
          const defaultValue = parseDefaultValue(col.column_default, col.data_type);
          if (defaultValue) {
            colType = colType.replace(')', `.default(${defaultValue})`);
          }
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
    
  } catch (error: any) {
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

function mapPostgresToDrizzleType(col: any): string {
  const { data_type, character_maximum_length } = col;
  
  switch (data_type) {
    case 'uuid':
      return 'uuid()';
    case 'integer':
    case 'int4':
      return 'integer()';
    case 'bigint':
    case 'int8':
      return 'integer()';
    case 'serial':
    case 'serial4':
      return 'serial()';
    case 'bigserial':
    case 'serial8':
      return 'serial()';
    case 'boolean':
    case 'bool':
      return 'boolean()';
    case 'timestamp with time zone':
    case 'timestamptz':
      return 'timestamp({ withTimezone: true })';
    case 'timestamp without time zone':
    case 'timestamp':
      return 'timestamp()';
    case 'date':
      return 'date()';
    case 'time':
      return 'time()';
    case 'jsonb':
      return 'jsonb()';
    case 'json':
      return 'json()';
    case 'character varying':
    case 'varchar':
      if (character_maximum_length) {
        return `varchar({ length: ${character_maximum_length} })`;
      }
      return 'varchar()';
    case 'character':
    case 'char':
      if (character_maximum_length) {
        return `char({ length: ${character_maximum_length} })`;
      }
      return 'char()';
    case 'text':
      return 'text()';
    case 'numeric':
    case 'decimal':
      return 'decimal()';
    case 'real':
    case 'float4':
      return 'real()';
    case 'double precision':
    case 'float8':
      return 'doublePrecision()';
    case 'smallint':
    case 'int2':
      return 'smallint()';
    case 'bytea':
      return 'bytea()';
    default:
      console.warn(`⚠️  Unknown data type '${data_type}', using text()`);
      return 'text()';
  }
}

function parseDefaultValue(defaultValue: string, dataType: string): string | null {
  if (!defaultValue) return null;
  
  // Handle common default patterns
  if (defaultValue.includes('nextval')) {
    return null; // Serial columns, handled by serial()
  }
  
  if (defaultValue === 'now()' || defaultValue.includes('CURRENT_TIMESTAMP')) {
    return 'sql`now()`';
  }
  
  if (defaultValue === 'true' || defaultValue === 'false') {
    return defaultValue;
  }
  
  if (defaultValue.startsWith("'") && defaultValue.endsWith("'")) {
    return defaultValue; // String literal
  }
  
  // Try to parse as number
  const num = parseFloat(defaultValue);
  if (!isNaN(num)) {
    return defaultValue;
  }
  
  // For complex defaults, wrap in sql``
  return `sql\`${defaultValue}\``;
}

async function executeWithRetry(client: Client, query: string, maxRetries = 3): Promise<any> {
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

// Run the generator
generateSchema().catch(console.error);