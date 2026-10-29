'use client';

import { ArrowRight, Lock, Mail, Radio, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, demoLogin } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(email, password, displayName);
    setLoading(false);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
  };

  const handleDemoLogin = () => {
    demoLogin();
    router.push('/');
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-spotify-elevated/40 to-spotify-base select-none">
      <div className="w-full max-w-md flex flex-col items-center gap-6 bg-black/85 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center text-black shadow-lg group-hover:scale-105 transition-transform">
            <Radio className="w-7 h-7 stroke-[2.5]" />
          </div>
          <span className="font-black text-3xl tracking-tight text-white group-hover:text-spotify-green transition-colors">
            Wavelength
          </span>
        </Link>

        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Create your account
          </h1>
          <p className="text-xs text-spotify-subtext mt-1">
            Track your songs watched, watch time, and build your personalized music library
          </p>
        </div>

        {error && (
          <div className="w-full p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-white/80">Your Name</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-spotify-subtext absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="What should we call you?"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-spotify-subtext focus:border-spotify-green outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-white/80">Email address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-spotify-subtext absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-spotify-subtext focus:border-spotify-green outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-white/80">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-spotify-subtext absolute left-3.5 pointer-events-none" />
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-spotify-subtext focus:border-spotify-green outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-sm rounded-full transition-transform active:scale-95 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="w-full flex flex-col gap-3 pt-4 border-t border-white/10">
          <button
            onClick={handleDemoLogin}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-full border border-white/10 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 shadow"
          >
            <Sparkles className="w-4 h-4 text-spotify-green" />
            <span>1-Click Demo Login</span>
          </button>

          <p className="text-center text-xs text-spotify-subtext">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:text-spotify-green underline font-bold">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
