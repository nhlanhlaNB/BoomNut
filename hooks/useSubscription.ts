'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

interface SubscriptionStatus {
  isActive: boolean;
  status: 'active' | 'expired' | 'no_subscription';
  plan?: string;
  daysRemaining?: number;
  endDate?: string;
  startDate?: string;
  email?: string;
  subscriptionId?: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const response = await fetch(`/api/subscription/check?userId=${user.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to check subscription');
        }

        const data = await response.json();
        setSubscription(data);
        setError(null);
      } catch (err) {
        console.error('Error checking subscription:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSubscription({
          isActive: false,
          status: 'no_subscription'
        });
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();

    // Recheck subscription every minute to catch expiry
    const interval = setInterval(checkSubscription, 60000);

    return () => clearInterval(interval);
  }, [user?.uid]);

  const createSubscription = async (plan: string, paypalSubscriptionId?: string) => {
    if (!user?.uid || !user?.email) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[CREATE SUBSCRIPTION] Starting subscription creation:', { userId: user.uid, email: user.email, plan });
      
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          plan,
          subscriptionId: paypalSubscriptionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[CREATE SUBSCRIPTION] API error:', errorData);
        throw new Error(`Failed to create subscription: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('[CREATE SUBSCRIPTION] ✅ Subscription created:', data);
      
      // Refresh subscription status from database
      console.log('[CREATE SUBSCRIPTION] Fetching updated subscription status...');
      const checkResponse = await fetch(`/api/subscription/check?userId=${user.uid}`);
      
      if (!checkResponse.ok) {
        console.error('[CREATE SUBSCRIPTION] Check endpoint error:', checkResponse.status);
        throw new Error('Failed to verify subscription');
      }
      
      const updatedSub = await checkResponse.json();
      console.log('[CREATE SUBSCRIPTION] Updated subscription data:', updatedSub);
      console.log('[CREATE SUBSCRIPTION] isActive:', updatedSub.isActive);
      console.log('[CREATE SUBSCRIPTION] status:', updatedSub.status);
      console.log('[CREATE SUBSCRIPTION] plan:', updatedSub.plan);
      console.log('[CREATE SUBSCRIPTION] email:', updatedSub.email);
      
      // Update state with new subscription data
      setSubscription(updatedSub);
      console.log('[CREATE SUBSCRIPTION] ✅ State updated with subscription data');

      return data;
    } catch (err) {
      console.error('[CREATE SUBSCRIPTION] ❌ Error:', err);
      throw err;
    }
  };

  const clearSubscription = async () => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[CANCEL SUBSCRIPTION] Starting cancellation for user:', user.uid);
      
      // Call the new cancel endpoint which:
      // 1. Cancels PayPal subscription
      // 2. Removes from database
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[CANCEL SUBSCRIPTION] API error:', errorData);
        throw new Error(`Failed to cancel subscription: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('[CANCEL SUBSCRIPTION] ✅ Subscription cancelled:', data);

      // Reset subscription state and refetch to confirm
      setSubscription(null);
      
      // Immediately refetch to confirm cancellation worked
      const checkResponse = await fetch(`/api/subscription/check?userId=${user.uid}`);
      const updatedSub = await checkResponse.json();
      setSubscription(updatedSub);

      return { success: true };
    } catch (err) {
      console.error('[CANCEL SUBSCRIPTION] ❌ Error:', err);
      throw err;
    }
  };

  return {
    subscription,
    loading,
    error,
    isActive: subscription?.isActive ?? false,
    showPaymentButton: !subscription || !subscription.isActive || subscription.status === 'no_subscription' || subscription.status === 'expired',
    daysRemaining: subscription?.daysRemaining ?? 0,
    createSubscription,
    clearSubscription,
  };
}
