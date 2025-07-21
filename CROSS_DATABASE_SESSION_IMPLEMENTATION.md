# 🔄 Cross-Database Session Validation Implementation

## **🎯 Implementation Overview**

This implementation provides seamless Outline access with cross-database session validation between the main app (Supabase) and Outline app (separate Supabase database).

## **🏗️ Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Proxy Server  │    │  Outline App    │
│  (localhost:3001)│    │  (localhost:8000) │    │  (localhost:3000) │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Button    │ │    │ │ Auth Check  │ │    │ │   Outline   │ │
│ │ "Open       │ │    │ │ Session     │ │    │ │   App       │ │
│ │  Outline"   │ │    │ │ Check       │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. GET /outline?token │                       │
         ├──────────────────────►│                       │
         │                       │                       │
         │ 2. Validate token     │                       │
         │    with main DB       │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
         │ 3. Check Outline      │                       │
         │    sessions in        │                       │
         │    Outline DB         │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
         │ 4. Redirect based     │                       │
         │    on session status  │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
```

## **🔧 Key Components**

### **1. Dual Supabase Configuration** (`src/config/supabase.ts`)
```typescript
// Main app Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Outline app Supabase
const outlineSupabaseUrl = process.env.OUTLINE_SUPABASE_URL;
const outlineSupabaseKey = process.env.OUTLINE_SUPABASE_ANON_KEY;
const outlineSupabaseServiceKey = process.env.OUTLINE_SUPABASE_SERVICE_ROLE_KEY;
```

### **2. Cross-Database Session Service** (`src/services/outline/OutlineSessionService.ts`)
```typescript
export class OutlineSessionService {
  // Check if user has active session in Outline database
  async checkUserOutlineSession(mainAppUser: User): Promise<CrossDatabaseSessionResult>
  
  // Find user in Outline database by email
  private async findOutlineUserByEmail(email: string): Promise<any | null>
  
  // Check for active sessions for a user
  private async checkActiveSessions(outlineUserId: string): Promise<SessionStatus>
}
```

### **3. Session Check Middleware** (`src/middleware/sessionCheck.ts`)
```typescript
export const sessionCheckMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Extract user from request (set by auth middleware)
  // 2. Check Outline session status
  // 3. Redirect to OAuth if no session
  // 4. Proceed to Outline if session exists
}
```

### **4. Enhanced Proxy Middleware** (`src/middleware/proxy.ts`)
```typescript
// For Outline: [sessionCheck, redirect, proxy]
// For other services: [redirect, proxy]
```

## **🔄 Complete Flow**

### **Scenario 1: User has active Outline session**
```
1. User clicks "Open Outline" → GET /outline?token=supabase_jwt
2. Proxy validates token with main Supabase ✅
3. Proxy checks Outline sessions in Outline Supabase ✅
4. User has active session → Redirect to https://outline.brain.emiactech.com
5. User sees Outline dashboard immediately
```

### **Scenario 2: User needs OAuth**
```
1. User clicks "Open Outline" → GET /outline?token=supabase_jwt
2. Proxy validates token with main Supabase ✅
3. Proxy checks Outline sessions in Outline Supabase ❌
4. No active session → Redirect to Google OAuth
5. User sees Google consent screen
6. User authorizes → Outline creates session
7. User redirected to Outline dashboard
```

### **Scenario 3: User not in Outline database**
```
1. User clicks "Open Outline" → GET /outline?token=supabase_jwt
2. Proxy validates token with main Supabase ✅
3. Proxy checks Outline database → User not found ❌
4. User not found → Redirect to Google OAuth
5. User sees Google consent screen
6. User authorizes → Outline creates user and session
7. User redirected to Outline dashboard
```

## **📋 Environment Variables Required**

```bash
# Main app Supabase
SUPABASE_URL=your_main_supabase_url
SUPABASE_ANON_KEY=your_main_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_main_supabase_service_key

# Outline app Supabase
OUTLINE_SUPABASE_URL=your_outline_supabase_url
OUTLINE_SUPABASE_ANON_KEY=your_outline_supabase_anon_key
OUTLINE_SUPABASE_SERVICE_ROLE_KEY=your_outline_supabase_service_key

# Outline app configuration
OUTLINE_BASE_URL=https://outline.brain.emiactech.com
```

## **🔍 Database Queries**

### **Find User in Outline Database**
```sql
SELECT id, email, created_at, updated_at 
FROM auth.users 
WHERE email = 'user@example.com'
```

### **Check Active Sessions**
```sql
SELECT id, user_id, expires_at, created_at 
FROM auth.sessions 
WHERE user_id = 'outline_user_id' 
  AND expires_at > NOW() 
ORDER BY created_at DESC 
LIMIT 1
```

## **🚀 Testing**

### **Run Cross-Database Session Tests**
```bash
# Set environment variables
export SUPABASE_JWT="your_valid_jwt_token"
export PROXY_BASE_URL="http://localhost:8000"

# Run tests
node test/cross-database-session-test.js
```

### **Test Scenarios**
1. **User with active Outline session** → Should redirect to Outline
2. **User without Outline session** → Should redirect to OAuth
3. **User not in Outline database** → Should redirect to OAuth
4. **Invalid token** → Should return 401

## **🔒 Security Features**

### **1. Token Validation**
- ✅ Validates Supabase JWT with main database
- ✅ Checks user existence and permissions
- ✅ Handles expired/invalid tokens gracefully

### **2. Cross-Database Security**
- ✅ Uses admin service role for Outline database access
- ✅ Validates user mapping via email
- ✅ Checks session expiration times

### **3. OAuth Security**
- ✅ Encrypts state parameters
- ✅ Validates callback state
- ✅ Prevents state tampering

### **4. Error Handling**
- ✅ Graceful fallback to OAuth on errors
- ✅ Comprehensive logging
- ✅ Timeout protection

## **📊 Monitoring & Logging**

### **Session Check Logs**
```
🔍 Checking Outline session for user: user@example.com
✅ Found Outline user: outline_user_id
✅ Found active Outline session: session_id
✅ Session check completed in 150ms
```

### **OAuth Redirect Logs**
```
🔄 No active Outline session for user: user@example.com
🔄 Redirecting to OAuth (no session): https://outline.brain.emiactech.com/auth/google?...
```

### **Error Logs**
```
❌ Error checking Outline session (200ms): Database connection failed
🔄 Redirecting to OAuth (error fallback): https://outline.brain.emiactech.com/auth/google?...
```

## **🎯 Benefits**

### **1. Seamless User Experience**
- No login screens unless OAuth needed
- Automatic session detection
- Smooth redirects

### **2. Cross-Database Integration**
- Validates sessions across separate databases
- Maps users via email
- Handles different authentication systems

### **3. Robust Error Handling**
- Graceful fallbacks
- Comprehensive logging
- Timeout protection

### **4. Security**
- Token validation
- State encryption
- Database access control

## **🔧 Configuration**

### **Outline OAuth Setup**
```bash
# In Outline's environment
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### **Database Permissions**
```sql
-- Ensure service role has access to auth tables
GRANT SELECT ON auth.users TO service_role;
GRANT SELECT ON auth.sessions TO service_role;
```

## **🚀 Deployment**

### **1. Set Environment Variables**
```bash
# Copy .env.example and fill in your values
cp .env.example .env
```

### **2. Start Proxy Server**
```bash
pnpm dev
```

### **3. Test Integration**
```bash
# Run tests
node test/cross-database-session-test.js
```

### **4. Monitor Logs**
```bash
# Check proxy logs
tail -f logs/proxy.log
```

## **❓ Troubleshooting**

### **Common Issues**

1. **"Outline session service not available"**
   - Check `OUTLINE_SUPABASE_*` environment variables
   - Verify Outline database connectivity

2. **"User not found in Outline database"**
   - Ensure user exists in Outline database
   - Check email mapping between databases

3. **"No active Outline sessions found"**
   - User needs to authenticate with Outline
   - Will redirect to Google OAuth

4. **"Database connection failed"**
   - Check Outline database URL and credentials
   - Verify network connectivity

### **Debug Mode**
```bash
# Enable debug logging
export DEBUG=proxy:*
pnpm dev
```

This implementation provides a robust, secure, and seamless cross-database session validation system that handles all edge cases while maintaining excellent user experience. 