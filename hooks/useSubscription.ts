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
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      
      // Refresh subscription status
      const checkResponse = await fetch(`/api/subscription/check?userId=${user.uid}`);
      const updatedSub = await checkResponse.json();
      setSubscription(updatedSub);

      return data;
    } catch (err) {
      console.error('Error creating subscription:', err);
      throw err;
    }
  };

  const clearSubscription = async () => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/subscription/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear subscription');
      }

      // Reset subscription state and refetch to confirm
      setSubscription(null);
      
      // Immediately refetch to confirm clear worked
      const checkResponse = await fetch(`/api/subscription/check?userId=${user.uid}`);
      const updatedSub = await checkResponse.json();
      setSubscription(updatedSub);

      return { success: true };
    } catch (err) {
      console.error('Error clearing subscription:', err);
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
