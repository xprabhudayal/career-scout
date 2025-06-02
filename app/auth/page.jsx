'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthenticationScreen } from '@/components/AuthenticationScreen';

export default function AuthPage() {
  const supabase = createClientComponentClient();
  return <AuthenticationScreen supabase={supabase} />;
} 