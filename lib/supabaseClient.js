'use client'

// Import from @supabase/ssr for Next.js 15+ compatibility
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from "@supabase/supabase-js";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Client-side browser client that works with cookies
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);

// Service role client for admin operations (bypasses RLS)
export const createServiceRoleClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error('Service role key is missing. Admin operations will not work.');
    // Return regular client as fallback
    return supabase;
  }
  return createClient(supabaseUrl, serviceRoleKey);
};

// Create a Supabase client with custom cookies for SSR
export const createServerClient = (cookies) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => cookies.get(name)?.value,
      set: (name, value, options) => {
        cookies.set(name, value, options);
      },
      remove: (name, options) => {
        cookies.set(name, '', options);
      }
    }
  });
};
