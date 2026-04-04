import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    console.log('[SUBSCRIPTION CANCEL] Starting cancellation for userId:', userId);

    if (!userId) {
      console.error('[SUBSCRIPTION CANCEL] ❌ No userId provided');
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!rtdb) {
      console.error('[SUBSCRIPTION CANCEL] ❌ Firebase not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Read all subscriptions - simple and reliable approach
    console.log('[SUBSCRIPTION CANCEL] Reading all subscriptions from database...');
    const subscriptionsRef = ref(rtdb, 'subscriptions');
    const snapshot = await get(subscriptionsRef);

    if (!snapshot.exists()) {
      console.log('[SUBSCRIPTION CANCEL] No subscriptions found in database');
      return NextResponse.json(
        { success: true, message: 'No subscriptions found' },
        { status: 200 }
      );
    }

    // Find subscription for this user
    let foundSubscription: any = null;
    let subscriptionKey: string = '';
    
    snapshot.forEach((child: any) => {
      const sub = child.val();
      console.log('[SUBSCRIPTION CANCEL] Checking subscription:', child.key, 'userId:', sub?.userId, 'searching for:', userId);
      
      if (sub?.userId === userId) {
        console.log('[SUBSCRIPTION CANCEL] ✅ Found matching subscription:', child.key);
        foundSubscription = sub;
        subscriptionKey = child.key;
      }
    });

    if (!foundSubscription) {
      console.log('[SUBSCRIPTION CANCEL] No subscription found for user:', userId);
      return NextResponse.json(
        { success: true, message: 'No subscription found to cancel' },
        { status: 200 }
      );
    }

    console.log('[SUBSCRIPTION CANCEL] Found subscription to cancel:', {
      subscriptionKey,
      userId,
      plan: foundSubscription.plan,
      paypalSubscriptionId: foundSubscription.subscriptionId,
    });

    // Cancel PayPal subscription if it's a real one (not a test)
    if (foundSubscription.subscriptionId && !foundSubscription.subscriptionId.startsWith('TEST-')) {
      try {
        console.log('[SUBSCRIPTION CANCEL] Calling PayPal to cancel:', foundSubscription.subscriptionId);
        
        const paypalResponse = await fetch(
          `https://api.paypal.com/v1/billing/subscriptions/${foundSubscription.subscriptionId}/cancel`,
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

    // Delete from database using the subscription key
    if (subscriptionKey) {
      try {
        const subRefToDelete = ref(rtdb, `subscriptions/${subscriptionKey}`);
        await remove(subRefToDelete);
        console.log('[SUBSCRIPTION CANCEL] ✅ Subscription removed from database:', subscriptionKey);
      } catch (deleteError) {
        console.error('[SUBSCRIPTION CANCEL] ❌ Failed to delete from database:', deleteError);
        throw new Error(`Failed to delete subscription from database: ${deleteError}`);
      }
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
