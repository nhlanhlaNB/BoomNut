import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 'force-dynamic';

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

    // Get today's date in YYYY-MM-DD format (UTC)
    const today = new Date().toISOString().split('T')[0];
    
    // Path: /users/{userId}/dailyUsage/{date}/{appName}
    const dbUrl = `${FIREBASE_DB_URL}/users/${userId}/dailyUsage/${today}/${appName}.json`;
    console.log(`[USAGE GET] Fetching from: ${dbUrl}`);
    
    const response = await fetch(dbUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Authorization': req.headers.get('Authorization') || ''
      }
    });
    
    let currentUsage = 0;
    if (response.ok) {
      const data = await response.json();
      // Handle both null (no data) and actual number values
      currentUsage = data === null ? 0 : (typeof data === 'number' ? data : 0);
      console.log(`[USAGE GET] ✓ Retrieved usage for ${userId}/${appName}/${today}: ${currentUsage}`);
    } else if (response.status === 404) {
      // 404 means no data yet for today, which is normal
      console.log(`[USAGE GET] No data yet for ${userId}/${appName}/${today} (404)`);
      currentUsage = 0;
    } else {
      console.error(`[USAGE GET] Failed to fetch: ${response.statusText}`);
      currentUsage = 0;
    }

    return NextResponse.json({
      userId,
      appName,
      date: today,
      messageCount: currentUsage,
      count: currentUsage,
      remaining: Math.max(0, 2 - currentUsage),
      isLimitExceeded: currentUsage >= 2
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[USAGE GET] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get usage', 
        messageCount: 0, 
        count: 0,
        remaining: 2, 
        isLimitExceeded: false 
      },
      { status: 200 }
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

    // Get today's date in YYYY-MM-DD format (UTC)
    const today = new Date().toISOString().split('T')[0];
    
    // Get current usage
    const getUrl = `${FIREBASE_DB_URL}/users/${userId}/dailyUsage/${today}/${appName}.json`;
    console.log(`[USAGE POST] Getting current usage from: ${getUrl.replace(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '', 'DB_URL')}`);
    
    const getResponse = await fetch(getUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    let currentUsage = 0;
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      currentUsage = data === null ? 0 : (typeof data === 'number' ? data : 0);
      console.log(`[USAGE POST] Current usage from DB: ${currentUsage}`);
    } else if (getResponse.status !== 404) {
      console.error(`[USAGE POST] ✗ Failed to GET current usage: ${getResponse.statusText}`);
    }

    const newUsage = currentUsage + 1;

    // Update usage in database
    const putUrl = `${FIREBASE_DB_URL}/users/${userId}/dailyUsage/${today}/${appName}.json`;
    console.log(`[USAGE POST] Attempting PUT: ${newUsage} to ${appName}/${today} at ${putUrl}`);
    
    // Check if we have an Auth token in headers (forwarded from client if present)
    const authHeader = req.headers.get('Authorization');
    const fetchOptions: RequestInit = {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify(newUsage),
      cache: 'no-store'
    };

    if (authHeader) {
      console.log(`[USAGE POST] Using Authorization header found in request`);
      (fetchOptions.headers as any)['Authorization'] = authHeader;
    }
    
    const putResponse = await fetch(putUrl, fetchOptions);

    if (!putResponse.ok) {
      const errorText = await putResponse.text();
      console.error(`[USAGE POST] ✗ Firebase rejected write (${putResponse.status}): ${putResponse.statusText}`);
      console.error(`[USAGE POST] error body: ${errorText}`);
      console.error(`[USAGE POST] ⚠️ RULES CHECK: This error means Firebase Realtime Database rules might not include 'dailyUsage' path`);
      console.error(`[USAGE POST] 💡 FIX: Update Firebase rules with FIREBASE_RTDB_RULES_WITH_DAILY_USAGE.json`);
      
      // Still return success with calculated value for immediate UX, but mark as not persisted
      return NextResponse.json({
        userId,
        appName,
        date: today,
        messageCount: newUsage,
        count: newUsage,
        remaining: Math.max(0, 2 - newUsage),
        isLimitExceeded: newUsage >= 2,
        success: false,
        error: `Firebase rejected write: ${putResponse.statusText}`,
        rulesCheckNeeded: putResponse.status === 403 // 403 = permission denied
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // Verify write succeeded by reading back
    const verifyResponse = await fetch(getUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

    let verifiedUsage = newUsage;
    if (verifyResponse.ok) {
      const verifiedData = await verifyResponse.json();
      verifiedUsage = verifiedData === null ? newUsage : (typeof verifiedData === 'number' ? verifiedData : newUsage);
      console.log(`[USAGE POST] ✓ Verified write succeeded: ${verifiedUsage}`);
      
      if (verifiedUsage !== newUsage) {
        console.warn(`[USAGE POST] ⚠️ Verification mismatch: expected ${newUsage}, got ${verifiedUsage}`);
      }
    } else {
      console.warn(`[USAGE POST] ⚠️ Could not verify write: ${verifyResponse.statusText}`);
    }

    console.log(`[USAGE POST] ✓ SUCCESS - User: ${userId}, App: ${appName}, Count: ${verifiedUsage}`);

    return NextResponse.json({
      userId,
      appName,
      date: today,
      messageCount: verifiedUsage,
      count: verifiedUsage,
      remaining: Math.max(0, 2 - verifiedUsage),
      isLimitExceeded: verifiedUsage >= 2,
      success: true
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[USAGE POST] ✗ Exception:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update usage', 
        messageCount: 0,
        count: 0,
        success: false 
      },
      { status: 200 }
    );
  }
}
