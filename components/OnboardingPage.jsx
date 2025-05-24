'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Vapi from '@vapi-ai/web';
import { supabase } from '@/lib/supabaseClient';
import { Mic, MicOff, MessageCircle, CheckCircle, User, MapPin, Briefcase, Building } from 'lucide-react';

const OnboardingPage = ({ user }) => {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collectedData, setCollectedData] = useState({
    role: '',
    location: '',
    experience: '',
    industry: ''
  });
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const vapiRef = useRef(null);

  // Initialize Vapi for onboarding
  useEffect(() => {
    if (user) {
      vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

      vapiRef.current.on('call-start', () => {
        setIsCallActive(true);
        addMessage('system', 'Welcome! Let\'s get you set up with voice-based onboarding.');
      });

      vapiRef.current.on('call-end', () => {
        setIsCallActive(false);
        setIsSpeaking(false);
        setVolumeLevel(0);
        addMessage('system', 'Onboarding session ended');
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
        console.log('Onboarding message:', message);

        if (message.type === 'transcript') {
          addMessage(message.role, message.transcript || message.content);
          
          // Parse user responses for onboarding data
          if (message.role === 'user') {
            parseOnboardingData(message.transcript);
          }
        }

        // Handle function calls for saving preferences
        if (message.type === 'function-call' && message.function_call?.name === 'save-preferences') {
          const args = JSON.parse(message.function_call.arguments);
          handleSavePreferences(args);
        }
      });

      vapiRef.current.on('error', (error) => {
        console.error('Vapi onboarding error:', error);
        addMessage('system', 'Connection error. Please try again.');
      });

      // Auto-start onboarding call
      startOnboardingCall();
    }

    return () => {
      if (vapiRef.current && isCallActive) {
        vapiRef.current.stop();
      }
    };
  }, [user]);

  const addMessage = (role, content) => {
    const message = {
      id: Date.now(),
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, message]);
  };

  const parseOnboardingData = (transcript) => {
    const text = transcript.toLowerCase();
    
    // Simple parsing logic - can be enhanced with more sophisticated NLP
    if (text.includes('year') || text.includes('experience')) {
      const experienceMatch = text.match(/(\d+)\s*year/);
      if (experienceMatch) {
        setCollectedData(prev => ({ ...prev, experience: `${experienceMatch[1]} years` }));
      }
    }
    
    // Update collected data state for visual feedback
    setCollectedData(prev => ({ ...prev }));
  };

  const handleSavePreferences = async (preferences) => {
    setIsLoading(true);
    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          role: preferences.role || '',
          location: preferences.location || '',
          experience: preferences.experience || '',
          industry: preferences.industry || '',
          onboarded: true
        });

      if (error) {
        console.error('Error saving preferences:', error);
        addMessage('system', 'Error saving your preferences. Please try again.');
        return;
      }

      console.log('Preferences saved:', data);
      setCollectedData(preferences);
      setOnboardingComplete(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Save preferences error:', error);
      addMessage('system', 'Error saving preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startOnboardingCall = async () => {
    if (vapiRef.current && !isCallActive) {
      try {
        const assistant = {
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are Career Scout's onboarding assistant. Your job is to collect user preferences through a friendly, conversational voice interface. The user's name is ${user.name}.

**Your Goal**: Gather 4 key pieces of information:
1. **Role/Job Title** they're looking for
2. **Preferred Location** (city, state, or "Remote")
3. **Experience Level** (Entry Level, Mid Level, Senior Level, or years of experience)
4. **Industry/Domain** of interest

**Conversation Flow**:
- Start with a warm welcome
- Ask ONE question at a time
- Keep responses short and conversational
- Confirm all collected info before saving
- Use the save-preferences function when you have all 4 pieces

**Available Job Categories**: Software Engineering, Marketing, Sales, Design, Product Management, Data Science, Customer Service, HR, Finance, Operations, and others.

**Tone**: Friendly, concise, encouraging. Remember this is voice-only - no typing required from the user!

**Example Flow**:
"Hi ${user.name}! I'm here to personalize your job search. What type of role are you looking for?"
→ "Great! Any preferred location or are you open to remote work?"
→ "Perfect! How many years of experience do you have in this field?"
→ "Excellent! What industry interests you most?"
→ "Got it! Let me confirm: [summary]. I'll save this now!"

Keep it natural and conversational!`
              }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "save-preferences",
                  description: "Save user preferences after collecting all onboarding information",
                  parameters: {
                    type: "object",
                    properties: {
                      role: {
                        type: "string",
                        description: "Job role or title the user is looking for"
                      },
                      location: {
                        type: "string", 
                        description: "Preferred job location or Remote"
                      },
                      experience: {
                        type: "string",
                        description: "Experience level or years of experience"
                      },
                      industry: {
                        type: "string",
                        description: "Industry or domain of interest"
                      }
                    },
                    required: ["role", "location", "experience", "industry"]
                  }
                }
              }
            ],
            maxTokens: 100,
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
          firstMessage: `Hi ${user.name}! Welcome to Career Scout! I'm going to help you set up your job preferences through this voice conversation - no typing needed. Let's start: What type of job role are you looking for?`
        };

        await vapiRef.current.start(assistant);
      } catch (error) {
        console.error('Error starting onboarding call:', error);
        addMessage('system', 'Failed to start onboarding. Please refresh and try again.');
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

  if (onboardingComplete) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center p-8 rounded-2xl bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Onboarding Complete!</h2>
          <p className="text-gray-400 mb-4">Redirecting you to your personalized dashboard...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 transition-colors ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="max-w-4xl mx-auto pt-8 pb-4">
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome to Career Scout! 🎯
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Let's personalize your job search with a quick voice conversation
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-blue-500">
            <MessageCircle className="w-4 h-4" />
            <span>Voice-based setup - no typing required!</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
        {/* Left Side - Conversation */}
        <div className={`rounded-2xl border p-6 flex flex-col ${
          darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Conversation
            </h3>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.role === 'system'
                    ? `${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`
                    : `${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">{message.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isCallActive ? (
              <button
                onClick={startOnboardingCall}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              >
                <Mic className="w-5 h-5" />
                Start Onboarding
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition-colors ${
                    isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={stopCall}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm transition-colors"
                >
                  End Call
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Progress & Info */}
        <div className="space-y-6">
          {/* Voice Indicator */}
          <div className={`rounded-2xl border p-6 text-center ${
            darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
              isSpeaking ? 'bg-blue-500 animate-pulse' : darkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <User className={`w-12 h-12 ${isSpeaking ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isCallActive ? (isSpeaking ? 'Assistant is speaking...' : 'Listening...') : 'Ready to start'}
            </p>
          </div>

          {/* Collected Data Preview */}
          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Your Preferences
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Role: {collectedData.role || 'Not collected yet'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Location: {collectedData.location || 'Not collected yet'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Experience: {collectedData.experience || 'Not collected yet'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Industry: {collectedData.industry || 'Not collected yet'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;