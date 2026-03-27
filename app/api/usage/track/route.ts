import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, update, set } from 'firebase/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const appName = req.nextUrl.searchParams.get('appName');

    if (!userId || !appName) {
      return NextResponse.json(
        { error: 'userId and appName are required' },
        { status: 400 }
      );
    }

    if (!rtdb) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Path: /users/{userId}/dailyUsage/{date}/{appName}
    const usageRef = ref(rtdb, `users/${userId}/dailyUsage/${today}/${appName}`);
    const snapshot = await get(usageRef);

    const currentUsage = snapshot.exists() ? snapshot.val() : 0;

    console.log(`[USAGE TRACK] User: ${userId}, App: ${appName}, Date: ${today}, Usage: ${currentUsage}`);

    return NextResponse.json({
      userId,
      appName,
      date: today,
      messageCount: currentUsage,
      remaining: Math.max(0, 2 - currentUsage),
      isLimitExceeded: currentUsage >= 2
    });
  } catch (error) {
    console.error('[USAGE TRACK] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, appName } = body;

    if (!userId || !appName) {
      return NextResponse.json(
        { error: 'userId and appName are required' },
        { status: 400 }
      );
    }

    if (!rtdb) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Path: /users/{userId}/dailyUsage/{date}/{appName}
    const usageRef = ref(rtdb, `users/${userId}/dailyUsage/${today}/${appName}`);
    const snapshot = await get(usageRef);

    const currentUsage = snapshot.exists() ? snapshot.val() : 0;
    const newUsage = currentUsage + 1;

    // Update usage in database
    await set(usageRef, newUsage);

    console.log(`[USAGE TRACK] Incremented - User: ${userId}, App: ${appName}, New Usage: ${newUsage}`);

    return NextResponse.json({
      userId,
      appName,
      date: today,
      messageCount: newUsage,
      remaining: Math.max(0, 2 - newUsage),
      isLimitExceeded: newUsage >= 2,
      success: true
    });
  } catch (error) {
    console.error('[USAGE TRACK] Error incrementing usage:', error);
    return NextResponse.json(
      { error: 'Failed to update usage' },
      { status: 500 }
    );
  }
}
