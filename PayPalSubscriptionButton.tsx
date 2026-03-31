// DIRECT FIX FOR REACT/PAYPAL INTEGRATION
// This is a React component that handles PayPal subscriptions properly

import React, { useEffect, useRef } from 'react';

const PayPalSubscriptionButton = ({ planId, planName, userId, userEmail }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!window.paypal || !userId || !userEmail) return;

    // Create subscription button
    window.paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'gold',
        layout: 'vertical',
        label: 'subscribe'
      },
      createSubscription: (data, actions) => {
        return actions.subscription.create({
          plan_id: planId
        });
      },
      onApprove: async (data, actions) => {
        try {
          console.log('PayPal approved:', data.subscriptionID);

          // CRITICAL: Call your backend API to save subscription
          const response = await fetch('/api/subscription/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userId,
              email: userEmail,
              plan: planName.toLowerCase(),
              subscriptionId: data.subscriptionID,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API failed');
          }

          const result = await response.json();
          alert(`✅ Successfully subscribed!\n\nRefreshing...`);
          window.location.reload();

        } catch (error) {
          console.error('Error:', error);
          alert('❌ Subscription created but failed to save.\n\nError: ' + error.message);
        }
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        alert('Payment failed.');
      }
    }).render(containerRef.current);

  }, [planId, planName, userId, userEmail]);

  return <div ref={containerRef} />;
};

export default PayPalSubscriptionButton;

/* USAGE IN YOUR PRICING PAGE:

import PayPalSubscriptionButton from '@/components/PayPalSubscriptionButton';
import { useAuth } from '@/hooks/useAuth'; // Your auth hook

export default function PricingPage() {
  const { user } = useAuth();

  return (
    <div>
      {user && (
        <>
          <PayPalSubscriptionButton
            planId="P-51711759R0127122YNHA4ITY"
            planName="premium"
            userId={user.uid}
            userEmail={user.email}
          />
          <PayPalSubscriptionButton
            planId="P-7V61468029079353FNHDOXSQ"
            planName="test"
            userId={user.uid}
            userEmail={user.email}
          />
        </>
      )}
    </div>
  );
}

*/
