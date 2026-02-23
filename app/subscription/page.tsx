'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Zap, CheckCircle, XCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function SubscriptionManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { plan, status, subscriptionId, nextBillingDate, loading, verifySubscription } = useSubscription();
  const [verifying, setVerifying] = useState(false);
  const [lastVerified, setLastVerified] = useState<Date | null>(null);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleVerifySubscription = async () => {
    setVerifying(true);
    try {
      await verifySubscription();
      setLastVerified(new Date());
    } catch (error) {
      console.error('Error verifying subscription:', error);
    } finally {
      setVerifying(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-orange-600 bg-orange-50';
      case 'suspended': return 'text-red-600 bg-red-50';
      case 'payment_failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
      case 'suspended': return <XCircle className="w-5 h-5" />;
      case 'payment_failed': return <AlertCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-600">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {plan === 'premium' ? (
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              ) : plan === 'pro' ? (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🆓</span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {plan} Plan
                </h2>
                {status && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor()}`}>
                    {getStatusIcon()}
                    <span className="capitalize">{status}</span>
                  </div>
                )}
              </div>
            </div>
            {plan !== 'free' && (
              <button
                onClick={handleVerifySubscription}
                disabled={verifying}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
                Verify
              </button>
            )}
          </div>

          {/* Subscription Details */}
          {plan !== 'free' && subscriptionId && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Subscription ID</p>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
                    {subscriptionId}
                  </p>
                </div>
                {nextBillingDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Next Billing Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {nextBillingDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
              </div>
              {lastVerified && (
                <div>
                  <p className="text-xs text-gray-500">
                    Last verified: {lastVerified.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Free Plan CTA */}
          {plan === 'free' && (
            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-600 mb-4">
                You're currently on the free plan. Upgrade to unlock premium features!
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                View Plans
                <Zap className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>

        {/* Features Access */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Features Access</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: 'AI Tutor Chat', feature: 'unlimited-chat', free: '5 messages/day', paid: 'Unlimited' },
              { name: 'Study Sets', feature: 'unlimited-study-sets', free: '2/week', paid: 'Unlimited' },
              { name: 'Practice Tests', feature: 'unlimited-tests', free: 'Limited', paid: 'Unlimited' },
              { name: 'Video/Audio Upload', feature: 'video-audio-upload', free: '❌', paid: '✅' },
              { name: 'Photo Upload', feature: 'photo-upload', free: '❌', paid: '✅' },
              { name: 'Live Lecture Assistant', feature: 'live-lecture-assistant', free: '❌', paid: 'Premium only' },
              { name: 'Handwritten Notes', feature: 'handwritten-notes', free: '❌', paid: 'Premium only' },
              { name: 'Study Room Hosting', feature: 'study-room-hosting', free: '❌', paid: 'Premium only' },
            ].map((item) => {
              const hasAccess = plan === 'premium' || 
                (plan === 'pro' && !item.feature.includes('lecture') && !item.feature.includes('handwritten') && !item.feature.includes('study-room'));
              
              return (
                <div 
                  key={item.feature}
                  className={`p-4 rounded-lg border-2 ${hasAccess ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    {hasAccess ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {plan === 'free' ? `Free: ${item.free}` : hasAccess ? item.paid : 'Not included'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {plan !== 'free' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Manage Subscription</h3>
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">
                To manage your subscription, cancel, or update payment methods, please visit your PayPal account.
              </p>
              <a
                href="https://www.paypal.com/myaccount/autopay"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Manage on PayPal
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition ml-3"
              >
                View Other Plans
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
