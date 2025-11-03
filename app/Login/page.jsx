'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient'; // ✅ Correct client
import { useUser } from '@supabase/auth-helpers-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const user = useUser();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/Dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

      if (error) {
        alert('Login failed: ' + error.message);
        setLoading(false);
        return;
      }

      // Confirm session is available
      const { data: sessionData } = await supabaseClient.auth.getSession();
      if (!sessionData?.session) {
        alert('Login succeeded but session not found. Please refresh or try again.');
        setLoading(false);
        return;
      }

      // Wait briefly to ensure cookie is set for middleware
      setTimeout(() => {
        router.refresh(); // Re-evaluate middleware
        router.replace('/Dashboard');
      }, 500);
    } catch (err) {
      console.error(err);
      alert('Unexpected error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md border border-green-200">
        <div className="text-center mb-6">
          <img
            src="/logo.jpg"
            alt="Emalahleni Logo"
            className="h-20 mx-auto mb-2 rounded-full shadow-sm"
          />
          <h2 className="text-2xl font-bold text-green-800">Fleet Management System</h2>
          <p className="text-sm text-green-600">Sign in to manage your fleet</p>
        </div>

        {!user && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-green-700">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium transition ${
                loading
                  ? 'bg-green-300 cursor-not-allowed text-white'
                  : 'bg-green-700 hover:bg-green-800 text-white shadow-md'
              }`}
            >
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}