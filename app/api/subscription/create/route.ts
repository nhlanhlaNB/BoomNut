import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan, subscriptionId } = await req.json();

    console.log('[SUBSCRIPTION CREATE] Attempting to create subscription:', { userId, email, plan });

    if (!userId || !email || !plan) {
      console.error('[SUBSCRIPTION CREATE] Missing required fields:', { userId: !!userId, email: !!email, plan: !!plan });
      return NextResponse.json(
        { error: 'userId, email, and plan are required' },
        { status: 400 }
      );
    }

    if (!rtdb) {
      console.error('[SUBSCRIPTION CREATE] Firebase Realtime Database not initialized!');
      console.error('[SUBSCRIPTION CREATE] rtdb value:', rtdb);
      return NextResponse.json(
        { 
          error: 'Firebase Realtime Database not configured. Check your Firebase project settings.',
          details: 'Make sure you have enabled Realtime Database in your Firebase Console'
        },
        { status: 500 }
      );
    }

    // Calculate 30-day expiry
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const endDateStr = endDate.toISOString();

    console.log('[SUBSCRIPTION CREATE] Saving to database:', { userId, plan, status: 'active', email });

    // Store subscription in Realtime Database at /users/{userId}/subscription
    const subscriptionRef = ref(rtdb, `users/${userId}/subscription`);
    await set(subscriptionRef, {
      plan,
      status: 'active',
      email,
      subscriptionId: subscriptionId || null,
      startDate,
      endDate: endDateStr,
      createdAt: startDate,
    });

    console.log('[SUBSCRIPTION CREATE] ✅ Subscription created successfully for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        plan,
        status: 'active',
        email,
        startDate,
        endDate: endDateStr,
        daysRemaining: 30
      }
    });
  } catch (error) {
    console.error('[SUBSCRIPTION CREATE] ❌ Error creating subscription:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        details: errorMsg,
        message: errorMsg
      },
      { status: 500 }
    );
  }
}
