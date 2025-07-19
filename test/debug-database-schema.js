const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugDatabaseSchema() {
  console.log('🔍 Debugging Outline Database Schema');
  
  // Get Outline Supabase credentials
  const outlineSupabaseUrl = process.env.OUTLINE_SUPABASE_URL;
  const outlineSupabaseServiceKey = process.env.OUTLINE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!outlineSupabaseUrl || !outlineSupabaseServiceKey) {
    console.error('❌ Missing Outline Supabase credentials');
    console.log('Required environment variables:');
    console.log('- OUTLINE_SUPABASE_URL');
    console.log('- OUTLINE_SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  
  console.log('✅ Outline Supabase credentials found');
  console.log(`📡 URL: ${outlineSupabaseUrl}`);
  
  try {
    // Create Outline Supabase client
    const outlineClient = createClient(outlineSupabaseUrl, outlineSupabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✅ Outline Supabase client created');
    
    // Test 1: Check if we can connect
    console.log('\n🔍 Test 1: Basic connection test');
    try {
      const { data, error } = await outlineClient.from('auth.users').select('count').limit(1);
      if (error) {
        console.log('❌ Connection test failed:', error);
      } else {
        console.log('✅ Connection test successful');
      }
    } catch (error) {
      console.log('❌ Connection test error:', error.message);
    }
    
    // Test 2: List all schemas
    console.log('\n🔍 Test 2: List all schemas');
    try {
      const { data: schemas, error } = await outlineClient
        .from('information_schema.schemata')
        .select('schema_name')
        .order('schema_name');
      
      if (error) {
        console.log('❌ Schema query failed:', error);
      } else {
        console.log('📋 Available schemas:');
        schemas.forEach(schema => {
          console.log(`  - ${schema.schema_name}`);
        });
      }
    } catch (error) {
      console.log('❌ Schema query error:', error.message);
    }
    
    // Test 3: List auth schema tables
    console.log('\n🔍 Test 3: List auth schema tables');
    try {
      const { data: tables, error } = await outlineClient
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'auth')
        .order('table_name');
      
      if (error) {
        console.log('❌ Tables query failed:', error);
      } else {
        console.log('📋 Auth schema tables:');
        tables.forEach(table => {
          console.log(`  - ${table.table_name} (${table.table_type})`);
        });
      }
    } catch (error) {
      console.log('❌ Tables query error:', error.message);
    }
    
    // Test 4: Try to query auth.users directly
    console.log('\n🔍 Test 4: Query auth.users table');
    try {
      const { data: users, error } = await outlineClient
        .from('auth.users')
        .select('id, email, created_at')
        .limit(3);
      
      if (error) {
        console.log('❌ Users query failed:', error);
      } else {
        console.log('✅ Users query successful');
        console.log('📊 Sample users:');
        users.forEach(user => {
          console.log(`  - ${user.email} (${user.id})`);
        });
      }
    } catch (error) {
      console.log('❌ Users query error:', error.message);
    }
    
    // Test 5: Try to query auth.sessions
    console.log('\n🔍 Test 5: Query auth.sessions table');
    try {
      const { data: sessions, error } = await outlineClient
        .from('auth.sessions')
        .select('id, user_id, expires_at, created_at')
        .limit(3);
      
      if (error) {
        console.log('❌ Sessions query failed:', error);
      } else {
        console.log('✅ Sessions query successful');
        console.log('📊 Sample sessions:');
        sessions.forEach(session => {
          console.log(`  - Session ${session.id} for user ${session.user_id} (expires: ${session.expires_at})`);
        });
      }
    } catch (error) {
      console.log('❌ Sessions query error:', error.message);
    }
    
    // Test 6: Try raw SQL approach
    console.log('\n🔍 Test 6: Raw SQL approach');
    try {
      const { data, error } = await outlineClient.rpc('exec_sql', {
        sql: 'SELECT schema_name FROM information_schema.schemata ORDER BY schema_name'
      });
      
      if (error) {
        console.log('❌ Raw SQL failed:', error);
      } else {
        console.log('✅ Raw SQL successful');
        console.log('📊 Schemas from raw SQL:');
        data.forEach(row => {
          console.log(`  - ${row.schema_name}`);
        });
      }
    } catch (error) {
      console.log('❌ Raw SQL error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to create Outline client:', error);
  }
}

// Run the debug
debugDatabaseSchema().catch(console.error); 