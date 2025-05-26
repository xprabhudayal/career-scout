'use client';

import React, { useEffect } from 'react';
import { Mic, Search, DollarSign, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const HowItWorksSection = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      
      const ctx = gsap.context(() => {
        // Animate steps
        gsap.from('.step-item', {
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.3,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.how-it-works-section',
            start: 'top 70%',
          },
        });
      });
      
      return () => ctx.revert();
    }
  }, []);

  const steps = [
    {
      icon: <Mic className="h-8 w-8 text-primary-600 dark:text-primary-400" />,
      title: 'Start a Voice Conversation',
      description: 'Simply open Career Scout and start talking naturally. Tell it what you\'re looking for in your next job or ask about current market trends.',
      delay: 0.1,
    },
    {
      icon: <Search className="h-8 w-8 text-primary-600 dark:text-primary-400" />,
      title: 'Get Personalized Results',
      description: 'Career Scout understands your needs and searches through thousands of jobs to find the best matches for your skills and preferences.',
      delay: 0.2,
    },
    {
      icon: <DollarSign className="h-8 w-8 text-primary-600 dark:text-primary-400" />,
      title: 'Explore Opportunities & Insights',
      description: 'Dive deeper into specific jobs, ask about salary ranges, or explore market insights to make informed career decisions.',
      delay: 0.3,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50 how-it-works-section" id="how-it-works">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How Career Scout Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Finding your next career opportunity has never been easier with our voice-first AI assistant.
            </p>
          </motion.div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-200 dark:bg-primary-900/50 hidden md:block"></div>
            
            {/* Steps */}
            <div className="space-y-12 md:space-y-16 relative">
              {steps.map((step, index) => (
                <motion.div 
                  key={index}
                  className="flex flex-col md:flex-row items-start gap-6 step-item"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: step.delay }}
                >
                  <div className="relative">
                    <div className="flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 z-10">
                      {step.icon}
                    </div>
                    <div className="absolute top-0 left-8 -mt-6 text-gray-400 dark:text-gray-500 text-sm font-semibold hidden md:block">
                      Step {index + 1}
                    </div>
                  </div>
                  
                  <div className="md:pt-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="inline-flex items-center bg-white dark:bg-gray-800 px-8 py-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Ready to transform your job search?
                </p>
                <ArrowRight className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <a 
                  href="#waitlist" 
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  Join Waitlist
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection; 