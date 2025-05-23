'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Mic, MicOff, Sun, Moon, Mail, LogOut, Phone, MessageCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Vapi from '@vapi-ai/web';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
          avatar: session.user.user_metadata?.avatar_url,
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
            avatar: session.user.user_metadata?.avatar_url,
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


//Dashboard page
const CareerScout = () => {
  const { user, isAuthenticated, loading, logout, supabase } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [jobResults, setJobResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const vapiRef = useRef(null);
  const messagesEndRef = useRef(null);

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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, content) => {
    const message = {
      id: Date.now(),
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, message]);
  };

  const handleJobSearch = async (query) => {
    setIsLoading(true);

    try {
      // Extract job search parameters from query (this is a simple example)
      const searchParams = {
        category: 'Software Engineer', // You could use NLP to extract this
        level: 'Mid Level',
        location: 'Remote'
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      if (response.ok) {
        const data = await response.json();
        setJobResults(data.response || []);

        // Send results back to assistant
        vapiRef.current?.send({
          type: 'add-message',
          message: {
            role: 'system',
            content: `Found ${data.response?.length || 0} job opportunities. The results are now displayed on the screen.`
          }
        });
      } else {
        console.error('Job search failed:', response.statusText);
        addMessage('system', 'Job search failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during job search:', error);
      addMessage('system', 'Error occurred during job search.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobSearchFromFunction = async (args) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args),
      });

      if (response.ok) {
        const data = await response.json();
        setJobResults(data.response || []);

        // Send function result back to assistant
        vapiRef.current?.send({
          type: 'add-message',
          message: {
            role: 'function',
            name: 'job-search',
            content: JSON.stringify(data.response)
          }
        });
      }
    } catch (error) {
      console.error('Error during function job search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = async () => {
    if (vapiRef.current && !isCallActive) {
      try {
        // Use the assistant ID from your JSON configuration
        const assistantId = '3002f13f-f20f-4e51-8e55-3b36c5bd78c3';

        // Or you can define the assistant inline
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

        // Start the call with the assistant configuration
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

  const sendJobsEmail = async () => {
    try {
      // Mock email sending - replace with actual email service
      addMessage('system', `Job details sent to ${user.email}`);

      // Tell the assistant about the email
      vapiRef.current?.send({
        type: 'add-message',
        message: {
          role: 'system',
          content: 'The job details have been sent to the user\'s email address.'
        }
      });

    } catch (error) {
      console.error('Error sending email:', error);
      addMessage('system', 'Failed to send email. Please try again.');
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
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
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
              redirectTo={window.location.origin}
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
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold">Career Scout</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm">Welcome, {user.name}</span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Chat Interface */}
          <div className={`rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Conversation</h2>
              </div>

              {/* iPhone-style Chat Container */}
              <div className={`relative h-96 ${darkMode ? 'bg-black' : 'bg-gray-100'} rounded-3xl p-4 overflow-hidden`}>
                <div className="h-full flex flex-col">

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-2xl ${message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : message.role === 'system'
                            ? 'bg-yellow-500 text-black rounded-bl-md text-xs'
                            : 'bg-gray-300 text-black rounded-bl-md'
                          }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Status Bar */}
                  {/* <div className="flex justify-center mb-4">
                    <div className={`w-32 h-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-400'} rounded-full`}></div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Voice Interface */}
          <div className={`rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Mic className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Voice Assistant</h2>
              </div>

              {/* Voice Visualizer */}
              <div className="flex justify-center mb-8">
                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${isCallActive
                  ? isSpeaking
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
                  }`}>
                  {isCallActive ? (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                      <div className={`w-8 h-8 rounded-full ${isSpeaking ? 'bg-red-400' : 'bg-white'} transition-colors duration-300`}></div>
                    </div>
                  ) : (
                    <Mic className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Volume Level Indicator */}
              {isCallActive && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-150"
                      style={{ width: `${volumeLevel * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center gap-4 mb-6">
                {!isCallActive ? (
                  <button
                    onClick={startCall}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Call
                  </button>
                ) : (
                  <>
                    <button
                      onClick={toggleMute}
                      className={`p-3 rounded-full transition-colors ${isMuted
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={stopCall}
                      className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Status */}
              <div className="text-center">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isCallActive
                    ? isSpeaking
                      ? 'Assistant is speaking...'
                      : isMuted
                        ? 'Microphone muted'
                        : 'Listening...'
                    : 'Click "Start Call" to begin'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Results Section */}
        {(jobResults.length > 0 || isLoading) && (
          <div className={`mt-8 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Job Opportunities</h2>
                {jobResults.length > 0 && (
                  <button
                    onClick={sendJobsEmail}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email Results
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {jobResults.map((job, index) => (
                    <div key={job.id || index} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>Company: {job.company}</div>
                        <div>Location: {Array.isArray(job.locations) ? job.locations.join(', ') : job.location}</div>
                        <div>Level: {Array.isArray(job.levels) ? job.levels.join(', ') : job.level}</div>
                      </div>
                      {job.categories && Array.isArray(job.categories) && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Categories: {job.categories.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerScout;