'use client';

import { Radio } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-spotify-elevated/40 to-spotify-base">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 bg-black/80 border border-spotify-border p-8 rounded-xl shadow-2xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center text-black">
            <Radio className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-black text-2xl tracking-tight text-white">Wavelength</span>
        </Link>

        <h1 className="text-2xl font-bold text-white text-center">
          Log in to Wavelength
        </h1>

        {error && (
          <div className="w-full p-3 bg-red-950/80 border border-red-500/50 rounded text-red-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-white">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="bg-spotify-card border border-spotify-border focus:border-white rounded px-3 py-2.5 text-sm text-white outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-white">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="bg-spotify-card border border-spotify-border focus:border-white rounded px-3 py-2.5 text-sm text-white outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold rounded-full transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="w-full border-t border-spotify-border pt-4 text-center">
          <p className="text-xs text-spotify-subtext">
            Don't have an account?{' '}
            <Link href="/register" className="text-white hover:underline font-bold">
              Sign up for Wavelength
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
