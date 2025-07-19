const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Outline Supabase client
const outlineSupabaseUrl = process.env.OUTLINE_SUPABASE_URL;
const outlineSupabaseServiceKey = process.env.OUTLINE_SUPABASE_SERVICE_ROLE_KEY;

if (!outlineSupabaseUrl || !outlineSupabaseServiceKey) {
  console.error('❌ Missing Outline Supabase credentials');
  process.exit(1);
}

const outlineAdminClient = createClient(outlineSupabaseUrl, outlineSupabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugOutlineAuth() {
  console.log('🔍 Debugging Outline authentication...');
  
  try {
    // Test email to check
    const testEmail = 'abhishek.verma@outline.com'; // Replace with your email
    console.log(`📧 Checking for user with email: ${testEmail}`);
    
    // 1. Check if user exists
    console.log('\n1️⃣ Checking users table...');
    const { data: users, error: usersError } = await outlineAdminClient
      .from('users')
      .select('id, email, name, lastActiveAt, lastSignedInAt, createdAt')
      .eq('email', testEmail);
    
    if (usersError) {
      console.error('❌ Error querying users:', usersError);
    } else {
      console.log('✅ Users found:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('📊 User data:', users[0]);
      }
    }
    
    if (users && users.length > 0) {
      const userId = users[0].id;
      console.log(`\n👤 Found user with ID: ${userId}`);
      
      // 2. Check user_authentications
      console.log('\n2️⃣ Checking user_authentications...');
      const { data: userAuths, error: userAuthError } = await outlineAdminClient
        .from('user_authentications')
        .select('*')
        .eq('userId', userId);
      
      if (userAuthError) {
        console.error('❌ Error querying user_authentications:', userAuthError);
      } else {
        console.log('✅ User authentications found:', userAuths?.length || 0);
        if (userAuths && userAuths.length > 0) {
          console.log('📊 User auth data:', userAuths);
        }
      }
      
      // 3. Check oauth_authentications
      console.log('\n3️⃣ Checking oauth_authentications...');
      const { data: oauthAuths, error: oauthAuthError } = await outlineAdminClient
        .from('oauth_authentications')
        .select('*')
        .eq('userId', userId);
      
      if (oauthAuthError) {
        console.error('❌ Error querying oauth_authentications:', oauthAuthError);
      } else {
        console.log('✅ OAuth authentications found:', oauthAuths?.length || 0);
        if (oauthAuths && oauthAuths.length > 0) {
          console.log('📊 OAuth auth data:', oauthAuths);
        }
      }
      
      // 4. Check apiKeys
      console.log('\n4️⃣ Checking apiKeys...');
      const { data: apiKeys, error: apiKeysError } = await outlineAdminClient
        .from('apiKeys')
        .select('*')
        .eq('userId', userId);
      
      if (apiKeysError) {
        console.error('❌ Error querying apiKeys:', apiKeysError);
      } else {
        console.log('✅ API keys found:', apiKeys?.length || 0);
        if (apiKeys && apiKeys.length > 0) {
          console.log('📊 API key data:', apiKeys);
        }
      }
      
      // 5. Check for active sessions (not expired)
      console.log('\n5️⃣ Checking for active (non-expired) sessions...');
      const now = new Date().toISOString();
      console.log(`⏰ Current time: ${now}`);
      
      // Check active user authentications
      const { data: activeUserAuths, error: activeUserAuthError } = await outlineAdminClient
        .from('user_authentications')
        .select('*')
        .eq('userId', userId)
        .not('expiresAt', 'is', null)
        .gt('expiresAt', now);
      
      if (activeUserAuthError) {
        console.error('❌ Error checking active user authentications:', activeUserAuthError);
      } else {
        console.log('✅ Active user authentications:', activeUserAuths?.length || 0);
        if (activeUserAuths && activeUserAuths.length > 0) {
          console.log('📊 Active user auth data:', activeUserAuths);
        }
      }
      
      // Check active OAuth authentications
      const { data: activeOAuthAuths, error: activeOAuthAuthError } = await outlineAdminClient
        .from('oauth_authentications')
        .select('*')
        .eq('userId', userId)
        .gt('accessTokenExpiresAt', now);
      
      if (activeOAuthAuthError) {
        console.error('❌ Error checking active OAuth authentications:', activeOAuthAuthError);
      } else {
        console.log('✅ Active OAuth authentications:', activeOAuthAuths?.length || 0);
        if (activeOAuthAuths && activeOAuthAuths.length > 0) {
          console.log('📊 Active OAuth auth data:', activeOAuthAuths);
        }
      }
      
      // Check active API keys
      const { data: activeApiKeys, error: activeApiKeysError } = await outlineAdminClient
        .from('apiKeys')
        .select('*')
        .eq('userId', userId)
        .not('expiresAt', 'is', null)
        .gt('expiresAt', now);
      
      if (activeApiKeysError) {
        console.error('❌ Error checking active API keys:', activeApiKeysError);
      } else {
        console.log('✅ Active API keys:', activeApiKeys?.length || 0);
        if (activeApiKeys && activeApiKeys.length > 0) {
          console.log('📊 Active API key data:', activeApiKeys);
        }
      }
      
      // 6. Summary
      console.log('\n📊 SUMMARY:');
      console.log(`- User exists: ${users && users.length > 0}`);
      console.log(`- Total user authentications: ${userAuths?.length || 0}`);
      console.log(`- Total OAuth authentications: ${oauthAuths?.length || 0}`);
      console.log(`- Total API keys: ${apiKeys?.length || 0}`);
      console.log(`- Active user authentications: ${activeUserAuths?.length || 0}`);
      console.log(`- Active OAuth authentications: ${activeOAuthAuths?.length || 0}`);
      console.log(`- Active API keys: ${activeApiKeys?.length || 0}`);
      
      const hasActiveSession = (activeUserAuths && activeUserAuths.length > 0) ||
                              (activeOAuthAuths && activeOAuthAuths.length > 0) ||
                              (activeApiKeys && activeApiKeys.length > 0);
      
      console.log(`\n🎯 RESULT: User has active session: ${hasActiveSession}`);
      
    } else {
      console.log('❌ No user found with that email');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugOutlineAuth().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
}); 