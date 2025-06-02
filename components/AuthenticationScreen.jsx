'use client'

import { useState, useEffect, useRef } from 'react';
import { Telescope } from "lucide-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { gsap } from 'gsap';

export const AuthenticationScreen = ({ supabase }) => {
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Refs for GSAP animations
  const containerRef = useRef(null);
  const emailButtonRef = useRef(null);
  const emailFormRef = useRef(null);

  // Initialize GSAP animations
  useEffect(() => {
    gsap.set(emailFormRef.current, {
      y: 10,
      opacity: 0,
      pointerEvents: 'none'
    });
  }, []);

  const handleContinueWithEmail = () => {
    // Animate email button out
    gsap.to(emailButtonRef.current, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      ease: 'power2.out',
      pointerEvents: 'none'
    });

    // Animate email form in
    gsap.to(emailFormRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      delay: 0.2,
      ease: 'power2.out',
      pointerEvents: 'all',
      onComplete: () => {
        setShowEmailInput(true);
        // Focus the email input after animation
        emailFormRef.current.querySelector('input').focus();
      }
    });
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      // Unified auth flow - send magic link for both sign-up and sign-in
      const response = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        }
      });

      if (!response.error) {
        setMessage('Check your email for the Magic link to continue.');
      } else {
        setMessage('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleEmailSubmit();
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
        }
      });

      if (error) {
        setMessage('Error signing in with Google. Please try again.');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
      <div className="w-full max-w-sm mx-4" ref={containerRef}>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-12 pb-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-10 h-10 bg-[#007AFF] rounded-xl flex items-center justify-center mr-3">
                <Telescope className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Career Scout
              </h1>
            </div>
            <p className="text-gray-600 text-base">
              We'll sign you in, or create an account if you don't have one yet.
            </p>
          </div>

          {/* Auth Content */}
          <div className="px-8 pb-8 flex space-between">
            <div className="space-y-4 w-full">
              {/* Google Button */}
              <button
                onClick={handleGoogleAuth}
                className="w-full h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-gray-700 font-medium">Continue with Google</span>
              </button>

              {/* Email Button with Animation - Enhanced layout */}
              <div className="relative min-h-[120px]">
                <button
                  ref={emailButtonRef}
                  onClick={handleContinueWithEmail}
                  className="w-full h-12 bg-[#007AFF] hover:bg-[#0071e3] text-white rounded-xl font-medium transition-all duration-300"
                >
                  Continue with email
                </button>

                {/* Sliding Email Form */}
                <div
                  ref={emailFormRef}
                  className="absolute top-0 left-0 right-0 z-10 bg-inherit"
                >
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Enter your email"
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all text-gray-900 placeholder-gray-500"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    <button
                      onClick={handleEmailSubmit}
                      disabled={loading || !email.trim()}
                      className="w-full h-12 bg-[#007AFF] hover:bg-[#0071e3] disabled:bg-[#80bdff] text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center"
                    >
                      {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        'Continue with email'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Message Display - Improved positioning */}
              {message && (
                <div className={`p-3 rounded-xl text-sm mt-8 z-20 relative transition-all duration-300 ${message.includes('Check')
                    ? 'bg-[#e8f5e9] text-[#1b5e20] border border-[#a5d6a7]'
                    : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Footer with adjusted padding */}
          <div className="px-8 pb-8 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              By clicking "Continue", you agree to the{' '}
              <a href="#" className="text-[#007AFF] hover:text-[#0071e3]">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#007AFF] hover:text-[#0071e3]">
                Privacy policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};