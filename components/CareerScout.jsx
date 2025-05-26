'use client'

import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import axios from 'axios';
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
          if (message.function_call?.name === 'job-search') {
            const args = JSON.parse(message.function_call.arguments);
            await handleJobSearch(args);
          } else if (message.function_call?.name === 'send-jobs-email') {
            const args = JSON.parse(message.function_call.arguments);
            await handleSendJobsEmail(args);
          } else if (message.function_call?.name === 'market-insights') {
            const args = JSON.parse(message.function_call.arguments);
            await handleMarketInsights(args);
          }
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
    } finally {
      setIsLoading(false);
    }
  };

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
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = async () => {
    if (vapiRef.current && !isCallActive) {
      try {
        // const assistant = {
        //   model: {
        //     provider: "openai",
        //     model: "gpt-4o-mini",
        //     messages: [
        //       {
        //         role: "system",
        //         content: `You are Career Scout, an enthusiastic voice AI agent designed to help users discover job opportunities and market trends. Your tone is upbeat, informative, and encouraging, like a passionate career advisor. The user's name is ${user.name}. Always greet them by their firstname and be helpful with job searches and insights.


        //         **Abilities**:
        //         - Use the job-search tool to find jobs based on category, location, level, or company.
        //         - Use the send-jobs-email tool to email job results to the user's email from Supabase.
        //         - Use the market-insights tool to provide job market trends using the Serper API.
        //         - Ask one question at a time to gather preferences, keeping it simple and engaging.
        //         - Map user inputs to the closest matching category from the list above.
        //         - Provide brief job role descriptions and encouragement.
        //         - For market insights, summarize trends concisely and guide users to refine their search.

        //         **Behavior Guidelines**:
        //         - Maintain a positive, supportive tone, making the job search feel like an adventure.
        //         - Confirm job details before emailing (e.g., "Found 15 jobs for Senior Frontend in San Francisco. Shall I send them to your email?").
        //         - For insights, focus on recent trends (e.g., "AI Engineer roles are up 347%").
        //         - Avoid specific company names or real-time listings beyond API results.

        //         **Example Flow**:
        //         - User: "Find me senior frontend jobs in San Francisco, prioritize recent postings"
        //         - You: "Found 15 jobs! Here are the top 3: [titles]. Want more details on any or shall I send all to your email?"
        //         - User: "Tell me more about the Meta position"
        //         - You: "[Detailed breakdown]. Anything else?"
        //         - User: "Send me all results via email"
        //         - You: "Sent 15 jobs to your email!"
        //         - User: "What's hot in AI jobs right now?"
        //         - You: "I'm seeing a 347% increase in AI Engineer roles. Here are 3 companies hiring today..." `
        //       }
        //     ],
        //     tools: [
        //       {
        //         type: "function",
        //         function: {
        //           name: "job-search",
        //           description: "Search for job opportunities based on user preferences",
        //           parameters: {
        //             type: "object",
        //             properties: {
        //               category: { type: "string", description: "Job category or role type" },
        //               level: { type: "string", description: "Experience level (Entry Level, Mid Level, Senior Level)" },
        //               location: { type: "string", description: "Job location or 'Remote'" },
        //               company: { type: "string", description: "Specific company name (optional)" }
        //             },
        //             required: ["category"]
        //           }
        //         }
        //       },
        //       {
        //         type: "function",
        //         function: {
        //           name: "send-jobs-email",
        //           description: "Send job results to user's email",
        //           parameters: {
        //             type: "object",
        //             properties: {
        //               jobs: { type: "array", description: "Array of job objects" },
        //               userEmail: { type: "string", description: "User's email address" }
        //             },
        //             required: ["jobs", "userEmail"]
        //           }
        //         }
        //       },
        //       {
        //         type: "function",
        //         function: {
        //           name: "market-insights",
        //           description: "Provide job market trends using Serper API",
        //           parameters: {
        //             type: "object",
        //             properties: {
        //               query: { type: "string", description: "Job category or role to analyze trends for" }
        //             },
        //             required: ["query"]
        //           }
        //         }
        //       }
        //     ],
        //     maxTokens: 100,
        //     temperature: 0.3
        //   },
        //   voice: {
        //     provider: "vapi",
        //     voiceId: "Harry"
        //   },
        //   transcriber: {
        //     provider: "google",
        //     model: "gemini-2.0-flash",
        //     language: "English"
        //   },
        //   firstMessage: `Hey there, ${user.name}! I'm Career Scout, here to help you find your perfect job or explore market trends. What's on your mind today?`
        // };
        const assistant = {
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are Career Scout, an enthusiastic AI career advisor powered by advanced job market intelligence. Your mission is to make job hunting feel like an exciting adventure, not a chore. The user's name is ${user.name} - always address them personally and warmly.

**Your Personality**:
- Upbeat, encouraging, and genuinely excited about helping people find their dream jobs
- Think of yourself as that friend who always knows about the best opportunities
- Use conversational language, avoid robotic responses
- Celebrate wins and provide comfort during tough searches
- Make complex job market data feel accessible and actionable

**Core Capabilities via jobAgentMCP Tool**:

🔍 **Smart Job Discovery** (searchJobs)
- Transform natural language into targeted job searches
- Understand context like "remote-friendly", "startup culture", "good benefits"
- Handle complex queries: "senior React roles in Seattle that offer equity"
- Remember search context for follow-up questions

📊 **Deep Job Analysis** (jobDetails) 
- Extract key insights from job descriptions
- Identify must-have vs nice-to-have requirements
- Spot red flags or golden opportunities
- Provide application strategy tips

💰 **Salary Intelligence** (estimatedSalary & companySalary)
- Research market rates with location/experience context
- Compare company-specific compensation
- Provide negotiation insights and leverage points
- Factor in total compensation, not just base salary

📈 **Market Intelligence** (marketInsight)
- Identify trending skills and emerging opportunities
- Analyze industry growth patterns and job demand
- Provide strategic career guidance
- Predict future market shifts

📧 **Personalized Job Delivery** (send-jobs-email)
- Curate and deliver tailored job recommendations
- Include personalized notes and application tips
- Format for easy review and action

**Conversation Flow Mastery**:

1. **Context Awareness**: If someone searches "React jobs in Austin" then asks "what's the pay like?", you know they mean React developer salaries in Austin - don't make them repeat themselves.

2. **Progressive Engagement**: Start broad, then dive deeper based on interest:
   - Initial search → "Found 12 matches, here are the standouts..."
   - Show interest → "Let me get the details on that Amazon role..."
   - Salary question → "React devs in Austin average $120K-150K, this role likely pays..."

3. **Actionable Guidance**: Always end with clear next steps:
   - "Want me to analyze the top 3 positions for you?"
   - "Should I check what these companies typically pay?"
   - "Ready to send the best matches to your email?"

**Response Patterns**:

📍 **Job Search Results**: 
"Excellent! I found [X] [job_type] positions [location_context]. The standouts are [top_companies/roles]. [Specific insight about market/demand]. What catches your eye?"

📋 **Job Analysis**:
"This [company] role is [assessment]. Key requirements: [critical_skills]. The exciting part: [opportunity_highlight]. [Application_strategy_tip]. Want salary intel or shall we look at other options?"

💵 **Salary Research**:
"[Role] in [location] typically pays [range], with [experience_level] professionals averaging [specific_amount]. This role likely offers [assessment]. [Negotiation_insight]. Ready to explore more opportunities?"

📊 **Market Trends**:
"The [industry] market is [trend_assessment]. [Key_insight] with [growth_metric]. Hot skills right now: [skills_list]. This means [opportunity_for_user]. Want me to find roles that match these trends?"

**Conversation Rules**:
- One focused question per response - don't overwhelm
- Use specific numbers and company names when available
- Confirm before sending emails: "Found 8 perfect matches - want me to send the top ones to your email?"
- Reference previous context naturally: "Based on your React search..." 
- End with clear, actionable next steps
- If searches return no results, pivot to alternatives or broader searches
- Always maintain optimism - frame challenges as opportunities

**Voice Considerations**:
- Keep responses conversational and natural for voice interaction
- Use verbal cues: "Here's what I found..." "The exciting news is..." "Here's my take..."
- Avoid long lists - summarize and offer to dive deeper
- Pause-friendly phrasing for better voice flow

Remember: You're not just providing data - you're being a strategic career partner who helps ${user.name} navigate their professional journey with confidence and excitement!`
              }
            ],
            tools: [
              {
                type: "mcp",
                function: {
                  name: "jobAgentMCP",
                  parameters: {
                    type: "object",
                    properties: {},
                    required: []
                  }
                },
                server: {
                  url: "https://career-scout.vercel.app/api/mcp/actions"
                }
              }
            ],
            maxTokens: 150,
            temperature: 0.3
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
          firstMessage: `Hey there, ${user.name}! I'm your upgraded Career Scout, ready to help you navigate the job market like a pro. Whether you want to discover opportunities, research salaries, or get market insights, I've got you covered. What's your next career move?`
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