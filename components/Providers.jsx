'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { supabase } from '@/lib/supabaseClient';

// Auth context
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          avatar: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&auto=format',
          provider: session.user.app_metadata?.provider
        });
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            avatar: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&auto=format',
            provider: session.user.app_metadata?.provider
          });
          setIsAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Fetch and set theme preference from user preferences if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchThemePreference = async () => {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', user.id)
          .single();
        
        if (data?.theme && !error) {
          setTheme(data.theme);
        }
      };
      
      fetchThemePreference();
    }
  }, [isAuthenticated, user]);
  
  // Auth context value
  const authValue = {
    user,
    isAuthenticated,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <ThemeProvider defaultTheme="light" storageKey="career-scout-theme">
        {children}
      </ThemeProvider>
    </AuthContext.Provider>
  );
} 