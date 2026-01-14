'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type SubscriptionPlan = 'free' | 'pro' | 'premium';
type SubscriptionStatus = 'active' | 'cancelled' | 'suspended' | 'payment_failed' | 'expired';

type SubscriptionContextType = {
  plan: SubscriptionPlan;
  loading: boolean;
  isPro: boolean;
  isPremium: boolean;
  status: SubscriptionStatus | null;
  subscriptionId: string | null;
  nextBillingDate: Date | null;
  canAccessFeature: (feature: string) => boolean;
  verifySubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  plan: 'free',
  loading: true,
  isPro: false,
  isPremium: false,
  status: null,
  subscriptionId: null,
  nextBillingDate: null,
  canAccessFeature: () => false,
  verifySubscription: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [nextBillingDate, setNextBillingDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan('free');
      setStatus(null);
      setSubscriptionId(null);
      setNextBillingDate(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const subscription = data.subscription;
        
        if (subscription) {
          setPlan((subscription.plan as SubscriptionPlan) || 'free');
          setStatus(subscription.status as SubscriptionStatus);
          setSubscriptionId(subscription.subscriptionId || null);
          setNextBillingDate(
            subscription.nextBillingDate?.toDate ? subscription.nextBillingDate.toDate() : null
          );
          
          // If subscription is not active, downgrade to free
          if (subscription.status !== 'active') {
            setPlan('free');
          }
        } else {
          setPlan('free');
          setStatus(null);
          setSubscriptionId(null);
          setNextBillingDate(null);
        }
      } else {
        setPlan('free');
        setStatus(null);
        setSubscriptionId(null);
        setNextBillingDate(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Verify subscription with PayPal
  const verifySubscription = async () => {
    if (!user || !subscriptionId) return;

    try {
      const response = await fetch('/api/paypal/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, subscriptionId }),
      });

      const data = await response.json();
      
      if (!data.subscribed) {
        console.warn('Subscription verification failed or inactive');
      }
    } catch (error) {
      console.error('Error verifying subscription:', error);
    }
  };

  const isPro = (plan === 'pro' || plan === 'premium') && status === 'active';
  const isPremium = plan === 'premium' && status === 'active';

  const canAccessFeature = (feature: string): boolean => {
    // If subscription is not active, only allow free features
    if (status !== 'active' && status !== null) {
      return true; // Free features only
    }

    const proFeatures = [
      'unlimited-chat',
      'unlimited-study-sets',
      'unlimited-tests',
      'video-audio-upload',
      'photo-upload',
    ];
    
    const premiumFeatures = [
      'live-lecture-assistant',
      'handwritten-notes',
      'advanced-ocr',
      'study-room-hosting',
    ];

    if (premiumFeatures.includes(feature)) {
      return isPremium;
    }

    if (proFeatures.includes(feature)) {
      return isPro;
    }

    return true; // Free features
  };

  return (
    <SubscriptionContext.Provider
      value={{ 
        plan, 
        loading, 
        isPro, 
        isPremium, 
        status, 
        subscriptionId,
        nextBillingDate,
        canAccessFeature,
        verifySubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
