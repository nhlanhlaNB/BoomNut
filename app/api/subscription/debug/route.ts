import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  
  console.log('[DEBUG] Checking subscriptions for userId:', userId);
  
  try {
    if (!rtdb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Read all subscriptions
    const subscriptionsRef = ref(rtdb, 'subscriptions');
    const snapshot = await get(subscriptionsRef);

    if (!snapshot.exists()) {
      return NextResponse.json({
        message: 'No subscriptions found in database',
        allSubscriptions: [],
        userSubscriptions: []
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
        startDate: childVal?.startDate,
        fulData: childVal // Include full data
      };
      
      allSubscriptions.push(sub);
      
      if (userId && childVal?.userId === userId) {
        userSubscriptions.push(sub);
      }
    });

    return NextResponse.json({
      message: 'Debug data',
      searchingForUserId: userId,
      totalSubscriptions: allSubscriptions.length,
      matchingSubscriptions: userSubscriptions.length,
      allSubscriptions: allSubscriptions,
      userSubscriptions: userSubscriptions
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
