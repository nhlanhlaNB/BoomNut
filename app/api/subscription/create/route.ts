import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, plan, subscriptionId } = body;

    console.log('[SUBSCRIPTION CREATE] 📝 Raw request body:', JSON.stringify(body));
    console.log('[SUBSCRIPTION CREATE] 📝 Parsed values:', { userId, email, plan, subscriptionId });
    console.log('[SUBSCRIPTION CREATE] ⚠️ userId type:', typeof userId, 'value:', userId);
    console.log('[SUBSCRIPTION CREATE] ⚠️ email type:', typeof email, 'value:', email);

    if (!userId || !email || !plan) {
      console.error('[SUBSCRIPTION CREATE] ❌ Missing required fields:', { userId: !!userId, email: !!email, plan: !!plan });
      return NextResponse.json(
        { error: 'userId, email, and plan are required' },
        { status: 400 }
      );
    }

    if (!rtdb) {
      console.error('[SUBSCRIPTION CREATE] ❌ Firebase RTDB not initialized!');
      return NextResponse.json(
        { 
          error: 'Firebase Realtime Database not configured',
          details: 'RTDB is null - check .env.local for NEXT_PUBLIC_FIREBASE_DATABASE_URL'
        },
        { status: 500 }
      );
    }

    // Calculate 30-day expiry
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const endDateStr = endDate.toISOString();

    const subscriptionData = {
      userId,
      plan,
      status: 'active',
      email,
      subscriptionId: subscriptionId || null,
      startDate,
      endDate: endDateStr,
      createdAt: startDate,
    };

    console.log('[SUBSCRIPTION CREATE] 🔄 Writing to RTDB at subscriptions/');
    console.log('[SUBSCRIPTION CREATE] 📊 Data being written:', JSON.stringify(subscriptionData, null, 2));

    // Store subscription in Realtime Database at /subscriptions/{subscriptionId}
    const subId = subscriptionId || `sub_${userId}_${Date.now()}`;
    console.log('[SUBSCRIPTION CREATE] Generated subId:', subId);
    const subscriptionRef = ref(rtdb, `subscriptions/${subId}`);
    
    try {
      await set(subscriptionRef, subscriptionData);
      console.log('[SUBSCRIPTION CREATE] ✅ Write to RTDB succeeded at path: subscriptions/', subId);
    } catch (writeError) {
      console.error('[SUBSCRIPTION CREATE] ❌ RTDB write failed:', writeError);
      const errorMsg = writeError instanceof Error ? writeError.message : String(writeError);
      throw new Error(`Firebase write error: ${errorMsg}`);
    }

    // Verify the write by reading back
    try {
      const snapshot = await get(subscriptionRef);
      const storedData = snapshot.val();
      console.log('[SUBSCRIPTION CREATE] 🔍 Verification read from database:', JSON.stringify(storedData, null, 2));
      console.log('[SUBSCRIPTION CREATE] 🔍 Stored userId:', storedData?.userId, 'Expected:', userId, 'Match:', storedData?.userId === userId);
      console.log('[SUBSCRIPTION CREATE] 🔍 Stored plan:', storedData?.plan);
      console.log('[SUBSCRIPTION CREATE] 🔍 Stored status:', storedData?.status);
      
      // Now try to read all subscriptions to verify it's queryable
      console.log('[SUBSCRIPTION CREATE] 🔍 Reading all subscriptions to verify lookup...');
      const allSubsRef = ref(rtdb, 'subscriptions');
      const allSnapshot = await get(allSubsRef);
      
      if (allSnapshot.exists()) {
        let foundInQuery = false;
        allSnapshot.forEach((child: any) => {
          if (child.key === subId) {
            console.log('[SUBSCRIPTION CREATE] ✅ Found created subscription in full list with key:', child.key);
            foundInQuery = true;
          }
        });
        if (!foundInQuery) {
          console.warn('[SUBSCRIPTION CREATE] ⚠️ Created subscription NOT found in full subscription list');
        }
      }
    } catch (readError) {
      console.warn('[SUBSCRIPTION CREATE] ⚠️ Could not verify write:', readError);
    }

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
