import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan, subscriptionId } = await req.json();

    if (!userId || !email || !plan) {
      return NextResponse.json(
        { error: 'userId, email, and plan are required' },
        { status: 400 }
      );
    }

    if (!rtdb) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Calculate 30-day expiry
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const endDateStr = endDate.toISOString();

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
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
