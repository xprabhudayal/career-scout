'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useTheme } from './ThemeProvider';
import { supabase, createServiceRoleClient } from '@/lib/supabaseClient';
import { Sun, Moon } from 'lucide-react';

// Step components
const WelcomeStep = ({ onNext }) => {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    
    gsap.fromTo(
      container.querySelector('h1'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    
    gsap.fromTo(
      container.querySelector('p'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
    );
    
    gsap.fromTo(
      container.querySelector('button'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: 'power3.out' }
    );
    
    // Animate the wave
    const waveAnimation = gsap.timeline({
      repeat: -1,
      yoyo: true,
      defaults: { duration: 3, ease: 'sine.inOut' }
    });
    
    waveAnimation.to(
      container.querySelector('.wave'),
      { x: -30, y: -10, rotation: 5 }
    );
    
  }, []);
  
  return (
    <div ref={containerRef} className="text-center flex flex-col items-center justify-center h-full">
      <div className="wave absolute bottom-0 left-0 w-full h-32 opacity-20 z-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230099ff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,229.3C672,224,768,192,864,181.3C960,171,1056,181,1152,197.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          }}
        ></div>
      <h1 className={`text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Welcome to Career Scout
      </h1>
      <p className={`text-xl mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        Let's get you set up
      </p>
      <button
        onClick={onNext}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
      >
        Get Started
      </button>
    </div>
  );
};

const NameStep = ({ onNext, formData, setFormData }) => {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    
    gsap.fromTo(
      container.querySelector('h1'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    
    gsap.fromTo(
      container.querySelector('.input-container'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
    );
    
    gsap.fromTo(
      container.querySelector('button'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: 'power3.out' }
    );
    
    // Focus the input
    inputRef.current?.focus();
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };
  
  const handleChange = (e) => {
    setFormData({ ...formData, name: e.target.value });
  };
  
  return (
    <div ref={containerRef} className="text-center flex flex-col items-center justify-center h-full">
      <h1 className={`text-4xl font-bold mb-10 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        What's your name?
      </h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="input-container mb-8">
          <input
            ref={inputRef}
            type="text"
            value={formData.name || ''}
            onChange={handleChange}
            placeholder="Your name"
            className={`w-full px-4 py-3 text-center text-xl rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 text-white border border-gray-700 focus:border-blue-500' 
                : 'bg-white text-gray-900 border border-gray-300 focus:border-blue-500'
            }`}
            required
          />
        </div>
        <button
          type="submit"
          disabled={!formData.name?.trim()}
          className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors ${
            !formData.name?.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Continue
        </button>
      </form>
    </div>
  );
};

const DescriptionStep = ({ onNext, formData, setFormData }) => {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    
    gsap.fromTo(
      container.querySelector('h1'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    
    gsap.fromTo(
      container.querySelectorAll('.option'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, delay: 0.2, ease: 'power3.out' }
    );
  }, []);
  
  const options = [
    { id: 'developer', label: 'Developer' },
    { id: 'designer', label: 'Designer' },
    { id: 'manager', label: 'Manager' },
    { id: 'student', label: 'Student' },
    { id: 'other', label: 'Other' }
  ];
  
  const handleSelect = (optionId) => {
    setFormData({ ...formData, role: optionId });
    onNext();
  };
  
  return (
    <div ref={containerRef} className="text-center flex flex-col items-center justify-center h-full">
      <h1 className={`text-4xl font-bold mb-10 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        What describes you best?
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`option p-6 rounded-xl transition-colors flex flex-col items-center justify-center ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
            }`}
          >
            <span className="text-lg font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const UsageStep = ({ onNext, formData, setFormData }) => {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    
    gsap.fromTo(
      container.querySelector('h1'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    
    gsap.fromTo(
      container.querySelectorAll('.option'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, delay: 0.2, ease: 'power3.out' }
    );
  }, []);
  
  const options = [
    { id: 'company', label: 'At a company', icon: '🏢' },
    { id: 'agency', label: 'As an agency', icon: '🏬' },
    { id: 'freelancer', label: 'As a freelancer', icon: '👨‍💻' },
    { id: 'school', label: 'At school', icon: '🎓' },
    { id: 'fun', label: 'For fun', icon: '🎮' }
  ];
  
  const handleSelect = (optionId) => {
    setFormData({ ...formData, usage: optionId });
    onNext();
  };
  
  return (
    <div ref={containerRef} className="text-center flex flex-col items-center justify-center h-full">
      <h1 className={`text-4xl font-bold mb-10 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        How will you use Career Scout?
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`option p-6 rounded-xl transition-colors flex flex-col items-center justify-center ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
            }`}
          >
            <span className="text-3xl mb-2">{option.icon}</span>
            <span className="text-lg font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const SuccessStep = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const containerRef = useRef(null);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef(null);
  const redirectionExecuted = useRef(false);
  
  useEffect(() => {
    const container = containerRef.current;
    
    // Confetti animation
    const confettiAnimation = gsap.timeline();
    
    confettiAnimation.fromTo(
      container.querySelector('.confetti'),
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
    );
    
    // Text animation
    gsap.fromTo(
      container.querySelector('h1'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.5, ease: 'power3.out' }
    );
    
    gsap.fromTo(
      container.querySelector('p'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.7, ease: 'power3.out' }
    );
    
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setCountdown(prevCount => prevCount - 1);
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  // Separate effect for redirection to avoid React errors
  useEffect(() => {
    if (countdown <= 0 && !redirectionExecuted.current) {
      // Clear the interval to prevent further countdown
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Set flag to prevent multiple redirects
      redirectionExecuted.current = true;
      
      // Use a setTimeout to avoid React state updates after component unmount
      setTimeout(() => {
        router.push('/dashboard');
      }, 0);
    }
  }, [countdown, router]);
  
  return (
    <div ref={containerRef} className="text-center flex flex-col items-center justify-center h-full">
      <div className="confetti mb-6 text-6xl">
        🎉
      </div>
      <h1 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Success! You're all set
      </h1>
      <p className={`text-xl mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        Redirecting to dashboard in {countdown} seconds...
      </p>
    </div>
  );
};

export function OnboardingFlow({ user }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ name: '', role: '', usage: '' });
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const containerRef = useRef(null);
  const router = useRouter();
  
  const steps = [
    { id: 'welcome', component: WelcomeStep },
    { id: 'name', component: NameStep },
    { id: 'description', component: DescriptionStep },
    { id: 'usage', component: UsageStep },
    { id: 'success', component: SuccessStep }
  ];
  
  // Handle step change with animation
  const goToStep = (index) => {
    const container = containerRef.current;
    
    gsap.to(container.querySelector('.step-content'), {
      opacity: 0,
      x: -50,
      duration: 0.3,
      ease: 'power3.inOut',
      onComplete: () => {
        setStep(index);
        gsap.fromTo(
          container.querySelector('.step-content'),
          { opacity: 0, x: 50 },
          { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }
        );
      }
    });
  };
  
  const handleNext = async () => {
    if (step === steps.length - 2) {
      // Save user preferences before going to the success step
      setLoading(true);
      
      try {
        // Use service role client to bypass RLS for writing to the user_preferences table
        const serviceClient = createServiceRoleClient();
        
        // First check if a preferences record already exists
        const { data: existingPrefs } = await serviceClient
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        const updateData = {
          name: formData.name,
          role: formData.role,
          usage: formData.usage,
          theme: theme,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        };
        
        // Update or insert preferences
        if (existingPrefs) {
          await serviceClient
            .from('user_preferences')
            .update(updateData)
            .eq('user_id', user.id);
        } else {
          await serviceClient
            .from('user_preferences')
            .insert({
              user_id: user.id,
              ...updateData,
              created_at: new Date().toISOString(),
            });
        }
        
        // Force a refresh of the auth session to capture the updated user preferences
        await supabase.auth.refreshSession();
        
      } catch (error) {
        console.error('Error saving preferences:', error);
      } finally {
        setLoading(false);
        goToStep(step + 1); // Go to success step after saving (regardless of errors)
      }
    } else {
      goToStep(step + 1);
    }
  };
  
  const CurrentStep = steps[step].component;
  
  return (
    <div 
      ref={containerRef} 
      className={`min-h-screen transition-colors ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-3 rounded-full transition-colors ${
          theme === 'dark'
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
        }`}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      
      {/* Progress indicator */}
      {step > 0 && step < steps.length - 1 && (
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="flex space-x-2">
            {steps.slice(1, steps.length - 1).map((s, i) => (
              <div
                key={s.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < step 
                    ? 'bg-blue-600' 
                    : i === step - 1 
                      ? 'bg-blue-600' 
                      : theme === 'dark' 
                        ? 'bg-gray-700' 
                        : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Step content */}
      <div className="step-content container mx-auto px-4 h-screen flex items-center justify-center">
        <CurrentStep 
          onNext={handleNext} 
          formData={formData} 
          setFormData={setFormData} 
        />
      </div>
      
      {/* Loading overlay */}
      {loading && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 ${
          theme === 'dark' ? 'bg-black' : 'bg-white'
        }`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
} 