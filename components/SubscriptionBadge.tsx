'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Zap, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionBadge() {
  const { plan, loading, status, nextBillingDate } = useSubscription();

  if (loading) return null;

  // Show warning for inactive subscriptions
  if (status && status !== 'active' && plan !== 'free') {
    return (
      <Link
        href="/pricing"
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity animate-pulse"
        title={`Subscription ${status}. Click to manage.`}
      >
        <AlertCircle className="w-4 h-4" />
        {status === 'payment_failed' ? 'Payment Failed' : 'Inactive'}
      </Link>
    );
  }

  if (plan === 'free') {
    return (
      <Link
        href="/pricing"
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Zap className="w-4 h-4" />
        Upgrade to Pro
      </Link>
    );
  }

  if (plan === 'pro') {
    return (
      <div 
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium"
        title={nextBillingDate ? `Next billing: ${nextBillingDate.toLocaleDateString()}` : 'Pro Plan Active'}
      >
        <Zap className="w-4 h-4" />
        Pro
      </div>
    );
  }

  if (plan === 'premium') {
    return (
      <div 
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-full text-sm font-medium"
        title={nextBillingDate ? `Next billing: ${nextBillingDate.toLocaleDateString()}` : 'Premium Plan Active'}
      >
        <Crown className="w-4 h-4" />
        Premium
      </div>
    );
  }

  return null;
}
