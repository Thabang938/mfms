'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('Login failed: ' + error.message);
    } else {
      router.push('/Dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-xl">
        <div className="text-center mb-6">
          <img src="/logo.jpg" alt="Emalahleni Logo" className="h-20 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-green-800">Fleet Management System</h2>
          <p className="text-sm text-green-600">Sign in to manage your fleet</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-green-700">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="mt-1 w-full px-4 py-3 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-3 rounded hover:bg-green-800 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}