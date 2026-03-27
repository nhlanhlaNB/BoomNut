import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!rtdb) {
      console.error('❌ [SUBSCRIPTION CANCEL] Firebase not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get subscription from database
    const subscriptionRef = ref(rtdb, `users/${userId}/subscription`);
    const snapshot = await get(subscriptionRef);

    if (!snapshot.exists()) {
      console.log('[SUBSCRIPTION CANCEL] No subscription found for user:', userId);
      return NextResponse.json(
        { success: true, message: 'No subscription to cancel' },
        { status: 200 }
      );
    }

    const subscription = snapshot.val();
    console.log('[SUBSCRIPTION CANCEL] Found subscription to cancel:', {
      userId,
      plan: subscription.plan,
      paypalSubscriptionId: subscription.subscriptionId,
    });

    // Cancel PayPal subscription if it exists
    if (subscription.subscriptionId && subscription.subscriptionId !== 'TEST-' && !subscription.subscriptionId.startsWith('TEST-')) {
      try {
        console.log('[SUBSCRIPTION CANCEL] Calling PayPal to cancel subscription:', subscription.subscriptionId);
        
        const paypalResponse = await fetch(
          `https://api.paypal.com/v1/billing/subscriptions/${subscription.subscriptionId}/cancel`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${Buffer.from(
                `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
              ).toString('base64')}`,
            },
            body: JSON.stringify({
              reason: 'User requested cancellation',
            }),
          }
        );

        if (!paypalResponse.ok) {
          const errorData = await paypalResponse.json().catch(() => ({}));
          console.warn('[SUBSCRIPTION CANCEL] PayPal cancel warning:', {
            status: paypalResponse.status,
            error: errorData,
          });
          // Don't fail completely - still delete from database
        } else {
          console.log('[SUBSCRIPTION CANCEL] ✅ PayPal subscription cancelled');
        }
      } catch (paypalError) {
        console.error('[SUBSCRIPTION CANCEL] PayPal API error:', paypalError);
        // Don't fail completely - still delete from database
      }
    } else {
      console.log('[SUBSCRIPTION CANCEL] Skipping PayPal cancel (test subscription)');
    }

    // Delete from database
    await remove(subscriptionRef);
    console.log('[SUBSCRIPTION CANCEL] ✅ Subscription removed from database for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('[SUBSCRIPTION CANCEL] ❌ Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}
