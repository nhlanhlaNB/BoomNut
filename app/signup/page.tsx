'use client';

import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import AuthButton from '@/components/AuthButton';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Add your sign-up logic here
    setTimeout(() => setIsLoading(false), 1000);
  };

  const passwordStrength = formData.password.length > 0
    ? formData.password.length < 6
      ? 'weak'
      : formData.password.length < 12
      ? 'medium'
      : 'strong'
    : '';

  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-12 sm:mb-16">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-gray-700 font-bold text-base sm:text-lg">
            ← Back to Home
          </Link>
          <p className="text-gray-600 text-sm sm:text-base">
            Already have an account? 
            <Link href="/signin" className="text-gray-900 font-bold ml-2 hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Form Section */}
        <div className="max-w-md mx-auto px-4 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Create Account</h1>
            <p className="text-gray-600 text-sm sm:text-base">Join BoomNut and start learning smarter</p>
          </div>

          {/* Social Sign Up */}
          <div className="mb-8">
            <AuthButton />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-500 text-xs sm:text-sm">Or sign up with email</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-5 sm:space-y-6">
            {/* Full Name Field */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
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
              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === 'weak' ? 'w-1/3 bg-red-500' :
                        passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' :
                        'w-full bg-green-500'
                      }`}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                    {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {passwordsMatch && (
                <div className="mt-2 flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Passwords match</span>
                </div>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreedToTerms}
                onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 mt-1 border-2 border-gray-300 rounded cursor-pointer"
                required
              />
              <label htmlFor="terms" className="text-gray-600 text-xs sm:text-sm">
                I agree to the{' '}
                <Link href="/terms" className="text-gray-900 font-bold hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-gray-900 font-bold hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.agreedToTerms || !passwordsMatch}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm sm:text-base">
              Already have an account?{' '}
              <Link href="/signin" className="text-gray-900 font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
