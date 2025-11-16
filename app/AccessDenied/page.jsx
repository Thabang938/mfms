'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(15);

  // Countdown and auto-redirect to /Dashboard
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/Dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-6">
      <div className="max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center">
          <ShieldAlert className="text-red-500 w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don’t have permission to view this page.  
            Redirecting you back to your dashboard in{' '}
            <span className="font-semibold text-gray-800">{secondsLeft}</span> seconds...
          </p>
          <button
            onClick={() => router.push('/Dashboard')}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 focus:ring-2 focus:ring-blue-300 
                       text-white font-semibold px-6 py-2 rounded-md transition-all duration-200"
          >
            Go Back Now
          </button>
        </div>
      </div>
    </div>
  );
}