'use client';

import React, { useEffect } from 'react';
import { Search, DollarSign, TrendingUp, Mic, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const FeaturesSection = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      
      const ctx = gsap.context(() => {
        // Animate feature cards
        gsap.from('.feature-card', {
          y: 60,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.features-section',
            start: 'top 70%',
          },
        });
        
        // Animate section title
        gsap.from('.section-title', {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.features-section',
            start: 'top 80%',
          },
        });
      });
      
      return () => ctx.revert();
    }
  }, []);

  return (
    <section className="py-16 md:py-24 features-section" id="features">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 section-title">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Supercharge Your Job Search with AI Voice Technology
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Career Scout combines advanced AI with natural conversation to make finding your next role easier and more efficient.
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <motion.div 
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full w-fit mb-5">
              <Search className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Smart Job Discovery
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Find relevant jobs through natural conversation. Simply describe what you're looking for, and Career Scout will search the market for you.
            </p>
            
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Conversational search queries</span>
              </li>
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Context-aware results</span>
              </li>
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Personalized recommendations</span>
              </li>
            </ul>
          </motion.div>
          
          {/* Feature 2 */}
          <motion.div 
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full w-fit mb-5">
              <DollarSign className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Salary Intelligence
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get accurate salary information for any role and location. Understand your market value and negotiate with confidence.
            </p>
            
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Location-based salary data</span>
              </li>
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Company-specific compensation</span>
              </li>
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Negotiation insights</span>
              </li>
            </ul>
          </motion.div>
          
          {/* Feature 3 */}
          <motion.div 
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full w-fit mb-5">
              <TrendingUp className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Market Insights
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Stay informed about industry trends, skill demands, and emerging opportunities to make strategic career decisions.
            </p>
            
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Trending skills analysis</span>
              </li>
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Industry growth patterns</span>
              </li>
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Strategic career guidance</span>
              </li>
            </ul>
          </motion.div>
          
          {/* Feature 4 */}
          <motion.div 
            className="feature-card md:col-span-2 lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full w-fit mb-5">
              <Mic className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Voice-First Experience
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Interact with Career Scout through natural conversation. Ask questions, get detailed answers, and follow up just like talking to a human career advisor.
            </p>
            
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Natural conversation flow</span>
              </li>
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Context-aware responses</span>
              </li>
              <li className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span>Hands-free operation</span>
              </li>
            </ul>
          </motion.div>
        </div>
        
        <div className="mt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <a 
              href="#waitlist"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <span>Try Career Scout</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 