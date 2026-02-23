'use client';

import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import AuthButton from '@/components/AuthButton';

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Add your sign-in logic here
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-gray-700 font-bold text-lg">
            ← Back to Home
          </Link>
          <p className="text-gray-600">
            Don't have an account? 
            <Link href="/signup" className="text-gray-900 font-bold ml-2 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Form Section */}
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue to BoomNut</p>
          </div>

          {/* Social Sign In */}
          <div className="mb-8">
            <AuthButton />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-500 text-sm">Or continue with email</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSignIn} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-gray-900 hover:underline font-medium text-sm">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-bold disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-gray-900 font-bold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
