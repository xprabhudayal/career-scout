'use client'

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Telescope } from "lucide-react";


// Authentication Component
export const AuthenticationScreen = ({ darkMode, supabase }) => {
  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Telescope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Career Scout</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Your Voice-Powered Job Search Assistant
          </p>
        </div>

        <div className="space-y-4">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  }
                }
              }
            }}
            providers={['google']}
            redirectTo={typeof window !== 'undefined' ? window.location.origin : ''}
            onlyThirdPartyProviders
            theme={darkMode ? 'dark' : 'light'}
          />
        </div>

        <div className="mt-6 text-center">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};