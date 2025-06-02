'use client';

import { OnboardingFlow } from '@/components/OnboardingFlow';
import { useAuth } from '@/components/Providers';
import { redirect } from 'next/navigation';

export default function OnboardingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    redirect('/auth');
    return null;
  }

  return <OnboardingFlow user={user} />;
} 