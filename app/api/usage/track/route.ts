import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FIREBASE_DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://tutapp-88bf0-default-rtdb.firebaseio.com';

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

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Path: /users/{userId}/dailyUsage/{date}/{appName}
    const response = await fetch(`${FIREBASE_DB_URL}/users/${userId}/dailyUsage/${today}/${appName}.json`);
    
    let currentUsage = 0;
    if (response.ok) {
      const data = await response.json();
      currentUsage = data || 0;
    }

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
    console.error('[USAGE TRACK] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage', messageCount: 0, remaining: 2, isLimitExceeded: false },
      { status: 200 } // Return 200 to prevent client retry loops
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

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get current usage
    const getResponse = await fetch(`${FIREBASE_DB_URL}/users/${userId}/dailyUsage/${today}/${appName}.json`);
    let currentUsage = 0;
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      currentUsage = data || 0;
    }

    const newUsage = currentUsage + 1;

    // Update usage in database
    const putResponse = await fetch(`${FIREBASE_DB_URL}/users/${userId}/dailyUsage/${today}/${appName}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUsage)
    });

    if (!putResponse.ok) {
      console.error(`[USAGE TRACK] Failed to update: ${putResponse.statusText}`);
      return NextResponse.json({
        userId,
        appName,
        date: today,
        messageCount: newUsage,
        remaining: Math.max(0, 2 - newUsage),
        isLimitExceeded: newUsage >= 2,
        success: false
      }, { status: 200 });
    }

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
    console.error('[USAGE TRACK] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to update usage', success: false },
      { status: 200 } // Return 200 to prevent client retry loops
    );
  }
}
