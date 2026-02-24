'use client';

import { useState, useEffect } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, signInWithRedirect } from 'firebase/auth';
import { LogIn, LogOut, User as UserIcon, Mail, X, Phone, Smartphone } from 'lucide-react';
import SubscriptionBadge from './SubscriptionBadge';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    if (showAuthModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAuthModal]);

  const handleSignIn = async () => {
    try {
      // Check if device is mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Use redirect for mobile devices (better UX)
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Use popup for desktop
        await signInWithPopup(auth, googleProvider);
        setShowAuthModal(false);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthError(error.message || 'Authentication failed');
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (!confirmationResult) {
        // Send verification code
        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        setAuthError('Verification code sent to your phone!');
      } else {
        // Verify code
        await confirmationResult.confirm(verificationCode);
        setShowAuthModal(false);
        setPhoneNumber('');
        setVerificationCode('');
        setConfirmationResult(null);
      }
    } catch (error: any) {
      console.error('Phone auth error:', error);
      setAuthError(error.message || 'Phone authentication failed');
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-20 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </button>

        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative my-8">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError('');
                  setEmail('');
                  setPassword('');
                  setPhoneNumber('');
                  setVerificationCode('');
                  setConfirmationResult(null);
                  if ((window as any).recaptchaVerifier) {
                    (window as any).recaptchaVerifier.clear();
                    (window as any).recaptchaVerifier = null;
                  }
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                aria-label="Close authentication modal"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </h2>

              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium mb-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Auth method tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                    authMethod === 'email'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                    authMethod === 'phone'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Phone
                </button>
              </div>

              {authMethod === 'email' ? (
                <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                {authError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              </form>
              ) : (
                <form onSubmit={handlePhoneAuth} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      disabled={!!confirmationResult}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="+1234567890"
                    />
                    <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
                  </div>

                  {confirmationResult && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="123456"
                      />
                    </div>
                  )}

                  {authError && (
                    <div className={`text-sm p-2 rounded ${
                      authError.includes('sent') 
                        ? 'text-green-600 bg-green-50' 
                        : 'text-red-600 bg-red-50'
                    }`}>
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {confirmationResult ? 'Verify Code' : 'Send Code'}
                  </button>

                  <div id="recaptcha-container"></div>
                </form>
              )}

              <div className="mt-4 text-center text-sm text-gray-600">
                {authMode === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError('');
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        setAuthMode('signin');
                        setAuthError('');
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-all shadow-sm"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-8 h-8 rounded-full border-2 border-blue-500"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
        )}
        <span className="font-medium text-gray-800 max-w-[150px] truncate">
          {user.displayName || user.email}
        </span>
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-semibold text-gray-800">{user.displayName}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <div className="mt-2">
              <SubscriptionBadge />
            </div>
          </div>
          <button
            onClick={() => {
              setShowDropdown(false);
              window.location.href = '/study';
            }}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            Study Dashboard
          </button>
          <button
            onClick={() => {
              setShowDropdown(false);
              window.location.href = '/pricing';
            }}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Pricing
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors border-t border-gray-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
