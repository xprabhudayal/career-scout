'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const testimonials = [
  {
    quote: "Career Scout found me a senior developer position that perfectly matched my skills and salary expectations. The voice interface made the process feel natural and effortless.",
    name: "Alex Johnson",
    title: "Software Engineer",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    quote: "I was struggling to understand market trends in UX design. Career Scout broke everything down for me and helped me target companies that value my specific skill set.",
    name: "Sarah Chen",
    title: "UX Designer",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    quote: "The salary insights were invaluable during my negotiations. I ended up getting 15% more than I initially expected thanks to Career Scout's data.",
    name: "Marcus Williams",
    title: "Product Manager",
    avatar: "https://randomuser.me/api/portraits/men/66.jpg",
  },
  {
    quote: "As someone transitioning careers, I needed context about new industries. Career Scout was like having a knowledgeable mentor guiding me through the process.",
    name: "Jessica Kumar",
    title: "Marketing Specialist",
    avatar: "https://randomuser.me/api/portraits/women/28.jpg",
  }
];

const TestimonialsSection = () => {
  const sectionRef = useRef(null);
  const testimonialsRef = useRef(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      
      const ctx = gsap.context(() => {
        // Animate testimonials
        gsap.from('.testimonial-card', {
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        });
      }, sectionRef);
      
      return () => ctx.revert();
    }
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="py-16 md:py-24 bg-white dark:bg-gray-950 overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Beta Users Say
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Career Scout is already helping job seekers find their perfect opportunities.
            </p>
          </motion.div>
        </div>
        
        <div 
          ref={testimonialsRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="testimonial-card bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <svg className="h-8 w-8 text-primary-500" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 flex-grow mb-6">
                  {testimonial.quote}
                </p>
                
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="h-10 w-10 rounded-full mr-3"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Join thousands of job seekers who are transforming their career search.
            </p>
            <a 
              href="#waitlist" 
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg inline-flex transition-colors"
            >
              Join Waitlist
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 