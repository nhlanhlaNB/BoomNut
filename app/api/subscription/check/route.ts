import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo, update } from 'firebase/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  
  console.log('[SUBSCRIPTION CHECK] Checking subscription for userId:', userId);
  
  try {
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!rtdb) {
      console.error('❌ [SUBSCRIPTION CHECK] Firebase Realtime Database not initialized');
      return NextResponse.json(
        { 
          isActive: false, 
          status: 'no_subscription',
          plan: 'none',
          message: 'Database not available'
        },
        { status: 200 }
      );
    }

    // Read all subscriptions - simple and reliable approach
    console.log('[SUBSCRIPTION CHECK] Reading all subscriptions...');
    const subscriptionsRef = ref(rtdb, 'subscriptions');
    const snapshot = await get(subscriptionsRef);

    if (!snapshot.exists()) {
      console.log('[SUBSCRIPTION CHECK] No subscriptions found');
      return NextResponse.json(
        { 
          isActive: false, 
          status: 'no_subscription',
          plan: 'none',
          message: 'No subscription found'
        },
        { status: 200 }
      );
    }

    // Find subscription for this user
    let foundSubscription: any = null;
    let subscriptionKey: string = '';
    const allSubs: any[] = [];
    
    snapshot.forEach((child: any) => {
      const childVal = child.val();
      
      if (!childVal) {
        console.log('[SUBSCRIPTION CHECK] Child has no value:', child.key);
        return;
      }
      
      allSubs.push({
        key: child.key,
        userId: childVal?.userId,
        plan: childVal?.plan,
        status: childVal?.status,
        hasUserId: !!childVal?.userId
      });
      
      console.log('[SUBSCRIPTION CHECK] Child key:', child.key, 'stored userId:', childVal.userId, 'searching for:', userId, 'match:', childVal.userId === userId);
      
      if (childVal.userId === userId) {
        // Get the most recent one
        if (!foundSubscription || new Date(childVal.createdAt) > new Date(foundSubscription.createdAt)) {
          console.log('[SUBSCRIPTION CHECK] Found matching subscription with key:', child.key);
          foundSubscription = childVal;
          subscriptionKey = child.key;
        }
      }
    });
    
    console.log('[SUBSCRIPTION CHECK] Found', allSubs.length, 'total subscriptions in database');
    console.log('[SUBSCRIPTION CHECK] Subscriptions summary:', JSON.stringify(allSubs));
    console.log('[SUBSCRIPTION CHECK] Looking for userId:', userId);
    console.log('[SUBSCRIPTION CHECK] Matched subscription:', foundSubscription ? 'YES - ' + subscriptionKey : 'NO');

    if (!foundSubscription) {
      console.log('[SUBSCRIPTION CHECK] No subscription found for user:', userId);
      return NextResponse.json(
        { 
          isActive: false, 
          status: 'no_subscription',
          plan: 'none',
          message: 'No subscription found'
        },
        { status: 200 }
      );
    }

    console.log('[SUBSCRIPTION CHECK] Found subscription for user');

    if (!foundSubscription.endDate) {
      console.warn('[SUBSCRIPTION CHECK] Subscription missing endDate');
      return NextResponse.json(
        { 
          isActive: false, 
          status: 'no_subscription',
          message: 'Invalid subscription data'
        },
        { status: 200 }
      );
    }

    const endDate = new Date(foundSubscription.endDate);
    const now = new Date();
    const isActive = now < endDate && foundSubscription.status === 'active';
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Auto-update status if expired
    if (!isActive && foundSubscription.status === 'active' && subscriptionKey) {
      try {
        console.log('[SUBSCRIPTION CHECK] Marking subscription as expired');
        const subRef = ref(rtdb, `subscriptions/${subscriptionKey}`);
        await update(subRef, { status: 'expired' });
      } catch (updateError) {
        console.warn('[SUBSCRIPTION CHECK] Failed to update status:', updateError);
        // Don't fail the response if update fails
      }
    }

    const responseData = {
      isActive,
      status: isActive ? 'active' : 'expired',
      plan: foundSubscription.plan || 'basic',
      email: foundSubscription.email || '',
      startDate: foundSubscription.startDate || '',
      endDate: foundSubscription.endDate || '',
      daysRemaining: isActive ? daysRemaining : 0,
      subscriptionId: foundSubscription.subscriptionId,
      message: isActive 
        ? `Subscription active for ${daysRemaining} more days`
        : 'Subscription expired'
    };

    console.log('[SUBSCRIPTION CHECK] ✅ Success for user:', userId);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[SUBSCRIPTION CHECK] ❌ Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[SUBSCRIPTION CHECK] Error details:', errorMsg, error);
    return NextResponse.json(
      { 
        isActive: false, 
        status: 'no_subscription',
        error: 'Failed to check subscription',
        details: errorMsg
      },
      { status: 200 } // Return 200 even on error to prevent infinite retries
    );
  }
}
