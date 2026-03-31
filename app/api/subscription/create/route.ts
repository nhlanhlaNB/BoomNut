import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan, subscriptionId } = await req.json();

    console.log('[SUBSCRIPTION CREATE] 📝 Received request:', { userId, email, plan, subscriptionId });

    if (!userId || !email || !plan) {
      console.error('[SUBSCRIPTION CREATE] ❌ Missing required fields:', { userId: !!userId, email: !!email, plan: !!plan });
      return NextResponse.json(
        { error: 'userId, email, and plan are required' },
        { status: 400 }
      );
    }

    if (!rtdb) {
      console.error('[SUBSCRIPTION CREATE] ❌ Firebase RTDB not initialized!');
      console.error('[SUBSCRIPTION CREATE] rtdb:', rtdb);
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
    const subscriptionRef = ref(rtdb, `subscriptions/${subId}`);
    
    try {
      await set(subscriptionRef, subscriptionData);
      console.log('[SUBSCRIPTION CREATE] ✅ Write to RTDB succeeded');
    } catch (writeError) {
      console.error('[SUBSCRIPTION CREATE] ❌ RTDB write failed:', writeError);
      const errorMsg = writeError instanceof Error ? writeError.message : String(writeError);
      throw new Error(`Firebase write error: ${errorMsg}`);
    }

    // Verify the write by reading back
    try {
      const snapshot = await get(subscriptionRef);
      console.log('[SUBSCRIPTION CREATE] 🔍 Verification read:', snapshot.val());
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
