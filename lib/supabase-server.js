import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// For proper Next.js 15 support, always make sure we await cookies
export async function createClient() {
  // Always await cookies() in Next.js 15
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => {
          const cookie = cookieStore.get(name);
          const value = cookie?.value;
          return value;
        },
        set: (name, value, options) => {
          // In Next.js 15, cookies are immutable in route handlers
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error);
            // Silent failure for immutable cookies in route handlers
          }
        },
        remove: (name, options) => {
          try {
            cookieStore.delete(name, options);
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error);
            // Silent failure for immutable cookies in route handlers
          }
        },
      },
    }
  );
} 