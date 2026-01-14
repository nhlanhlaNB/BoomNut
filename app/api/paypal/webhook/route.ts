import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import crypto from 'crypto';

// PayPal webhook events we care about
const WEBHOOK_EVENTS = {
  BILLING_SUBSCRIPTION_CREATED: 'BILLING.SUBSCRIPTION.CREATED',
  BILLING_SUBSCRIPTION_ACTIVATED: 'BILLING.SUBSCRIPTION.ACTIVATED',
  BILLING_SUBSCRIPTION_UPDATED: 'BILLING.SUBSCRIPTION.UPDATED',
  BILLING_SUBSCRIPTION_CANCELLED: 'BILLING.SUBSCRIPTION.CANCELLED',
  BILLING_SUBSCRIPTION_SUSPENDED: 'BILLING.SUBSCRIPTION.SUSPENDED',
  BILLING_SUBSCRIPTION_PAYMENT_FAILED: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  PAYMENT_SALE_COMPLETED: 'PAYMENT.SALE.COMPLETED',
};

// Verify PayPal webhook signature
async function verifyWebhookSignature(
  req: NextRequest,
  body: string
): Promise<boolean> {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.error('PAYPAL_WEBHOOK_ID not configured');
      return false;
    }

    const transmissionId = req.headers.get('paypal-transmission-id');
    const transmissionTime = req.headers.get('paypal-transmission-time');
    const certUrl = req.headers.get('paypal-cert-url');
    const authAlgo = req.headers.get('paypal-auth-algo');
    const transmissionSig = req.headers.get('paypal-transmission-sig');

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.error('Missing PayPal webhook headers');
      return false;
    }

    // Verify with PayPal API
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const isProduction = process.env.PAYPAL_MODE === 'production';
    const baseURL = isProduction 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Get PayPal access token
    const authResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Verify webhook signature
    const verifyResponse = await fetch(`${baseURL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    });

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Map PayPal plan ID to subscription tier
function getPlanNameFromPlanId(planId: string): string {
  const planMap: { [key: string]: string } = {
    'P-0EW71788K8993972RNFP4YOY': 'pro',     // Pro Monthly
    'P-33A20854VN557325GNFP6CYQ': 'pro',     // Pro Yearly
    'P-8W509033WG9931346NFP5YAQ': 'premium', // Premium Monthly
    'P-3NC19032VG801351ENFP56MY': 'premium', // Premium Yearly
  };
  return planMap[planId] || 'free';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    // Verify webhook signature in production
    if (process.env.PAYPAL_MODE === 'production') {
      const isValid = await verifyWebhookSignature(req, body);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const eventType = event.event_type;
    console.log('PayPal webhook event:', eventType, event);

    switch (eventType) {
      case WEBHOOK_EVENTS.BILLING_SUBSCRIPTION_ACTIVATED:
      case WEBHOOK_EVENTS.BILLING_SUBSCRIPTION_CREATED: {
        const subscription = event.resource;
        const customId = subscription.custom_id; // User ID stored during subscription
        const subscriptionId = subscription.id;
        const planId = subscription.plan_id;
        const planName = getPlanNameFromPlanId(planId);
        const billingPeriod = planId.includes('YEARLY') ? 'yearly' : 'monthly';

        if (customId) {
          const userRef = doc(db, 'users', customId);
          await setDoc(userRef, {
            subscription: {
              plan: planName,
              subscriptionId: subscriptionId,
              planId: planId,
              status: 'active',
              startDate: new Date(subscription.start_time || subscription.create_time),
              billingPeriod: billingPeriod,
              nextBillingDate: subscription.billing_info?.next_billing_time 
                ? new Date(subscription.billing_info.next_billing_time) 
                : null,
            },
          }, { merge: true });

          console.log(`Subscription activated for user ${customId}: ${planName}`);
        }
        break;
      }

      case WEBHOOK_EVENTS.BILLING_SUBSCRIPTION_CANCELLED:
      case WEBHOOK_EVENTS.BILLING_SUBSCRIPTION_SUSPENDED: {
        const subscription = event.resource;
        const subscriptionId = subscription.id;

        // Find user by subscription ID
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('subscription.subscriptionId', '==', subscriptionId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await updateDoc(userDoc.ref, {
            'subscription.status': eventType === WEBHOOK_EVENTS.BILLING_SUBSCRIPTION_CANCELLED 
              ? 'cancelled' 
              : 'suspended',
            'subscription.cancelledAt': new Date(),
          });

          console.log(`Subscription ${eventType} for user ${userDoc.id}`);
        }
        break;
      }

      case WEBHOOK_EVENTS.BILLING_SUBSCRIPTION_PAYMENT_FAILED: {
        const subscription = event.resource;
        const subscriptionId = subscription.id;

        // Find user by subscription ID
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('subscription.subscriptionId', '==', subscriptionId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await updateDoc(userDoc.ref, {
            'subscription.status': 'payment_failed',
            'subscription.lastPaymentFailed': new Date(),
          });

          console.log(`Payment failed for user ${userDoc.id}`);
        }
        break;
      }

      case WEBHOOK_EVENTS.PAYMENT_SALE_COMPLETED: {
        const sale = event.resource;
        const subscriptionId = sale.billing_agreement_id;

        if (subscriptionId) {
          // Update last successful payment
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('subscription.subscriptionId', '==', subscriptionId));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await updateDoc(userDoc.ref, {
              'subscription.lastPaymentDate': new Date(),
              'subscription.status': 'active',
            });

            console.log(`Payment completed for user ${userDoc.id}`);
          }
        }
        break;
      }

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
