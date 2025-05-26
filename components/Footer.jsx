'use client';

import React, { useState } from 'react';
import { Telescope, Linkedin, Mail, Github } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate email
      if (!email || !email.includes('@') || !email.includes('.')) {
        throw new Error('Please enter a valid email address');
      }

      // Submit to Supabase
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, created_at: new Date().toISOString() }]);

      if (error) throw error;

      setSubmitStatus({
        success: true,
        message: 'Thank you! You\'ve been added to our waitlist.',
      });
      setEmail('');
    } catch (error) {
      console.error('Error submitting to waitlist:', error);
      setSubmitStatus({
        success: false,
        message: error.message || 'Failed to join waitlist. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 py-16" id="contact-section">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column - About & Contact */}
          <div className="space-y-8">
            <div className="flex items-center space-x-2">
              <Telescope className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-500">
                Career Scout
              </span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Your AI-powered voice assistant for navigating the job market with ease. 
              Get personalized job recommendations, salary insights, and market trends.
            </p>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Contact
              </h3>
              
              <div className="space-y-3">
                <a 
                  href="http://linkedin.com/in/xprabhudayal/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                  <span>Prabhudayal Vaishnav</span>
                </a>
                
                <a 
                  href="mailto:p09m21@gmail.com" 
                  className="flex items-center space-x-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  <span>p09m21@gmail.com</span>
                </a>
                
                <a 
                  href="https://github.com/xprabhudayal" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Waitlist Signup */}
          <div className="space-y-8" id="waitlist">
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Join the Waitlist
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Career Scout is coming soon! Be the first to get access when we launch.
              </p>
              
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    className="waitlist-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="waitlist-button w-full flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Join Waitlist'
                  )}
                </button>
                
                {submitStatus && (
                  <p 
                    className={`text-sm ${
                      submitStatus.success ? 'text-green-600' : 'text-red-600'
                    } dark:${
                      submitStatus.success ? 'text-green-400' : 'text-red-400'
                    } mt-2`}
                  >
                    {submitStatus.message}
                  </p>
                )}
              </form>
            </motion.div>
          </div>
        </div>
        
        <div className="pt-12 mt-12 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Career Scout. All rights reserved.
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                #BuildWithVapi
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 