import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Main app Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Outline app Supabase configuration
const outlineSupabaseUrl = process.env.OUTLINE_SUPABASE_URL;
const outlineSupabaseKey = process.env.OUTLINE_SUPABASE_ANON_KEY;
const outlineSupabaseServiceKey = process.env.OUTLINE_SUPABASE_SERVICE_ROLE_KEY;

// Create clients only if credentials are provided
let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;
let outlineSupabase: SupabaseClient | null = null;
let outlineSupabaseAdmin: SupabaseClient | null = null;

// Initialize main app Supabase client
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Main Supabase client initialized successfully');
    
    // Optional: Create admin client if service key is provided
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('✅ Main Supabase admin client initialized successfully');
    }
  } catch (error) {
    console.error('❌ Failed to initialize main Supabase client:', error);
  }
} else {
  console.log('⚠️  Main Supabase credentials not provided. Main app functionality will be disabled.');
}

// Initialize Outline app Supabase client
if (outlineSupabaseUrl && outlineSupabaseKey) {
  try {
    outlineSupabase = createClient(outlineSupabaseUrl, outlineSupabaseKey);
    console.log('✅ Outline Supabase client initialized successfully');
    
    // Create admin client for Outline if service key is provided
    if (outlineSupabaseServiceKey) {
      outlineSupabaseAdmin = createClient(outlineSupabaseUrl, outlineSupabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('✅ Outline Supabase admin client initialized successfully');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Outline Supabase client:', error);
  }
} else {
  console.log('⚠️  Outline Supabase credentials not provided. Outline session checking will be disabled.');
}

// Helper function to get main supabase client safely
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Main Supabase client is not initialized. Please check your environment variables.');
  }
  return supabase;
}

// Helper function to get main admin client safely
export function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error('Main Supabase admin client is not initialized. Please check your SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
  return supabaseAdmin;
}

// Helper function to get outline supabase client safely
export function getOutlineSupabaseClient(): SupabaseClient {
  if (!outlineSupabase) {
    throw new Error('Outline Supabase client is not initialized. Please check your OUTLINE_SUPABASE_URL and OUTLINE_SUPABASE_ANON_KEY environment variables.');
  }
  return outlineSupabase;
}

// Helper function to get outline admin client safely
export function getOutlineSupabaseAdminClient(): SupabaseClient {
  if (!outlineSupabaseAdmin) {
    throw new Error('Outline Supabase admin client is not initialized. Please check your OUTLINE_SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
  return outlineSupabaseAdmin;
}

// Export clients (can be null)
export { supabase, supabaseAdmin, outlineSupabase, outlineSupabaseAdmin };

// Export flags to check if Supabase is available
export const isMainSupabaseAvailable = !!supabase;
export const isOutlineSupabaseAvailable = !!outlineSupabase;