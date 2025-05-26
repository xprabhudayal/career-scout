'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import Footer from '@/components/Footer';

export default function Home() {
  // Ensure GSAP doesn't throw errors during SSR
  useEffect(() => {
    // This code only runs on the client
    if (typeof window !== 'undefined') {
      // Any client-side initialization here
    }
  }, []);

  return (
    <ThemeProvider>
      <Head>
        <title>Career Scout | AI Voice Assistant for Job Search</title>
        <meta name="description" content="Career Scout is an AI-powered voice assistant that helps you find jobs, research salaries, and get market insights through natural conversation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Career Scout | AI Voice Assistant for Job Search" />
        <meta property="og:description" content="Find your perfect job using AI voice technology. Get personalized recommendations, salary insights, and market trends." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://careerscout.ai" />
        
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Career Scout | AI Voice Assistant for Job Search" />
        <meta name="twitter:description" content="Find your perfect job using AI voice technology. Get personalized recommendations, salary insights, and market trends." />
        <meta name="twitter:image" content="/og-image.png" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <main className="min-h-screen bg-white dark:bg-gray-950 antialiased">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <Footer />
      </main>
    </ThemeProvider>
  );
} 