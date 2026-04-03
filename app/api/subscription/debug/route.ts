import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  
  console.log('[DEBUG API] Request URL:', req.nextUrl.toString());
  console.log('[DEBUG API] Searching for userId:', userId);
  console.log('[DEBUG API] userId type:', typeof userId);
  
  try {
    if (!rtdb) {
      console.error('[DEBUG API] Database not initialized');
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Read all subscriptions
    const subscriptionsRef = ref(rtdb, 'subscriptions');
    const snapshot = await get(subscriptionsRef);

    if (!snapshot.exists()) {
      console.log('[DEBUG API] No subscriptions in database');
      return NextResponse.json({
        message: 'No subscriptions found in database',
        searchingForUserId: userId,
        totalSubscriptions: 0,
        matchingSubscriptions: 0,
        allSubscriptions: [],
        userSubscriptions: [],
        databaseEmpty: true
      });
    }

    const allSubscriptions: any[] = [];
    const userSubscriptions: any[] = [];
    
    snapshot.forEach((child: any) => {
      const childVal = child.val();
      const sub = {
        key: child.key,
        userId: childVal?.userId,
        email: childVal?.email,
        plan: childVal?.plan,
        status: childVal?.status,
        createdAt: childVal?.createdAt,
        endDate: childVal?.endDate,
        startDate: childVal?.startDate
      };
      
      allSubscriptions.push(sub);
      console.log('[DEBUG API] Found subscription:', sub.key, 'with userId:', sub.userId);
      
      if (userId && String(childVal?.userId) === String(userId)) {
        console.log('[DEBUG API] ✅ MATCH! Stored userId matches search userId');
        userSubscriptions.push(sub);
      }
    });

    console.log('[DEBUG API] Summary - Total found:', allSubscriptions.length, 'Matched:', userSubscriptions.length);

    return NextResponse.json({
      message: 'Debug data',
      searchingForUserId: userId,
      totalSubscriptions: allSubscriptions.length,
      matchingSubscriptions: userSubscriptions.length,
      allSubscriptions: allSubscriptions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
      userSubscriptions: userSubscriptions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    });
  } catch (error) {
    console.error('[DEBUG API] Error:', error);
    return NextResponse.json(
      { error: String(error), details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
