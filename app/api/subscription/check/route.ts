import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
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

    // Check subscription in Realtime Database at /users/{userId}/subscription
    const subscriptionRef = ref(rtdb, `users/${userId}/subscription`);
    const snapshot = await get(subscriptionRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { 
          isActive: false, 
          status: 'no_subscription',
          message: 'No subscription found'
        },
        { status: 200 }
      );
    }

    const subscription = snapshot.val();

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
    if (!isActive && subscription.status === 'active') {
      await update(subscriptionRef, {
        status: 'expired'
      });
    }

    return NextResponse.json({
      isActive,
      status: isActive ? 'active' : 'expired',
      plan: subscription.plan || 'basic',
      email: subscription.email,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
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
