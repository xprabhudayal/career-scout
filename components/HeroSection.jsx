'use client';

import React, { useEffect, useRef } from 'react';
import { Mic, Search, DollarSign, TrendingUp, Telescope } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

const HeroSection = () => {
  const blobRef = useRef(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize GSAP animations
      const ctx = gsap.context(() => {
        // Animate hero text elements
        gsap.from('.hero-text-animation', {
          y: 30,
          opacity: 0,
          stagger: 0.2,
          duration: 1,
          ease: 'power3.out',
          delay: 0.3,
        });
        
        // Animate hero image
        gsap.from('.hero-image-animation', {
          scale: 0.9,
          opacity: 0,
          duration: 1.5,
          ease: 'power3.out',
          delay: 0.5,
        });
      });
      
      return () => ctx.revert();
    }
  }, []);

  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative">
        {/* Gradient Blob */}
        <div 
          ref={blobRef} 
          className="absolute -top-1/2 right-0 w-3/4 h-3/4 bg-gradient-to-r from-blue-500/30 to-indigo-600/30 rounded-full hero-blob -z-10"
        ></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Text */}
          <div className="max-w-xl">
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 hero-text-animation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Your AI Voice Assistant for the{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-500">
                Job Hunt
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 hero-text-animation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Career Scout uses AI voice technology to help you navigate the job market with ease. 
              Get personalized job recommendations, salary insights, and market trends through 
              natural conversation.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 hero-text-animation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <a 
                href="#waitlist" 
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Mic className="h-5 w-5" />
                <span>Join Waitlist</span>
              </a>
              
              <a 
                href="#how-it-works" 
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <span>Learn More</span>
              </a>
            </motion.div>
          </div>
          
          {/* Hero Image/Animation */}
          <motion.div 
            className="lg:flex items-center justify-center hero-image-animation hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative">
              <div className="absolute -z-10 w-full h-full blur-xl bg-gradient-to-tr from-primary-400/20 to-indigo-500/20 rounded-full transform -translate-y-4 translate-x-4"></div>
              
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
                    <Telescope className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Career Scout</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your job search companion</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-700 dark:text-gray-300">
                    <p>Hello! I'm Career Scout. How can I help with your job search today?</p>
                  </div>
                  
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg ml-6 text-gray-800 dark:text-gray-200">
                    <p>I'm looking for remote software developer jobs</p>
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-700 dark:text-gray-300">
                    <p>Great! I found 24 remote software developer positions. The top opportunities are at Acme Tech, CloudNine, and DevCore. Would you like to hear more about these roles?</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                    <Search className="h-3.5 w-3.5" />
                    <span>Job Search</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Salary Insights</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Market Trends</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 