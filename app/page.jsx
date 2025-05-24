'use client'

import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import Navbar from '@/components/Navbar';
import { AuthenticationScreen } from '@/components/AuthenticationScreen';
import { supabase } from '@/lib/supabaseClient';
import { CallControls } from '@/components/CallControls';
import { VoiceAgent } from '@/components/VoiceAgent';
import { UserProfile } from '@/components/UserProfile';
import { ChatMessages } from '@/components/ChatMessages';
import OnboardingPage from '@/components/OnboardingPage';


// Updated useAuth hook with onboarding check
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState(null);

  const checkOnboardingStatus = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('onboarded')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console. error('Error checking onboarding status:', error);
        return false;
      }

      return data?.onboarded || false;
    } catch (error) {
      console.error('Onboarding check error:', error);
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else if (session?.user) {
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          avatar: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&auto=format',
          provider: session.user.app_metadata?.provider
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Check onboarding status
        const isOnboarded = await checkOnboardingStatus(session.user.id);
        setOnboardingStatus(isOnboarded);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            avatar: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&auto=format',
            provider: session.user.app_metadata?.provider
          };
          
          setUser(userData);
          setIsAuthenticated(true);
          
          // Check onboarding status
          const isOnboarded = await checkOnboardingStatus(session.user.id);
          setOnboardingStatus(isOnboarded);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setOnboardingStatus(null);
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

  const updateOnboardingStatus = (status) => {
    setOnboardingStatus(status);
  };

  return { 
    user, 
    isAuthenticated, 
    loading, 
    logout, 
    onboardingStatus,
    updateOnboardingStatus,
    supabase 
  };
};

// Main logic of dashboard containing vapi & auth
const CareerScout = () => {
  const { user, isAuthenticated, loading, logout, onboardingStatus, updateOnboardingStatus } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);

  const vapiRef = useRef(null);

  // Load user preferences for personalized job search
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (isAuthenticated && user && onboardingStatus) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error loading preferences:', error);
          } else {
            setUserPreferences(data);
          }
        } catch (error) {
          console.error('Load preferences error:', error);
        }
      }
    };

    loadUserPreferences();
  }, [isAuthenticated, user, onboardingStatus]);

  // Initialize Vapi with personalized assistant
  useEffect(() => {
    if (isAuthenticated && user && onboardingStatus) {
      vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

      vapiRef.current.on('call-start', () => {
        setIsCallActive(true);
        const welcomeMessage = userPreferences 
          ? `Welcome back, ${user.name}! I'm ready to help you find ${userPreferences.role} positions in ${userPreferences.location}.`
          : `Welcome ${user.name}! I'm your AI Career Scout, ready to help you find your dream job.`;
        
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'assistant',
          content: welcomeMessage,
          timestamp: new Date()
        }]);
      });

      vapiRef.current.on('call-end', () => {
        setIsCallActive(false);
        setIsSpeaking(false);
        setVolumeLevel(0);
      });

      vapiRef.current.on('speech-start', () => {
        setIsSpeaking(true);
      });

      vapiRef.current.on('speech-end', () => {
        setIsSpeaking(false);
      });

      vapiRef.current.on('volume-level', (volume) => {
        setVolumeLevel(volume);
      });

      vapiRef.current.on('message', (message) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          if (message.role === 'user') {
            setMessages(prev => [...prev, {
              id: Date.now(),
              type: 'user',
              content: message.transcript,
              timestamp: new Date()
            }]);
          } else if (message.role === 'assistant') {
            setMessages(prev => [...prev, {
              id: Date.now(),
              type: 'assistant',
              content: message.transcript,
              timestamp: new Date()
            }]);
          }
        }

        // Handle function calls for job search
        if (message.type === 'function-call' && message.functionCall?.name === 'searchJobs') {
          handleJobSearch(message.functionCall.parameters);
        }
      });

      vapiRef.current.on('error', (error) => {
        console.error('Vapi error:', error);
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'system',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        }]);
      });
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, [isAuthenticated, user, onboardingStatus, userPreferences]);

  // Handle job search function calls
  const handleJobSearch = async (parameters) => {
    setIsLoading(true);
    try {
      const searchParams = {
        query: parameters.query || userPreferences?.role || '',
        location: parameters.location || userPreferences?.location || '',
        experienceLevel: parameters.experienceLevel || userPreferences?.experience_level || '',
        industry: parameters.industry || userPreferences?.industry || '',
        limit: parameters.limit || 10
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      const data = await response.json();
      
      if (data.success) {
        const jobsMessage = `Found ${data.jobs.length} jobs matching your criteria. Here are the top results:\n\n${data.jobs.slice(0, 3).map(job => 
          `• ${job.title} at ${job.company}\n  Location: ${job.location}\n  ${job.description.slice(0, 100)}...`
        ).join('\n\n')}`;

        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'assistant',
          content: jobsMessage,
          timestamp: new Date(),
          jobs: data.jobs
        }]);

        // Send response back to Vapi
        if (vapiRef.current) {
          vapiRef.current.send({
            type: 'add-message',
            message: {
              role: 'system',
              content: `Job search completed. Found ${data.jobs.length} jobs. Summarize the top 3 results for the user.`
            }
          });
        }
      }
    } catch (error) {
      console.error('Job search error:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: 'Sorry, I had trouble searching for jobs. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create personalized assistant configuration
  const createAssistantConfig = () => {
    const basePrompt = `You are Career Scout, an AI career advisor helping users find their perfect job. You are friendly, professional, and knowledgeable about the job market.`;
    
    const personalizedPrompt = userPreferences 
      ? `${basePrompt}

User Profile:
- Name: ${user.name}
- Looking for: ${userPreferences.role} positions
- Location: ${userPreferences.location}
- Experience Level: ${userPreferences.experience_level}
- Industry: ${userPreferences.industry}
- Skills: ${userPreferences.skills || 'Not specified'}

Use this information to provide personalized job search assistance. When searching for jobs, prioritize positions that match their preferences.`
      : basePrompt;

    return {
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: personalizedPrompt
          }
        ],
        functions: [
          {
            name: "searchJobs",
            description: "Search for job opportunities based on user criteria",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Job title or keywords to search for"
                },
                location: {
                  type: "string",
                  description: "Location to search in"
                },
                experienceLevel: {
                  type: "string",
                  description: "Experience level (entry, mid, senior)"
                },
                industry: {
                  type: "string",
                  description: "Industry or field"
                },
                limit: {
                  type: "number",
                  description: "Number of jobs to return (max 20)"
                }
              },
              required: ["query"]
            }
          }
        ]
      },
      voice: {
        provider: "11labs",
        voiceId: "pNInz6obpgDQGcFmaJgB", // Professional, friendly voice
      },
      firstMessage: userPreferences 
        ? `Hi ${user.name}! I'm ready to help you find ${userPreferences.role} opportunities in ${userPreferences.location}. What would you like to explore today?`
        : `Hi ${user.name}! I'm your AI Career Scout. I can help you search for jobs, get career advice, and more. How can I assist you today?`
    };
  };

  // Start voice call
  const startCall = async () => {
    if (vapiRef.current && !isCallActive) {
      try {
        await vapiRef.current.start(createAssistantConfig());
      } catch (error) {
        console.error('Failed to start call:', error);
      }
    }
  };

  // End voice call
  const endCall = () => {
    if (vapiRef.current && isCallActive) {
      vapiRef.current.stop();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Authentication screen
  if (!isAuthenticated) {
    return <AuthenticationScreen darkMode={darkMode} />;
  }

  // Onboarding screen
  if (onboardingStatus === false) {
    return (
      <OnboardingPage 
        user={user}
        onComplete={() => updateOnboardingStatus(true)}
        supabase={supabase}
      />
    );
  }

  // Main dashboard
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <Navbar 
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        logout={logout}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Chat Messages */}
          <div className="lg:col-span-2">
            <ChatMessages 
              messages={messages}
              isLoading={isLoading}
              darkMode={darkMode}
            />
          </div>
          
          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Voice Agent */}
            <VoiceAgent 
              isCallActive={isCallActive}
              isSpeaking={isSpeaking}
              volumeLevel={volumeLevel}
              onStartCall={startCall}
              onEndCall={endCall}
              darkMode={darkMode}
            />
            
            {/* Call Controls */}
            {isCallActive && (
              <CallControls 
                isMuted={isMuted}
                onToggleMute={toggleMute}
                onEndCall={endCall}
                darkMode={darkMode}
              />
            )}
            
            {/* User Profile */}
            <UserProfile 
              user={user}
              preferences={userPreferences}
              darkMode={darkMode}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CareerScout;