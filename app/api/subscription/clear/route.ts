import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, remove } from 'firebase/database';

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
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Clear subscription data for this user
    const subscriptionRef = ref(rtdb, `users/${userId}/subscription`);
    await remove(subscriptionRef);

    return NextResponse.json({
      success: true,
      message: 'Subscription data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to clear subscription' },
      { status: 500 }
    );
  }
}
