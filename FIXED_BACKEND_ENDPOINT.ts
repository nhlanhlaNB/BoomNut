// FIXED BACKEND ENDPOINT: /app/api/subscription/create/route.ts
// This properly saves subscriptions to Firebase Realtime Database

import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan, subscriptionId } = await req.json();

    // Validate required fields
    if (!userId || !email || !plan) {
      return NextResponse.json(
        { error: 'userId, email, and plan are required' },
        { status: 400 }
      );
    }

    // Check Firebase RTDB is initialized
    if (!rtdb) {
      console.error('Firebase RTDB not initialized. Check NEXT_PUBLIC_FIREBASE_DATABASE_URL');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Prepare subscription data
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const subscriptionData = {
      userId,
      email,
      plan,
      status: 'active',
      subscriptionId: subscriptionId || null,
      startDate,
      endDate: endDate.toISOString(),
      createdAt: startDate,
    };

    // Write to Firebase Realtime Database
    const subId = subscriptionId || `sub_${userId}_${Date.now()}`;
    const subscriptionRef = ref(rtdb, `subscriptions/${subId}`);

    await set(subscriptionRef, subscriptionData);

    return NextResponse.json({
      success: true,
      message: 'Subscription created',
      subscriptionId: subId,
      subscription: subscriptionData
    });

  } catch (error) {
    console.error('[SUBSCRIPTION CREATE ERROR]:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create subscription'
      },
      { status: 500 }
    );
  }
}


// ==========================================
// IMPORTANT: Check your /lib/firebase.ts file
// It should look like this:
// ==========================================

/*

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const rtdb = getDatabase(app);
export const auth = getAuth(app);

*/
