import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, remove, query, orderByChild, equalTo } from 'firebase/database';

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

    // Get subscription from database - query by userId
    const subscriptionsRef = ref(rtdb, 'subscriptions');
    const subscriptionQuery = query(subscriptionsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(subscriptionQuery);

    if (!snapshot.exists()) {
      console.log('[SUBSCRIPTION CANCEL] No subscription found for user:', userId);
      return NextResponse.json(
        { success: true, message: 'No subscription to cancel' },
        { status: 200 }
      );
    }

    // Get the first subscription to cancel
    interface SubscriptionData {
      plan: string;
      status: string;
      email: string;
      subscriptionId?: string;
    }
    
    let subscription: SubscriptionData | null = null;
    let subscriptionRef: any = null;
    snapshot.forEach((child) => {
      if (!subscription) {
        subscription = child.val();
        subscriptionRef = child.ref;
      }
    });

    if (!subscription) {
      return NextResponse.json(
        { success: true, message: 'No subscription found' },
        { status: 200 }
      );
    }

    const subData = subscription as any;
    console.log('[SUBSCRIPTION CANCEL] Found subscription to cancel:', {
      userId,
      plan: subData.plan,
      paypalSubscriptionId: subData.subscriptionId,
    });

    // Cancel PayPal subscription if it exists
    if (subData.subscriptionId && subData.subscriptionId !== 'TEST-' && !subData.subscriptionId.startsWith('TEST-')) {
      try {
        console.log('[SUBSCRIPTION CANCEL] Calling PayPal to cancel subscription:', subData.subscriptionId);
        
        const paypalResponse = await fetch(
          `https://api.paypal.com/v1/billing/subscriptions/${subData.subscriptionId}/cancel`,
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
    if (subscriptionRef) {
      await remove(subscriptionRef);
      console.log('[SUBSCRIPTION CANCEL] ✅ Subscription removed from database for user:', userId);
    }

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
