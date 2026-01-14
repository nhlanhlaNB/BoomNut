import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const isProduction = process.env.PAYPAL_MODE === 'production';
  const baseURL = isProduction 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

// Verify subscription status with PayPal
async function verifySubscriptionWithPayPal(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken();
  const isProduction = process.env.PAYPAL_MODE === 'production';
  const baseURL = isProduction 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseURL}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to verify subscription with PayPal');
  }

  return await response.json();
}

export async function POST(req: NextRequest) {
  try {
    const { userId, subscriptionId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's subscription from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ 
        subscribed: false,
        plan: 'free',
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription;

    // If no subscription data, user is on free plan
    if (!subscription || !subscription.subscriptionId) {
      return NextResponse.json({ 
        subscribed: false,
        plan: 'free',
        status: 'no_subscription'
      });
    }

    // Verify with PayPal API
    try {
      const paypalSubscription = await verifySubscriptionWithPayPal(
        subscriptionId || subscription.subscriptionId
      );

      const isActive = paypalSubscription.status === 'ACTIVE';
      const currentPlan = subscription.plan || 'free';

      // Update local subscription status if it differs from PayPal
      if (paypalSubscription.status !== subscription.status?.toUpperCase()) {
        await setDoc(userRef, {
          subscription: {
            ...subscription,
            status: paypalSubscription.status.toLowerCase(),
            nextBillingDate: paypalSubscription.billing_info?.next_billing_time 
              ? new Date(paypalSubscription.billing_info.next_billing_time) 
              : null,
            verifiedAt: new Date(),
          }
        }, { merge: true });
      }

      return NextResponse.json({
        subscribed: isActive,
        plan: isActive ? currentPlan : 'free',
        status: paypalSubscription.status,
        nextBillingDate: paypalSubscription.billing_info?.next_billing_time,
        verified: true,
      });
    } catch (error) {
      console.error('Error verifying with PayPal:', error);
      
      // If PayPal verification fails, use local data with warning
      return NextResponse.json({
        subscribed: subscription.status === 'active',
        plan: subscription.plan || 'free',
        status: subscription.status,
        verified: false,
        warning: 'Could not verify with PayPal, using local data',
      });
    }
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return NextResponse.json(
      { error: 'Failed to verify subscription' },
      { status: 500 }
    );
  }
}
