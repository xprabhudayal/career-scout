'use client';

import CareerScout from '@/components/CareerScout';
import { useAuth } from '@/components/Providers';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
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

  return <CareerScout />;
} 