import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo, update } from 'firebase/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    console.log('[SUBSCRIPTION CHECK] Checking subscription for userId:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!rtdb) {
      console.error('❌ [SUBSCRIPTION CHECK] Firebase Realtime Database not configured. Missing NEXT_PUBLIC_FIREBASE_DATABASE_URL in .env.local');
      return NextResponse.json(
        { error: 'Database not configured - Please add NEXT_PUBLIC_FIREBASE_DATABASE_URL to .env.local' },
        { status: 500 }
      );
    }

    // Check subscription in Realtime Database at /subscriptions - query by userId
    try {
      const subscriptionsRef = ref(rtdb, 'subscriptions');
      const subscriptionQuery = query(subscriptionsRef, orderByChild('userId'), equalTo(userId));
      const snapshot = await get(subscriptionQuery);

      console.log('[SUBSCRIPTION CHECK] Database query found data:', snapshot.exists());
      
      if (!snapshot.exists()) {
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
    } catch (queryError) {
      console.error('[SUBSCRIPTION CHECK] ❌ Query failed:', queryError);
      // Fallback: try to read from the new subscriptions path without query
      const subscriptionsRef = ref(rtdb, 'subscriptions');
      try {
        const snapshot = await get(subscriptionsRef);
        if (!snapshot.exists()) {
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
        // Search manually for matching userId
        let foundSubscription: any = null;
        snapshot.forEach((child: any) => {
          if (child.val().userId === userId) {
            foundSubscription = { val: child.val(), ref: child.ref };
          }
        });
        
        if (!foundSubscription) {
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
        
        const subscription = foundSubscription.val;
        const subscriptionRef = foundSubscription.ref;
        
        if (!subscription || !subscription.endDate) {
          return NextResponse.json(
            { 
              isActive: false, 
              status: 'no_subscription',
              message: 'No active subscription'
            },
            { status: 200 }
          );
        }

        const endDate = new Date(subscription.endDate);
        const now = new Date();
        const isActive = now < endDate && subscription.status === 'active';
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (!isActive && subscription.status === 'active' && subscriptionRef) {
          await update(subscriptionRef, { status: 'expired' });
        }

        return NextResponse.json({
          isActive,
          status: isActive ? 'active' : 'expired',
          plan: subscription.plan || 'basic',
          email: subscription.email || '',
          startDate: subscription.startDate || '',
          endDate: subscription.endDate || '',
          daysRemaining: isActive ? daysRemaining : 0,
          subscriptionId: subscription.subscriptionId,
          message: isActive 
            ? `Subscription active for ${daysRemaining} more days`
            : 'Subscription expired'
        });
      } catch (fallbackError) {
        console.error('[SUBSCRIPTION CHECK] ❌ Fallback also failed:', fallbackError);
        throw fallbackError;
      }
    }

    // Get the first (most recent) subscription from query
    let subscription: any = null;
    let subscriptionRef: any = null;
    const snapshot = await get(query(ref(rtdb, 'subscriptions'), orderByChild('userId'), equalTo(userId)));
    
    if (!snapshot.exists()) {
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
    
    snapshot.forEach((child: any) => {
      const childVal = child.val();
      if (!subscription || new Date(childVal.createdAt) > new Date(subscription.createdAt)) {
        subscription = childVal;
        subscriptionRef = child.ref;
      }
    });

    console.log('[SUBSCRIPTION CHECK] Found subscription:', subscription);

    if (!subscription || !subscription.endDate) {
      return NextResponse.json(
        { 
          isActive: false, 
          status: 'no_subscription',
          message: 'No active subscription'
        },
        { status: 200 }
      );
    }

    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const isActive = now < endDate && subscription.status === 'active';
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Auto-update status if expired
    if (!isActive && subscription.status === 'active' && subscriptionRef) {
      await update(subscriptionRef, {
        status: 'expired'
      });
    }

    return NextResponse.json({
      isActive,
      status: isActive ? 'active' : 'expired',
      plan: subscription.plan || 'basic',
      email: subscription.email || '',
      startDate: subscription.startDate || '',
      endDate: subscription.endDate || '',
      daysRemaining: isActive ? daysRemaining : 0,
      subscriptionId: subscription.subscriptionId,
      message: isActive 
        ? `Subscription active for ${daysRemaining} more days`
        : 'Subscription expired'
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}
