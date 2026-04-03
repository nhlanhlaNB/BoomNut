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

    // Read all subscriptions from Realtime Database
    const subscriptionsRef = ref(rtdb, 'subscriptions');
    let snapshot;
    
    try {
      // Try to use query first (requires .indexOn: ["userId"] in rules)
      console.log('[SUBSCRIPTION CHECK] Attempting indexed query...');
      const subscriptionQuery = query(subscriptionsRef, orderByChild('userId'), equalTo(userId));
      snapshot = await get(subscriptionQuery);
    } catch (queryError) {
      // Fallback: read all subscriptions and search manually
      console.warn('[SUBSCRIPTION CHECK] ⚠️ Query failed, using manual search:', queryError);
      snapshot = await get(subscriptionsRef);
    }

    if (!snapshot.exists()) {
      console.log('[SUBSCRIPTION CHECK] No subscriptions found at all');
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
    
    snapshot.forEach((child: any) => {
      const childVal = child.val();
      console.log('[SUBSCRIPTION CHECK] Checking subscription:', { key: child.key, userId: childVal.userId });
      
      if (childVal && childVal.userId === userId) {
        // Get the most recent one
        if (!foundSubscription || new Date(childVal.createdAt) > new Date(foundSubscription.createdAt)) {
          foundSubscription = childVal;
          subscriptionKey = child.key;
        }
      }
    });

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

    console.log('[SUBSCRIPTION CHECK] Found subscription:', foundSubscription);

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
      console.log('[SUBSCRIPTION CHECK] Marking subscription as expired');
      const subRef = ref(rtdb, `subscriptions/${subscriptionKey}`);
      await update(subRef, { status: 'expired' });
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

    console.log('[SUBSCRIPTION CHECK] ✅ Returning subscription status:', responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[SUBSCRIPTION CHECK] ❌ Error checking subscription:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to check subscription', details: errorMsg },
      { status: 500 }
    );
  }
}
