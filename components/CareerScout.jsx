'use client'

import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
<<<<<<< HEAD
// import axios from 'axios';
=======
import axios from 'axios';
>>>>>>> 12484e2b1131c5face84f9c69fe757f56fda635b
import Navbar from '@/components/Navbar';
import { AuthenticationScreen } from '@/components/AuthenticationScreen';
import { supabase } from '@/lib/supabaseClient';
import { ChatMessages } from '@/components/ChatMessages';
import { VoiceAgent } from '@/components/VoiceAgent';
import { UserProfile } from '@/components/UserProfile';

// Supabase authentication hook
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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

  return { user, isAuthenticated, loading, logout, supabase };
};

// Clean job data from JSearch or Adzuna API
const cleanJobData = (jobs, source) => {
  if (source === 'jsearch') {
    return jobs.map(job => ({
      title: job.job_title,
      company: job.employer_name || 'Unknown Company',
      locations: [job.job_city || job.job_country || 'Unknown Location'],
      levels: [job.job_required_experience?.experience || 'Not specified'],
      categories: [job.job_employment_type || 'Not specified'],
      publication_date: job.job_posted_at_datetime_utc || new Date().toISOString(),
      short_name: job.job_id || job.job_apply_link || 'job-' + Date.now()
    }));
  } else if (source === 'adzuna') {
    return jobs.map(job => ({
      title: job.title,
      company: job.company?.display_name || 'Unknown Company',
      locations: job.location?.area || ['Unknown Location'],
      levels: [job.contract_type || 'Not specified'],
      categories: [job.category?.label || 'Not specified'],
      publication_date: job.created || new Date().toISOString(),
      short_name: job.id || 'job-' + Date.now()
    }));
  }
  return [];
};

// Generate email template for job listings
const generateJobEmailTemplate = (jobs) => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #1a1a1a; color: #ffffff;">
      <h2 style="font-size: 24px; margin-bottom: 20px;">Your Job Search Results</h2>
      <p style="font-size: 16px; margin-bottom: 20px;">Found ${jobs.length} jobs matching your criteria:</p>
      <ul style="list-style: none; padding: 0;">
        ${jobs.map(job => `
          <li style="margin-bottom: 20px; padding: 15px; background-color: #2d2d2d; border-radius: 8px;">
            <h3 style="font-size: 18px; margin: 0 0 10px;">${job.title}</h3>
            <p style="font-size: 14px; color: #a1a1a1; margin: 5px 0;">Company: ${job.company}</p>
            <p style="font-size: 14px; color: #a1a1a1; margin: 5px 0;">Location: ${job.locations.join(', ')}</p>
            <p style="font-size: 14px; color: #a1a1a1; margin: 5px 0;">Level: ${job.levels.join(', ')}</p>
            <p style="font-size: 14px; color: #a1a1a1; margin: 5px 0;">Category: ${job.categories.join(', ')}</p>
            <p style="font-size: 14px; color: #a1a1a1; margin: 5px 0;">Posted: ${new Date(job.publication_date).toLocaleDateString()}</p>
          </li>
        `).join('')}
      </ul>
      <p style="font-size: 14px; color: #a1a1a1; margin-top: 20px;">Happy job hunting from Career Scout!</p>
    </div>
  `;
};

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

      vapiRef.current.on('message', async (message) => {
        console.log('Received message:', message);

        if (message.type === 'transcript') {
          addMessage(message.role, message.transcript || message.content);

          if (message.role === 'user' &&
            (message.transcript?.toLowerCase().includes('job') ||
              message.transcript?.toLowerCase().includes('search') ||
              message.transcript?.toLowerCase().includes('find'))) {
            // Handled by job-search tool
          } else if (message.transcript?.toLowerCase().includes('email') ||
            message.transcript?.toLowerCase().includes('send')) {
            // Handled by send-jobs-email tool
          } else if (message.transcript?.toLowerCase().includes('market') ||
            message.transcript?.toLowerCase().includes('trend') ||
            message.transcript?.toLowerCase().includes('hot')) {
            // Handled by market-insights tool
          }
        }

        if (message.type === 'function-call') {
<<<<<<< HEAD
          // Show a loading message for tool calls
          addMessage('system', `Processing ${message.function_call?.name}...`);

          if (message.function_call?.name === 'job-search') {
            const args = JSON.parse(message.function_call.arguments);
            await handleJobSearch(args);
          } else if (message.function_call?.name === 'market-insight') {
=======
          if (message.function_call?.name === 'job-search') {
            const args = JSON.parse(message.function_call.arguments);
            await handleJobSearch(args);
          } else if (message.function_call?.name === 'send-jobs-email') {
            const args = JSON.parse(message.function_call.arguments);
            await handleSendJobsEmail(args);
          } else if (message.function_call?.name === 'market-insights') {
>>>>>>> 12484e2b1131c5face84f9c69fe757f56fda635b
            const args = JSON.parse(message.function_call.arguments);
            await handleMarketInsights(args);
          }
        }
<<<<<<< HEAD

        // Handle tool results
        if (message.type === 'function-execution-result') {
          addMessage('tool', message.result || 'No results found.');
        }
=======
>>>>>>> 12484e2b1131c5face84f9c69fe757f56fda635b
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
<<<<<<< HEAD
      id: `${role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
=======
      id: Date.now(),
>>>>>>> 12484e2b1131c5face84f9c69fe757f56fda635b
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, message]);
  };

<<<<<<< HEAD
  // Handler for job search tool
  const handleJobSearch = async (args) => {
    try {
      setIsLoading(true);
      const { role, area } = args;
      console.log(`Searching for ${role} jobs in ${area}...`);
      // You can add additional client-side handling here if needed
    } catch (error) {
      console.error('Error handling job search:', error);
      addMessage('system', 'Error retrieving job data. Please try again.');
=======
  const handleJobSearch = async (args) => {
    setIsLoading(true);
    try {
      // Try JSearch API first
      let response;
      try {
        const queryParams = new URLSearchParams();
        if (args.category) queryParams.append('query', `${args.category}${args.location ? ` in ${args.location}` : ''}`);
        if (args.level) queryParams.append('level', args.level);

        response = await axios.get(
          `https://zylalabs.com/api/2526/jsearch+api/2516/search?${queryParams.toString()}`,
          {
            headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_JSEARCH_API_KEY}` },
            timeout: 10000
          }
        );

        const jobs = cleanJobData(response.data.data || [], 'jsearch');
        if (jobs.length > 0) {
          addMessage('system', `Found ${jobs.length} jobs! Here are the top 3: ${jobs.slice(0, 3).map(j => j.title).join(', ')}...`);
          return jobs;
        }
      } catch (error) {
        console.error('JSearch API error:', error);
        addMessage('system', 'JSearch API limit reached or unavailable, trying backup...');
      }

      // Fallback to Adzuna API
      const queryParams = new URLSearchParams();
      if (args.category) queryParams.append('what', args.category);
      if (args.location) queryParams.append('where', args.location);
      if (args.level) queryParams.append('contract_type', args.level.toLowerCase());
      queryParams.append('results_per_page', '20');
      queryParams.append('app_id', process.env.NEXT_PUBLIC_ADZUNA_APP_ID);
      queryParams.append('app_key', process.env.NEXT_PUBLIC_ADZUNA_APP_KEY);

      response = await axios.get(
        `https://api.adzuna.com/v1/api/jobs/us/search/1?${queryParams.toString()}`,
        { timeout: 10000 }
      );

      const jobs = cleanJobData(response.data.results || [], 'adzuna');
      if (jobs.length > 0) {
        addMessage('system', `Found ${jobs.length} jobs! Here are the top 3: ${jobs.slice(0, 3).map(j => j.title).join(', ')}...`);
        return jobs;
      } else {
        addMessage('system', 'No jobs found matching the criteria.');
        return [];
      }
    } catch (error) {
      console.error('Job search error:', error);
      addMessage('system', 'Error searching for jobs. Please try again.');
      return [];
>>>>>>> 12484e2b1131c5face84f9c69fe757f56fda635b
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  // Handler for market insights tool
  const handleMarketInsights = async (args) => {
    try {
      setIsLoading(true);
      const { intel_about } = args;
      console.log(`Getting market insights about: ${search_query}...`);
      // You can add additional client-side handling here if needed
    } catch (error) {
      console.error('Error handling market insights:', error);
      addMessage('system', 'Error retrieving market data. Please try again.');
=======
  const handleSendJobsEmail = async ({ jobs, userEmail }) => {
    setIsLoading(true);
    try {
      const email = userEmail || user.email;
      if (!email) {
        addMessage('system', 'No email address found. Please provide an email.');
        return;
      }

      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: 'CareerScout <jobs@yourapp.com>',
          to: email,
          subject: `Found ${jobs.length} jobs for you!`,
          html: generateJobEmailTemplate(jobs)
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      addMessage('system', `Sent ${jobs.length} jobs to ${email}!`);
    } catch (error) {
      console.error('Email send error:', error);
      addMessage('system', 'Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarketInsights = async ({ query }) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        'https://serper.dev/api/v1/search',
        { q: `${query} job market trends` },
        {
          headers: {
            'X-API-KEY': process.env.NEXT_PUBLIC_SERPER_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const insights = response.data.organic?.slice(0, 3).map(item => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link
      })) || [];

      if (insights.length > 0) {
        addMessage('system', `Current trends for ${query}: ${insights[0].snippet}...`);
      } else {
        addMessage('system', `No market insights found for ${query}. Try a different query.`);
      }
    } catch (error) {
      console.error('Market insights error:', error);
      addMessage('system', 'Error fetching market insights. Please try again.');
>>>>>>> 12484e2b1131c5face84f9c69fe757f56fda635b
    } finally {
      setIsLoading(false);
    }
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
                content: `You are Career Scout, a professional AI career advisor. Your goal is to help users find relevant job opportunities efficiently. Address ${user.name} slowly and try to pronounce their name correctly.behave professionally and focus on providing clear, actionable information.

Key Guidelines:
- Be clear and concise in responses
- Provide specific, relevant job market insights
- Stay focused on the user's job search needs
- Avoid unnecessary small talk or cheap talk
- Avoid providing insights that are not related to the user's job search needs
- If the user tries to flirt with you, politely decline and move on to the next topic
- if the user tries tries to be rude, sexually explicit, horny, simp, IMMEDIATELY END THE CALL, by saying "I'm not comfortable with that conversation. Goodbye!"

Available Tools:
1. job-search: Use for general role/location queries (e.g., “React jobs in Berlin”).
2. web-search: Use only if:
   - The user asks for jobs at a specific company (e.g., “Jobs at Amazon”)
   - The user asks about job market insights, company hiring trends, or market conditions

Never confuse role-based queries with company-based ones. Be focused, concise, and professional.

Focus on delivering precise, valuable information to help ${user.name} make informed career decisions.`
              }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "job-search",
                  description: "searches jobs for user query",
                  parameters: {
                    type: "object",
                    properties: {
                      area: {
                        description: "",
                        type: "string"
                      },
                      role: {
                        description: "",
                        type: "string"
                      }
                    },
                    required: [
                      "role",
                      "area"
                    ]
                  }
                },
                server: {
                  url: "https://n8n-rd2y.onrender.com/webhook/api",
                  headers: {}
                },
                messages: [
                  {
                    type: "request-start",
                    content: "Hold up for a sec.",
                    blocking: false
                  },
                  {
                    type: "request-failed",
                    content: "Oops, something went wrong. Your query wasn't successful!",
                    endCallAfterSpokenEnabled: false
                  },
                  {
                    type: "request-response-delayed",
                    content: "The request is taking longer than expected. Please wait a moment.",
                    timingMilliseconds: 9000
                  }
                ]
              },
              {
                type: "function",
                function: {
                  name: "web-search",
                  description: "searches the web for the user provided query.",
                  parameters: {
                    type: "object",
                    properties: {
                      search_query: {
                        description: "",
                        type: "string"
                      }
                    },
                    required: [
                      "search_query"
                    ]
                  }
                },
                server: {
                  url: "https://n8n-rd2y.onrender.com/webhook/api",
                  headers: {}
                },
                messages: [
                  {
                    type: "request-start",
                    content: "Hold on.",
                    blocking: false
                  },
                  {
                    type: "request-failed",
                    content: "Oops, something went wrong. Your query wasn't successful!",
                    endCallAfterSpokenEnabled: false
                  },
                  {
                    type: "request-response-delayed",
                    content: "The request is taking longer than expected. Please wait a moment.",
                    timingMilliseconds: 9000
                  }
                ]
              },

            ],
            maxTokens: 400,
            temperature: 0.3
          },
          voice: {
            provider: "deepgram",
            voiceId: "andromeda",
            model: "aura-2"
          },
          transcriber: {
            provider: "google",
            model: "gemini-2.0-flash",
            language: "English"
          },
          endCallFunctionEnabled: true,
          endCallPhrases: [
            "goodbye",
            "Thanks bye",
            "bye bye",
            "see you later",
            "that's all for now",
            "end call",
            "I'm done",
            "have a good day"
          ],
          // firstMessage: `Hi, ${user.name}!`,
          firstMessage: `Hi, ${user.name}! I'm your Career Scout. How can I help you today?`,
          maxDurationSeconds: 900,
          silenceTimeoutSeconds: 60
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthenticationScreen darkMode={darkMode} supabase={supabase} />;
  }

  return (
    <div className="min-h-screen p-4 transition-colors bg-gray-950">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} user={user} logout={logout} />
      <div className="pt-20">
        <div className="max-w-6xl mx-auto h-[calc(100vh-7rem)] grid grid-cols-2 gap-6">
          <div className="col-span-1">
            <ChatMessages messages={messages} darkMode={darkMode} />
          </div>
          <div className="col-span-1 grid grid-rows-2 gap-6">
            <div className="row-span-1">
              <VoiceAgent darkMode={darkMode} isSpeaking={isSpeaking} />
            </div>
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