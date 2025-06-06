import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Function to safely check user preferences
async function getUserPreferences(supabase, userId) {
  try {
    const { data } = await supabase
      .from('user_preferences')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .single();
    
    return data;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
}

export async function middleware(request) {
  // Create a response object to attach cookies to
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Paths we want to exclude from middleware processing
  const PUBLIC_PATHS = ['/api', '/_next', '/static', '/favicon.ico'];
  const AUTH_PATHS = ['/auth/callback', '/auth/error'];
  
  // Check if path should be excluded
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Processing request for: ${pathname}`);
  
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path)) || AUTH_PATHS.includes(pathname)) {
    console.log(`[Middleware] Skipping middleware for public path: ${pathname}`);
    return response;
  }
  
  // Create supabase client with SSR middleware
  const supabase = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => {
          const cookie = request.cookies.get(name);
          const value = cookie?.value;
          console.log(`[Middleware] Cookie get: ${name}, exists: ${!!value}`);
          return value;
        },
        set: (name, value, options) => {
          console.log(`[Middleware] Cookie set: ${name}`);
          // If we're in a production environment, we need to set the secure flag
          if (process.env.NODE_ENV === 'production') {
            options = { ...options, secure: true };
          }
          request.cookies.set(name, value, options);
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set(name, value, options);
        },
        remove: (name, options) => {
          console.log(`[Middleware] Cookie remove: ${name}`);
          request.cookies.delete(name, options);
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.delete(name, options);
        },
      },
    }
  );
  
  try {
    // Update the session if it exists (refreshes the auth token)
    const sessionResponse = await supabase.auth.getSession();
    console.log(`[Middleware] Session exists: ${!!sessionResponse.data.session}`);
    
    // Get user from session
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`[Middleware] User exists: ${!!user}`);
    
    const url = request.nextUrl.clone();
    
    // Define paths
    const isAuthPage = pathname === '/auth';
    const isOnboardingPage = pathname === '/onboarding';
    const isDashboardPage = pathname === '/' || pathname.startsWith('/dashboard');
    
    // If user is not authenticated and trying to access protected pages
    if (!user && (isOnboardingPage || isDashboardPage)) {
      console.log('[Middleware] User not authenticated, redirecting to auth');
      url.pathname = '/auth';
      return NextResponse.redirect(url);
    }
    
    // If user is authenticated
    if (user) {
      console.log(`[Middleware] User authenticated: ${user.id.substring(0,8)}...`);
      
      // Check if user has completed onboarding
      const userPreferences = await getUserPreferences(supabase, user.id);
      const onboardingCompleted = userPreferences?.onboarding_completed || false;
      console.log(`[Middleware] Onboarding completed: ${onboardingCompleted}`);
      
      // Auth page redirect logic
      if (isAuthPage) {
        url.pathname = onboardingCompleted ? '/dashboard' : '/onboarding';
        console.log(`[Middleware] User authenticated, redirecting to ${url.pathname}`);
        return NextResponse.redirect(url);
      }
      
      // Onboarding complete but trying to access onboarding page
      if (onboardingCompleted && isOnboardingPage) {
        url.pathname = '/dashboard';
        console.log('[Middleware] Onboarding complete, redirecting to dashboard');
        return NextResponse.redirect(url);
      }
      
      // Onboarding incomplete but trying to access dashboard
      if (!onboardingCompleted && isDashboardPage) {
        url.pathname = '/onboarding';
        console.log('[Middleware] Onboarding incomplete, redirecting to onboarding');
        return NextResponse.redirect(url);
      }
    }
    
    console.log(`[Middleware] Proceeding with request: ${pathname}`);
    return response;
  } catch (error) {
    console.error('[Middleware] Error:', error);
    // On error, just proceed with the request to avoid loops
    return response;
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 