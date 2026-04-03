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
        { error: 'Database not initialized', totalSubscriptions: 0, userSubscriptions: [] },
        { status: 200 }
      );
    }

    // Read all subscriptions
    console.log('[DEBUG API] Calling Firebase get()...');
    const subscriptionsRef = ref(rtdb, 'subscriptions');
    const snapshot = await get(subscriptionsRef);
    console.log('[DEBUG API] Got snapshot, exists:', snapshot.exists());

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
    
    console.log('[DEBUG API] Starting forEach loop...');
    snapshot.forEach((child: any) => {
      try {
        const childVal = child.val();
        console.log('[DEBUG API] Processing child with key:', child.key, 'value:', childVal);
        
        const sub = {
          key: child.key || 'NO_KEY',
          userId: childVal?.userId || 'NO_UID',
          email: childVal?.email || 'NO_EMAIL',
          plan: childVal?.plan || 'NO_PLAN',
          status: childVal?.status || 'NO_STATUS',
          createdAt: childVal?.createdAt || '',
          endDate: childVal?.endDate || '',
          startDate: childVal?.startDate || ''
        };
        
        allSubscriptions.push(sub);
        console.log('[DEBUG API] Added subscription:', sub.key);
        
        // Safe comparison
        if (userId && childVal?.userId) {
          const storedUid = String(childVal.userId).trim();
          const searchUid = String(userId).trim();
          console.log('[DEBUG API] Comparing:', JSON.stringify(storedUid), '===', JSON.stringify(searchUid), '?', storedUid === searchUid);
          
          if (storedUid === searchUid) {
            console.log('[DEBUG API] ✅ MATCH FOUND!');
            userSubscriptions.push(sub);
          }
        }
      } catch (childError) {
        console.error('[DEBUG API] Error processing child:', childError);
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
    console.error('[DEBUG API] Top-level error:', error);
    console.error('[DEBUG API] Error type:', error instanceof Error ? 'Error instance' : typeof error);
    console.error('[DEBUG API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[DEBUG API] Stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
        totalSubscriptions: 0,
        userSubscriptions: []
      },
      { status: 200 } // Return 200 to prevent infinite retries
    );
  }
}
