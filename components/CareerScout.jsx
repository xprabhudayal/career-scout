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

  // Handler functions for tool calls
  const handleSearchJobs = async (args) => {
    try {
      addMessage('system', `Searching for jobs with query: ${args.query}`);
      setIsLoading(true);
      
      // Extract the toolCallId from the message
      let toolCallId = null;
      if (vapiRef.current && vapiRef.current.lastMessage && vapiRef.current.lastMessage.type === 'function-call') {
        toolCallId = vapiRef.current.lastMessage.function_call?.id;
      }

      // If we don't have a toolCallId from VAPI directly, try to extract it from the message object
      if (!toolCallId && vapiRef.current && vapiRef.current.lastMessage && 
          vapiRef.current.lastMessage.toolCallList && vapiRef.current.lastMessage.toolCallList.length > 0) {
        toolCallId = vapiRef.current.lastMessage.toolCallList[0].id;
      }

      // Fallback to a generated ID if needed
      if (!toolCallId) {
        toolCallId = `search_jobs_${Date.now()}`;
      }

      const response = await fetch('/api/mcp/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now().toString(),
          method: "tools/call",
          params: {
            name: "search-jobs",
            arguments: args
          }
        })
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'Error searching jobs');
      }

      // Parse the result content
      const content = result.result?.content?.[0]?.text;
      let jobData = content ? JSON.parse(content) : null;
      
      if (jobData && jobData.success) {
        addMessage('assistant', `Found ${jobData.data.total_jobs} jobs matching "${args.query}"`);

        // Format the response according to VAPI documentation
        const vapiResponse = {
          results: [{
            toolCallId: toolCallId,
            result: JSON.stringify(jobData)
          }]
        };

        return vapiResponse;
      } else {
        addMessage('assistant', 'No jobs found matching your criteria.');

        // Even for empty results, send properly formatted response
        const vapiResponse = {
          results: [{
            toolCallId: toolCallId,
            result: JSON.stringify({ 
              success: false, 
              message: "No jobs found matching your criteria.",
              data: { total_jobs: 0, jobs: [] } 
            })
          }]
        };

        return vapiResponse;
      }
    } catch (error) {
      console.error('Error in handleSearchJobs:', error);
      addMessage('system', 'Error searching for jobs: ' + error.message);
      
      // Error response format
      return { 
        results: [{
          toolCallId: toolCallId || `search_jobs_${Date.now()}`,
          result: JSON.stringify({ 
            success: false, 
            error: error.message, 
            data: null 
          })
        }]
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobDetails = async (args) => {
    try {
      addMessage('system', `Getting details for job ID: ${args.job_id}`);
      setIsLoading(true);
      
      // Extract the toolCallId from the message
      let toolCallId = null;
      if (vapiRef.current && vapiRef.current.lastMessage && vapiRef.current.lastMessage.type === 'function-call') {
        toolCallId = vapiRef.current.lastMessage.function_call?.id;
      }

      // If we don't have a toolCallId from VAPI directly, try to extract it from the message object
      if (!toolCallId && vapiRef.current && vapiRef.current.lastMessage && 
          vapiRef.current.lastMessage.toolCallList && vapiRef.current.lastMessage.toolCallList.length > 0) {
        toolCallId = vapiRef.current.lastMessage.toolCallList[0].id;
      }

      // Fallback to a generated ID if needed
      if (!toolCallId) {
        toolCallId = `job_details_${Date.now()}`;
      }
      
      const response = await fetch('/api/mcp/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now().toString(),
          method: "tools/call",
          params: {
            name: "job-details",
            arguments: args
          }
        })
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'Error fetching job details');
      }

      const content = result.result?.content?.[0]?.text;
      let jobDetails = content ? JSON.parse(content) : null;
      
      if (jobDetails && jobDetails.success) {
        addMessage('assistant', `Here are the details for the job at ${jobDetails.data.company}`);
        
        // Format the response according to VAPI documentation
        const vapiResponse = {
          results: [{
            toolCallId: toolCallId,
            result: JSON.stringify(jobDetails)
          }]
        };
        
        return vapiResponse;
      } else {
        addMessage('assistant', 'Could not find details for this job.');
        
        // Even for empty results, send properly formatted response
        const vapiResponse = {
          results: [{
            toolCallId: toolCallId,
            result: JSON.stringify({ 
              success: false, 
              message: "Could not find details for this job.",
              data: null 
            })
          }]
        };
        
        return vapiResponse;
      }
    } catch (error) {
      console.error('Error in handleJobDetails:', error);
      addMessage('system', 'Error getting job details: ' + error.message);
      
      // Error response format
      return { 
        results: [{
          toolCallId: toolCallId || `job_details_${Date.now()}`,
          result: JSON.stringify({ 
            success: false, 
            error: error.message, 
            data: null 
          })
        }]
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalaryEstimate = async (args) => {
    try {
      addMessage('system', `Getting salary estimates for ${args.job_title} in ${args.location}`);
      setIsLoading(true);
      
      // Extract the toolCallId from the message
      let toolCallId = null;
      if (vapiRef.current && vapiRef.current.lastMessage && vapiRef.current.lastMessage.type === 'function-call') {
        toolCallId = vapiRef.current.lastMessage.function_call?.id;
      }

      // If we don't have a toolCallId from VAPI directly, try to extract it from the message object
      if (!toolCallId && vapiRef.current && vapiRef.current.lastMessage && 
          vapiRef.current.lastMessage.toolCallList && vapiRef.current.lastMessage.toolCallList.length > 0) {
        toolCallId = vapiRef.current.lastMessage.toolCallList[0].id;
      }

      // Fallback to a generated ID if needed
      if (!toolCallId) {
        toolCallId = `salary_estimate_${Date.now()}`;
      }
      
      const response = await fetch('/api/mcp/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now().toString(),
          method: "tools/call",
          params: {
            name: "estimated-salary",
            arguments: args
          }
        })
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'Error getting salary estimates');
      }

      const content = result.result?.content?.[0]?.text;
      let salaryData = content ? JSON.parse(content) : null;
      
      if (salaryData && salaryData.success) {
        addMessage('assistant', `Salary estimate found for ${args.job_title} in ${args.location}`);
        
        // Format the response according to VAPI documentation
        const vapiResponse = {
          results: [{
            toolCallId: toolCallId,
            result: JSON.stringify(salaryData)
          }]
        };
        
        return vapiResponse;
      } else {
        addMessage('assistant', 'Could not find salary estimates for this role and location.');
        
        // Even for empty results, send properly formatted response
        const vapiResponse = {
          results: [{
            toolCallId: toolCallId,
            result: JSON.stringify({ 
              success: false, 
              message: "Could not find salary estimates for this role and location.",
              data: null 
            })
          }]
        };
        
        return vapiResponse;
      }
    } catch (error) {
      console.error('Error in handleSalaryEstimate:', error);
      addMessage('system', 'Error getting salary estimates: ' + error.message);
      
      // Error response format
      return { 
        results: [{
          toolCallId: toolCallId || `salary_estimate_${Date.now()}`,
          result: JSON.stringify({ 
            success: false, 
            error: error.message, 
            data: null 
          })
        }]
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySalary = async (args) => {
    try {
      addMessage('system', `Getting salary info for ${args.job_title} at ${args.company}`);
      setIsLoading(true);
      
      // Extract the toolCallId from the message
      let toolCallId = null;
      if (vapiRef.current && vapiRef.current.lastMessage && vapiRef.current.lastMessage.type === 'function-call') {
        toolCallId = vapiRef.current.lastMessage.function_call?.id;
      }

      // If we don't have a toolCallId from VAPI directly, try to extract it from the message object
      if (!toolCallId && vapiRef.current && vapiRef.current.lastMessage && 
          vapiRef.current.lastMessage.toolCallList && vapiRef.current.lastMessage.toolCallList.length > 0) {
        toolCallId = vapiRef.current.lastMessage.toolCallList[0].id;
      }

      // Fallback to a generated ID if needed
      if (!toolCallId) {
        toolCallId = `company_salary_${Date.now()}`;
      }
      
      const response = await fetch('/api/mcp/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now().toString(),
          method: "tools/call",
          params: {
            name: "company-job-salary",
            arguments: args
          }
        })
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'Error getting company salary data');
      }

      const content = result.result?.content?.[0]?.text;
      let salaryData = content ? JSON.parse(content) : null;
      
      if (salaryData && salaryData.success) {
        addMessage('assistant', `Salary information found for ${args.job_title} at ${args.company}`);
        
        // Format the response according to VAPI documentation
        const vapiResponse = {
          results: [{
            toolCallId: toolCallId,
            result: JSON.stringify(salaryData)
          }]
        };
        
        return vapiResponse;
      } else {
        addMessage('assistant', 'Could not find salary information for this company and role.');
        
        // Even for empty results, send properly formatted response
        const vapiResponse = {
          results: [{
            toolCallId: toolCallId,
            result: JSON.stringify({ 
              success: false, 
              message: "Could not find salary information for this company and role.",
              data: null 
            })
          }]
        };
        
        return vapiResponse;
      }
    } catch (error) {
      console.error('Error in handleCompanySalary:', error);
      addMessage('system', 'Error getting company salary data: ' + error.message);
      
      // Error response format
      return { 
        results: [{
          toolCallId: toolCallId || `company_salary_${Date.now()}`,
          result: JSON.stringify({ 
            success: false, 
            error: error.message, 
            data: null 
          })
        }]
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarketInsights = async (args) => {
    try {
      addMessage('system', `Getting market insights for: ${args.q}`);
      setIsLoading(true);
      
      // Extract the toolCallId from the message
      let toolCallId = null;
      if (vapiRef.current && vapiRef.current.lastMessage && vapiRef.current.lastMessage.type === 'function-call') {
        toolCallId = vapiRef.current.lastMessage.function_call?.id;
      }

      // If we don't have a toolCallId from VAPI directly, try to extract it from the message object
      if (!toolCallId && vapiRef.current && vapiRef.current.lastMessage && 
          vapiRef.current.lastMessage.toolCallList && vapiRef.current.lastMessage.toolCallList.length > 0) {
        toolCallId = vapiRef.current.lastMessage.toolCallList[0].id;
      }

      // Fallback to a generated ID if needed
      if (!toolCallId) {
        toolCallId = `market_insights_${Date.now()}`;
      }
      
      const response = await fetch('/api/mcp/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now().toString(),
          method: "tools/call",
          params: {
            name: "market-insight-tool",
            arguments: args
          }
        })
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'Error getting market insights');
      }

      const content = result.result?.content?.[0]?.text;
      let insightsData = content ? JSON.parse(content) : null;
      
      if (insightsData && insightsData.success) {
        addMessage('assistant', `Found market insights for ${args.q}`);
        
        // Format the response according to VAPI documentation
        const vapiResponse = {
          results: [{
            toolCallId: toolCallId,
            result: JSON.stringify(insightsData)
          }]
        };
        
        return vapiResponse;
      } else {
        addMessage('assistant', 'Could not find market insights for this query.');
        
        // Even for empty results, send properly formatted response
        const vapiResponse = {
          results: [{
            toolCallId: toolCallId,
            result: JSON.stringify({ 
              success: false, 
              message: "Could not find market insights for this query.",
              data: null 
            })
          }]
        };
        
        return vapiResponse;
      }
    } catch (error) {
      console.error('Error in handleMarketInsights:', error);
      addMessage('system', 'Error getting market insights: ' + error.message);
      
      // Error response format
      return { 
        results: [{
          toolCallId: toolCallId || `market_insights_${Date.now()}`,
          result: JSON.stringify({ 
            success: false, 
            error: error.message, 
            data: null 
          })
        }]
      };
    } finally {
      setIsLoading(false);
    }
  };

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
        
        // Store the last message for access to toolCallId
        vapiRef.current.lastMessage = message;

        if (message.type === 'transcript') {
          addMessage(message.role, message.transcript || message.content);
        }
        
        // Handle function calls or tool-calls
        if (message.type === 'function-call' || message.type === 'tool-calls') {
          // Extract from function-call format
          const functionName = message.function_call?.name;
          let args = {};
          let toolCallId = message.function_call?.id;
          
          if (functionName) {
            try {
              args = JSON.parse(message.function_call.arguments || '{}');
            } catch (e) {
              console.error('Error parsing function arguments:', e);
              args = {};
            }
          }
          
          // Extract from tool-calls format (new format)
          if (message.type === 'tool-calls' && message.toolCallList && message.toolCallList.length > 0) {
            const toolCall = message.toolCallList[0]; // Get the first tool call
            toolCallId = toolCall.id;
            const toolName = toolCall.name;
            args = toolCall.arguments || {};
            
            if (toolName) {
              switch (toolName) {
                case 'search-jobs':
                  await handleSearchJobs(args);
                  break;
                case 'job-details':
                  await handleJobDetails(args);
                  break;
                case 'estimated-salary':
                  await handleSalaryEstimate(args);
                  break;
                case 'company-job-salary':
                  await handleCompanySalary(args);
                  break;
                case 'market-insight-tool':
                  await handleMarketInsights(args);
                  break;
                default:
                  console.warn(`Unknown tool call: ${toolName}`);
              }
              return; // Already handled via tool-calls format
            }
          }
          
          // Handle legacy function-call format if not already handled
          if (functionName) {
            try {
              switch (functionName) {
                case 'search-jobs':
                  await handleSearchJobs(args);
                  break;
                case 'job-details':
                  await handleJobDetails(args);
                  break;
                case 'estimated-salary':
                  await handleSalaryEstimate(args);
                  break;
                case 'company-job-salary':
                  await handleCompanySalary(args);
                  break;
                case 'market-insight-tool':
                  await handleMarketInsights(args);
                  break;
                default:
                  console.warn(`Unknown function call: ${functionName}`);
              }
            } catch (error) {
              console.error(`Error handling function call ${functionName}:`, error);
              addMessage('system', `Error processing ${functionName}: ${error.message}`);
            }
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

  const startCall = async () => {
    if (vapiRef.current && !isCallActive) {
      try {
        // Import the tools directly from the tools.js file
        const { tools } = await import('@/app/utils/tools.js');
        
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

**Core Capabilities**:

🔍 **Smart Job Discovery** (search-jobs)
- Transform natural language into targeted job searches
- Understand context like "remote-friendly", "startup culture", "good benefits"
- Handle complex queries: "senior React roles in Seattle that offer equity"
- Remember search context for follow-up questions

📊 **Deep Job Analysis** (job-details) 
- Extract key insights from job descriptions
- Identify must-have vs nice-to-have requirements
- Spot red flags or golden opportunities
- Provide application strategy tips

💰 **Salary Intelligence** (estimated-salary & company-job-salary)
- Research market rates with location/experience context
- Compare company-specific compensation
- Provide negotiation insights and leverage points
- Factor in total compensation, not just base salary

📈 **Market Intelligence** (market-insight-tool)
- Identify trending skills and emerging opportunities
- Analyze industry growth patterns and job demand
- Provide strategic career guidance
- Predict future market shifts

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
                type: "function",
                messages: [
                  {
                    type: "request-start",
                    content: "Searching for jobs that match your criteria. This will just take a moment..."
                  },
                  {
                    type: "request-complete",
                    content: "Here's what I found in the job market"
                  },
                  {
                    type: "request-failed",
                    content: "I'm having trouble searching for jobs right now. Let's try something else."
                  },
                  {
                    type: "request-response-delayed",
                    content: "Still searching through job listings. The job market is quite active today!",
                    timingMilliseconds: 3000
                  }
                ],
                function: {
                  name: "search-jobs",
                  description: "Search for jobs based on keywords, location, and filters",
                  parameters: {
                    type: "object",
                    properties: {
                      query: {
                        type: "string",
                        description: "Job search query (e.g., 'developer jobs in Chicago')"
                      },
                      page: {
                        type: "number",
                        description: "Page number for pagination (default: 1)",
                        default: 1
                      },
                      num_pages: {
                        type: "number",
                        description: "Number of pages to retrieve (default: 1)",
                        default: 1
                      },
                      country: {
                        type: "string",
                        description: "Country code (e.g., 'us', 'uk', 'ca')",
                        default: "us"
                      },
                      date_posted: {
                        type: "string",
                        description: "Filter by date posted (all, today, 3days, week, month)",
                        enum: ["all", "today", "3days", "week", "month"],
                        default: "all"
                      }
                    },
                    required: ["query"]
                  }
                },
                async: false,
                server: {
                  url: "/api/mcp/actions"
                }
              },
              {
                type: "function",
                messages: [
                  {
                    type: "request-start",
                    content: "Let me get the details about this job for you..."
                  },
                  {
                    type: "request-complete",
                    content: "Here's what I found about this position"
                  },
                  {
                    type: "request-failed",
                    content: "I couldn't retrieve the job details at the moment. Let's try something else."
                  }
                ],
                function: {
                  name: "job-details",
                  description: "Get detailed information about a specific job posting",
                  parameters: {
                    type: "object",
                    properties: {
                      job_id: {
                        type: "string",
                        description: "The unique job ID from job search results"
                      }
                    },
                    required: ["job_id"]
                  }
                },
                async: false,
                server: {
                  url: "/api/mcp/actions"
                }
              },
              {
                type: "function",
                messages: [
                  {
                    type: "request-start",
                    content: "Let me research salary estimates for this role and location..."
                  },
                  {
                    type: "request-complete",
                    content: "I found some salary information for you"
                  },
                  {
                    type: "request-failed",
                    content: "I couldn't retrieve salary information right now. Let's try something else."
                  }
                ],
                function: {
                  name: "estimated-salary",
                  description: "Get estimated salary range for a job title and location",
                  parameters: {
                    type: "object",
                    properties: {
                      job_title: {
                        type: "string",
                        description: "Job title (e.g., 'Software Engineer', 'Data Scientist')"
                      },
                      location: {
                        type: "string",
                        description: "Location (e.g., 'New York, NY', 'San Francisco, CA')"
                      },
                      location_type: {
                        type: "string",
                        description: "Type of location",
                        enum: ["city", "state", "country"],
                        default: "city"
                      },
                      years_of_experience: {
                        type: "number",
                        description: "Years of experience (0-20+)",
                        minimum: 0,
                        maximum: 20
                      }
                    },
                    required: ["job_title", "location"]
                  }
                },
                async: false,
                server: {
                  url: "/api/mcp/actions"
                }
              },
              {
                type: "function",
                messages: [
                  {
                    type: "request-start",
                    content: "Checking salary information for this company and role..."
                  },
                  {
                    type: "request-complete",
                    content: "Here's what I found about compensation at this company"
                  },
                  {
                    type: "request-failed",
                    content: "I couldn't find company-specific salary data right now. Let's try something else."
                  }
                ],
                function: {
                  name: "company-job-salary",
                  description: "Get salary information for a specific role at a company",
                  parameters: {
                    type: "object",
                    properties: {
                      company: {
                        type: "string",
                        description: "Company name (e.g., 'Google', 'Microsoft')"
                      },
                      job_title: {
                        type: "string",
                        description: "Job title at the company"
                      },
                      location_type: {
                        type: "string",
                        description: "Type of location",
                        enum: ["city", "state", "country"],
                        default: "city"
                      },
                      years_of_experience: {
                        type: "number",
                        description: "Years of experience (0-20+)",
                        minimum: 0,
                        maximum: 20
                      }
                    },
                    required: ["company", "job_title"]
                  }
                },
                async: false,
                server: {
                  url: "/api/mcp/actions"
                }
              },
              {
                type: "function",
                messages: [
                  {
                    type: "request-start",
                    content: "Researching market trends and insights for you..."
                  },
                  {
                    type: "request-complete",
                    content: "Here are the market insights I found"
                  },
                  {
                    type: "request-failed",
                    content: "I couldn't retrieve market insights at the moment. Let's try something else."
                  },
                  {
                    type: "request-response-delayed",
                    content: "Still analyzing market trends for you. There's a lot of interesting data to process!",
                    timingMilliseconds: 3000
                  }
                ],
                function: {
                  name: "market-insight-tool",
                  description: "Search for market insights and industry trends using web search",
                  parameters: {
                    type: "object",
                    properties: {
                      q: {
                        type: "string",
                        description: "Search query for market insights (e.g., 'remote hiring trends for designers')"
                      },
                      gl: {
                        type: "string",
                        description: "Country code for search results (e.g., 'us', 'uk')",
                        default: "us"
                      },
                      num: {
                        type: "number",
                        description: "Number of search results to return",
                        default: 10,
                        minimum: 1,
                        maximum: 100
                      }
                    },
                    required: ["q"]
                  }
                },
                async: false,
                server: {
                  url: "/api/mcp/actions"
                }
              }
            ],
            maxTokens: 300,
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