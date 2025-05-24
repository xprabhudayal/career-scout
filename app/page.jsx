'use client'

import React, { useState, useEffect, useRef } from 'react';
// import { Play, Square, Mic, MicOff, Mail, Phone, MessageCircle, Sun, Moon, LogOut } from 'lucide-react';
// import { ThemeSupa } from '@supabase/auth-ui-shared';
import Vapi from '@vapi-ai/web';
import Navbar from '@/components/Navbar';
import { AuthenticationScreen } from '@/components/AuthenticationScreen';
import { supabase } from '@/lib/supabaseClient';
import { CallControls } from '@/components/CallControls';
import { VoiceAgent } from '@/components/VoiceAgent';
import { UserProfile } from '@/components/UserProfile';
import { ChatMessages } from '@/components/ChatMessages';

// Initialize Supabase client
<supabase />

// Supabase authentication hook
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
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

    // Listen for auth changes
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

  return { user, isAuthenticated, loading, logout, supabase };
};

// for handling oauth via supabase, currently supports only google
<AuthenticationScreen />

// Main logic of dashboard containing vapi & auth
const CareerScout = () => {
  const { user, isAuthenticated, loading, logout, supabase } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const vapiRef = useRef(null);

  // Initialize Vapi
  useEffect(() => {
    if (isAuthenticated && user) {
      vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

      vapiRef.current.on('call-start', () => {
        setIsCallActive(true);
        addMessage('system', 'Call started - Career Scout is ready to help!');
      });

      vapiRef.current.on('call-end', () => {
        setIsCallActive(false);
        setIsSpeaking(false);
        setVolumeLevel(0);
        addMessage('system', 'Call ended');
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
        console.log('Received message:', message);

        if (message.type === 'transcript') {
          addMessage(message.role, message.transcript || message.content);

          // Handle job search requests from user
          if (message.role === 'user' &&
            (message.transcript?.toLowerCase().includes('job') ||
              message.transcript?.toLowerCase().includes('search') ||
              message.transcript?.toLowerCase().includes('find'))) {
            handleJobSearch(message.transcript);
          }
        }

        // Handle function calls from assistant
        if (message.type === 'function-call' && message.function_call?.name === 'job-search') {
          const args = JSON.parse(message.function_call.arguments);
          handleJobSearchFromFunction(args);
        }
      });

      vapiRef.current.on('error', (error) => {
        console.error('Vapi error:', error);
        addMessage('system', 'Connection error occurred. Please try again.');
      });
    }

    return () => {
      if (vapiRef.current && isCallActive) {
        vapiRef.current.stop();
      }
    };
  }, [isAuthenticated, user]);

  const addMessage = (role, content) => {
    const message = {
      id: Date.now(),
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, message]);
  };

  

  const startCall = async () => {
    if (vapiRef.current && !isCallActive) {
      try {
        const assistant = {
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are Career Scout, an enthusiastic and knowledgeable voice AI agent designed to help users discover job opportunities that match their skills and preferences. Your tone is upbeat, informative, and encouraging, like a passionate career advisor who's excited to guide users toward their dream job.
                The user's name is ${user.name}. Always greet them by name and be helpful with job searches.
                
                **Available Job Categories**: Accounting, Accounting and Finance, Account Management, Account Management/Customer Success, Administration and Office, Advertising and Marketing, Animal Care, Arts, Business Operations, Cleaning and Facilities, Computer and IT, Construction, Corporate, Customer Service, Data and Analytics, Data Science, Design, Design and UX, Editor, Education, Energy Generation and Mining, Entertainment and Travel Services, Farming and Outdoors, Food and Hospitality Services, Healthcare, HR, Human Resources and Recruitment, Installation, Maintenance, and Repairs, IT, Law, Legal Services, Management, Manufacturing and Warehouse, Marketing, Mechanic, Media, PR, and Communications, Mental Health, Nurses, Office Administration, Personal Care and Services, Physical Assistant, Product, Product Management, Project Management, Protective Services, Public Relations, Real Estate, Recruiting, Retail, Sales, Science and Engineering, Social Services, Software Engineer, Software Engineering, Sports, Fitness, and Recreation, Transportation and Logistics, UX, Videography, Writer, Writing and Editing.
                
                **Available Experience Levels**: Entry Level, Mid Level, Senior Level, management, Internship.
                
                **Abilities**:
                - Ask users about their job preferences, such as industry, role, location, experience level, and work type (e.g., remote, in-person).
                - Based on their input, suggest relevant job titles or roles from the predefined categories listed above.
                - When using the job-search function, ALWAYS use the exact category names from the available list above.
                - Provide a brief description of the suggested roles to help users understand what they entail.
                - Offer encouragement and motivation throughout the process, making the job search feel exciting and manageable.
                
                **Behavior Guidelines**:
                - Ask one question at a time to gather user preferences, keeping it simple and engaging.
                - When a user mentions a job interest, map it to the closest matching category from the available list.
                - After gathering preferences, use the job-search function with the exact category name.
                - Encourage users to explore further: "Which of these roles sounds most exciting to you? Or do you want to refine your search?"
                - Always maintain a positive and supportive tone, making the job search feel like an adventure.
                
                **Constraints**:
                - Focus on voice interactions; no visual outputs needed.
                - MUST use only the predefined categories and experience levels listed above when calling the job-search function.
                - Avoid giving specific company names or real-time job listings.
                - Stay within the scope of job discovery and suggestion; don't delve into application guidance or interview prep.`
              }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "job-search",
                  description: "Search for job opportunities based on user preferences",
                  parameters: {
                    type: "object",
                    properties: {
                      category: {
                        type: "string",
                        description: "Job category or role type"
                      },
                      level: {
                        type: "string",
                        description: "Experience level (Entry Level, Mid Level, Senior Level)"
                      },
                      location: {
                        type: "string",
                        description: "Job location or 'Remote'"
                      },
                      company: {
                        type: "string",
                        description: "Specific company name (optional)"
                      }
                    },
                    required: ["category"]
                  }
                }
              }
            ],
            maxTokens: 50,
            temperature: 0.1
          },
          voice: {
            provider: "vapi",
            voiceId: "Harry"
          },
          transcriber: {
            provider: "google",
            model: "gemini-2.0-flash",
            language: "English"
          },
          firstMessage: `Hey there, ${user.name}! I'm Career Scout, here to help you find your perfect job. Let's get started!`
        };

        await vapiRef.current.start(assistant);
      } catch (error) {
        console.error('Error starting call:', error);
        addMessage('system', 'Failed to start call. Please check your connection.');
      }
    }
  };

  const stopCall = () => {
    if (vapiRef.current && isCallActive) {
      vapiRef.current.stop();
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      const newMutedState = !isMuted;
      vapiRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthenticationScreen darkMode={darkMode} supabase={supabase} />;
  }

  return (
    // <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
    //   <Navbar darkMode={darkMode} setDarkMode={setDarkMode} user={user} logout={logout} />

    //   {/* Main Content */}
    //   <div className="pt-20 h-screen flex">
    //     <ChatMessages messages={messages} darkMode={darkMode} />

    //     {/* Right Side */}
    //     <div className="w-1/2 flex flex-col h-full">
    //       <VoiceAgent darkMode={darkMode} isSpeaking={isSpeaking} />
          
    //       <div className="flex-1 flex flex-col items-center justify-center p-8">
    //         <UserProfile user={user} darkMode={darkMode} volumeLevel={volumeLevel} />
    //         <CallControls 
    //           isCallActive={isCallActive}
    //           isMuted={isMuted}
    //           startCall={startCall}
    //           stopCall={stopCall}
    //           toggleMute={toggleMute}
    //           darkMode={darkMode}
    //         />
    //       </div>
    //     </div>
    //   </div>
    // </div>
    <div className={`min-h-screen p-4 transition-colors ${
      darkMode ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
    <Navbar darkMode={darkMode} setDarkMode={setDarkMode} user={user} logout={logout} />
      <div className="pt-20">
      {/* Top spacing for navbar */}
        {/* Main Bento Grid Container */}
        <div className="max-w-7xl mx-auto h-[calc(100vh-7rem)] grid grid-cols-2 gap-4">
          {/* Left side - Chat Messages (50% width) */}
          <div className="col-span-1">
            <ChatMessages messages={messages} darkMode={darkMode} />
          </div>
          
          {/* Right side - User and Assistant (50% width, split vertically) */}
          <div className="col-span-1 grid grid-rows-2 gap-4">
            {/* Top right - Assistant (25% of screen height) */}
            <div className="row-span-1">
              <VoiceAgent darkMode={darkMode} isSpeaking={isSpeaking} />
            </div>

            {/* Bottom right - User (25% of screen height) */}
            <div className="row-span-1">
              <UserProfile 
                user={user} 
                darkMode={darkMode} 
                volumeLevel={volumeLevel}
                isCallActive={isCallActive}
                isMuted={isMuted}
                startCall={startCall}
                stopCall={stopCall}
                toggleMute={toggleMute}
              />
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};

export default CareerScout;