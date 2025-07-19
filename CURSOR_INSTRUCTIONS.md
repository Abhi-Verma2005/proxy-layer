# Cursor Instructions: Add Next.js Link to Proxy Server

## Task: Add a Next.js Link component that redirects to localhost:8000/outline

### Step 1: Import Next.js Link
Add this import to your component file:
```typescript
import Link from 'next/link';
```

### Step 2: Create the Link Component with Token
Add this Link component to your dashboard/component:
```typescript
import { useSupabase } from '@/contexts/SupabaseContext';

const { supabase } = useSupabase();

const handleOpenOutline = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (token) {
    window.open(`http://localhost:8000/outline?token=${token}`, '_blank');
  } else {
    console.error('No authentication token available');
  }
};

<button
  onClick={handleOpenOutline}
  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
>
  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  Open Outline
</button>
```

### Step 3: Alternative - Button with onClick
If you prefer a button approach:
```typescript
<button
  onClick={() => window.open('http://localhost:8000/outline', '_blank')}
  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
>
  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  Open Outline
</button>
```

### Step 4: With Supabase Authentication
The proxy expects the Supabase JWT token in the Authorization header. Here are the ways to include it:

#### Option A: Token in URL Parameters (Recommended for your use case)
```typescript
import { useAuth } from '@/contexts/AuthContext'; // Your auth context
import { useSupabase } from '@/contexts/SupabaseContext'; // Or Supabase context

const { user } = useAuth();
const { supabase } = useSupabase();

const handleOpenOutline = async () => {
  // Get the current session token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (token) {
    // Open with token in URL parameter
    window.open(`http://localhost:8000/outline?token=${token}`, '_blank');
  } else {
    console.error('No authentication token available');
  }
};

<button
  onClick={handleOpenOutline}
  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
>
  Open Outline
</button>
```

#### Option B: Using Next.js Link with URL Parameter
```typescript
import Link from 'next/link';
import { useSupabase } from '@/contexts/SupabaseContext';

const { supabase } = useSupabase();

const OutlineLink = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const getToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token || null);
    };
    getToken();
  }, [supabase]);

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <Link 
      href={`http://localhost:8000/outline?token=${token}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Open Outline
    </Link>
  );
};
```

#### Option B: Using Cookies (Recommended)
Set the token as a cookie that the proxy can read:

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/contexts/SupabaseContext';

const { user } = useAuth();
const { supabase } = useSupabase();

const handleOpenOutline = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (token) {
    // Set token as cookie (same domain as proxy)
    document.cookie = `sb-access-token=${token}; path=/; domain=localhost; max-age=3600`;
    
    // Now open the link
    window.open('http://localhost:8000/outline', '_blank');
  }
};

<button
  onClick={handleOpenOutline}
  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
>
  Open Outline
</button>
```

#### Option C: Automatic Token Handling
If your app already stores the token in localStorage or cookies:

```typescript
import Link from 'next/link';

// The proxy will automatically read the token from:
// 1. Authorization header (if set)
// 2. sb-access-token cookie
// 3. localStorage (if configured)

<Link 
  href="http://localhost:8000/outline" 
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
>
  Open Outline
</Link>
```

### Step 5: Complete Component Example
Here's a complete component example:
```typescript
import Link from 'next/link';

export default function OutlineLink() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-2">
        <Link 
          href="http://localhost:8000/outline" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Open Outline
        </Link>
      </div>
    </div>
  );
}
```

### Step 6: Environment Variable (Optional)
For production, use environment variables:
```typescript
const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:8000';

<Link 
  href={`${PROXY_URL}/outline`} 
  target="_blank"
  rel="noopener noreferrer"
>
  Open Outline
</Link>
```

### Step 7: Add to .env.local
```bash
NEXT_PUBLIC_PROXY_URL=http://localhost:8000
```

## Token Format and Authentication

### Supabase JWT Token Format
The proxy expects the Supabase JWT token in this format:
```
Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IlNncVZIZE9mQ3ZJQjlLQ3oiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3JuZ3d6c2lidmV0YWJpZ3Z3dnBjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmY2E0NDVjMi0zMTdjLTQxZTctYTkxZS1jOGEzYTY0NDJjYTQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyOTIxMjE4LCJpYXQiOjE3NTI5MTc2MTgsImVtYWlsIjoiYWJoaXNoZWsudmVybWEyMDI0QG5zdC5yaXNoaWhvb2QuZWR1LmluIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFiaGlzaGVrLnZlcm1hMjAyNEBuc3QucmlzaGlob29kLmVkdS5pbiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiSm9kZCIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZmNhNDQ1YzItMzE3Yy00MWU3LWE5MWUtYzhhM2E2NDQyY2E0In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTI5MTc2MTh9XSwic2Vzc2lvbl9pZCI6ImFkM2FjODczLTJlYWMtNGExMy1iMTdmLWJhYzAyNzFjNDYwMiIsImlzX2Fub255bW91cyI6ZmFsc2V9.hUraacof8GEW3XVOQfIpPquzuOb0yUGZOMhxG1QA3QI
```

### How the Proxy Reads the Token
The proxy looks for the token in this order:
1. **URL parameter**: `?token=<token>` (primary method)
2. **Authorization header**: `Authorization: Bearer <token>`
3. **Cookie**: `sb-access-token=<token>`

### Getting the Token from Supabase
```typescript
// Method 1: From session
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Method 2: From user
const { data: { user } } = await supabase.auth.getUser();
const token = user?.access_token;

// Method 3: From current session
const { data, error } = await supabase.auth.getSession();
const token = data.session?.access_token;
```

## How it works:
1. User clicks the link
2. Browser opens `http://localhost:8000/outline` in new tab
3. Proxy server receives request with JWT token (from cookies/headers)
4. Proxy authenticates user and injects Outline-specific headers
5. Request gets proxied to Outline service
6. User sees Outline already logged in

## Testing:
1. Ensure proxy server is running on port 8000
2. Ensure Outline service is running on port 3000
3. Click the link from your dashboard
4. Should open Outline in new tab, already authenticated

## Troubleshooting Token Issues

### Common Problems:
1. **Token not found**: Ensure user is logged in to Supabase
2. **Token expired**: Refresh the session before opening Outline
3. **CORS issues**: Make sure both apps are on same domain (localhost)
4. **Cookie not set**: Check domain and path settings

### Debug Token Issues:
```typescript
// Add this to debug token issues
const debugToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session:', session);
  console.log('Token:', session?.access_token);
  console.log('Token length:', session?.access_token?.length);
  
  // Check if token is valid
  if (session?.access_token) {
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('Token expires:', new Date(payload.exp * 1000));
    } catch (e) {
      console.error('Invalid token format');
    }
  }
};
```

### Testing Token Manually:
```bash
# Test with curl (replace with your actual token)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8000/outline/
```

## Notes:
- `target="_blank"` opens in new tab
- `rel="noopener noreferrer"` for security
- JWT token is automatically sent via cookies/headers
- Proxy handles authentication seamlessly
- Token must be valid Supabase JWT format
- Ensure both dashboard and proxy are running 