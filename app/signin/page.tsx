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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-12 sm:mb-16">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-gray-700 font-bold text-base sm:text-lg">
            ← Back to Home
          </Link>
          <p className="text-gray-600 text-sm sm:text-base">
            Don't have an account? 
            <Link href="/signup" className="text-gray-900 font-bold ml-2 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Form Section */}
        <div className="max-w-md mx-auto px-4 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Welcome Back</h1>
            <p className="text-gray-600 text-sm sm:text-base">Sign in to continue to BoomNut</p>
          </div>

          {/* Social Sign In */}
          <div className="mb-8">
            <AuthButton />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-500 text-xs sm:text-sm">Or continue with email</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSignIn} className="space-y-5 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-gray-900 hover:underline font-medium text-xs sm:text-sm">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm sm:text-base disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm sm:text-base">
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
