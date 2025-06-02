import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Get the search params from the request URL
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const errorCode = requestUrl.searchParams.get('error_code');

    console.log(`[Auth Callback] Starting with code: ${code?.substring(0,10)}...`);
    
    // Handle error cases like expired OTP links
    if (error || errorCode) {
      console.log(`Auth error: ${error}, code: ${errorCode}`);
      const errorParams = new URLSearchParams();
      if (error) errorParams.set('error', error);
      if (errorCode) errorParams.set('error_code', errorCode);
      
      // Pass on any additional error description
      const errorDesc = requestUrl.searchParams.get('error_description');
      if (errorDesc) errorParams.set('error_description', errorDesc);
      
      return NextResponse.redirect(
        new URL(`/auth/error?${errorParams.toString()}`, request.url)
      );
    }

    // Process auth code if present
    if (code) {
      // Create a Supabase client using our improved server client
      console.log(`[Auth Callback] Initializing Supabase client...`);
      const supabase = await createClient();
      console.log(`[Auth Callback] Supabase client created`);
      
      // Exchange the code for a session
      console.log(`[Auth Callback] Exchanging code for session...`);
      const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('[Auth Callback] Error exchanging code for session:', exchangeError.message);
        return NextResponse.redirect(new URL(`/auth?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`, request.url));
      }
      
      console.log(`[Auth Callback] Code exchange successful: ${!!exchangeData}`);
      
      // Create a response for cookies
      const response = NextResponse.redirect(new URL('/onboarding', request.url));
      
      // Check if we have a session after exchange
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Auth Callback] Error getting session:', sessionError.message);
        return NextResponse.redirect(new URL(`/auth?error=session_error&message=${encodeURIComponent(sessionError.message)}`, request.url));
      }
      
      console.log(`[Auth Callback] Session after exchange: ${!!session}`);
      
      if (session) {
        const userId = session.user.id;
        console.log(`[Auth Callback] User authenticated, ID: ${userId.substring(0,8)}...`);
        
        try {
          // Check if user has completed onboarding
          const { data: userPrefs, error: prefsError } = await supabase
            .from('user_preferences')
            .select('onboarding_completed')
            .eq('user_id', userId)
            .single();
            
          if (prefsError && prefsError.code !== 'PGRST116') { // PGRST116 is the "not found" error
            console.error('[Auth Callback] Error fetching user preferences:', prefsError);
          }
            
          console.log(`[Auth Callback] User prefs: ${JSON.stringify(userPrefs)}`);
            
          if (userPrefs?.onboarding_completed) {
            console.log(`[Auth Callback] Onboarding completed, redirecting to dashboard`);
            return NextResponse.redirect(new URL('/dashboard', request.url));
          } else {
            console.log(`[Auth Callback] Onboarding needed, redirecting to onboarding`);
            return NextResponse.redirect(new URL('/onboarding', request.url));
          }
        } catch (dbError) {
          console.error('[Auth Callback] Error fetching user preferences:', dbError);
          // If we can't fetch preferences, assume user needs onboarding
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
      } else {
        console.log(`[Auth Callback] No session data after exchange, redirecting to auth`);
        return NextResponse.redirect(new URL('/auth?error=no_session', request.url));
      }
    }
    
    // Fallback: redirect to auth page if no code or session
    console.log(`[Auth Callback] Fallback redirect to auth page`);
    return NextResponse.redirect(new URL('/auth', request.url));
  } catch (e) {
    console.error('[Auth Callback] Auth callback error:', e);
    return NextResponse.redirect(new URL(`/auth?error=server_error&message=${encodeURIComponent(e.message)}`, request.url));
  }
} 