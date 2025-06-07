'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Telescope, AlertTriangle, ArrowLeft } from 'lucide-react';

// Create a separate component that uses useSearchParams
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorDetails, setErrorDetails] = useState({
    title: 'Authentication Error',
    description: 'Something went wrong with authentication. Please try again.',
    code: ''
  });
  
  useEffect(() => {
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');
    
    if (errorCode === 'otp_expired') {
      setErrorDetails({
        title: 'Magic Link Expired',
        description: 'Your login link has expired. Please request a new one.',
        code: errorCode
      });
    } else if (error) {
      setErrorDetails({
        title: 'Authentication Error',
        description: errorDescription || 'An error occurred during authentication.',
        code: errorCode || error
      });
    }
  }, [searchParams]);
  
  const handleRetry = () => {
    router.push('/auth');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden p-8">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-semibold text-center mb-4 text-gray-800">
            {errorDetails.title}
          </h1>
          
          <p className="text-gray-600 text-center mb-8">
            {errorDetails.description}
          </p>
          
          {/* 
          not importannt for the user, so we hide it
           {errorDetails.code && (
            <div className="mb-8 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Error code: {errorDetails.code}</p>
            </div>
          )} */}
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleRetry}
              className="w-full h-12 bg-[#007AFF] hover:bg-[#0071e3] text-white rounded-xl font-medium transition-all duration-200"
            >
              Try Again
            </button>
            
            <Link href="/" className="flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component that wraps the content in Suspense
export default function AuthError() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
} 