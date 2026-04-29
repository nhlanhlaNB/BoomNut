import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

export async function POST(request: NextRequest) {
  try {
    const { referralCode, newUserId, email } = await request.json();

    if (!referralCode || !newUserId || !email) {
      return NextResponse.json(
        { error: 'Referral code, user ID, and email are required' },
        { status: 400 }
      );
    }

    if (!FIREBASE_DB_URL) {
      return NextResponse.json(
        { error: 'Firebase database URL not configured' },
        { status: 500 }
      );
    }

    // Validate referral code format
    if (referralCode.trim().length === 0) {
      return NextResponse.json(
        { valid: false, message: 'Referral code is empty' },
        { status: 200 }
      );
    }

    // Find the referral code in the referralCodes collection
    const codeUrl = `${FIREBASE_DB_URL}/referralCodes/${referralCode}.json`;
    const codeResponse = await fetch(codeUrl, { cache: 'no-store' });
    const referralData = await codeResponse.json();

    if (!referralData) {
      return NextResponse.json(
        { valid: false, message: 'Referral code not found' },
        { status: 200 }
      );
    }

    const referrerId = referralData.userId;

    // Check if referrer still exists
    const referrerUrl = `${FIREBASE_DB_URL}/affiliates/${referrerId}.json`;
    const referrerResponse = await fetch(referrerUrl, { cache: 'no-store' });
    const referrerData = await referrerResponse.json();

    if (!referrerData) {
      return NextResponse.json(
        { valid: false, message: 'Referrer account not found' },
        { status: 200 }
      );
    }

    const now = new Date().toISOString();

    // Add referral to the referrer's account
    const referralUrl = `${FIREBASE_DB_URL}/affiliates/${referrerId}/referrals/${newUserId}.json`;
    await fetch(referralUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: newUserId,
        email,
        referredAt: now,
        status: 'active',
      }),
    });

    // Update referrer's statistics
    const referrerStatsUrl = `${FIREBASE_DB_URL}/affiliates/${referrerId}/stats.json`;
    const referrerStatsResponse = await fetch(referrerStatsUrl, { cache: 'no-store' });
    const referrerStats = await referrerStatsResponse.json();
    
    let currentTotal = 0;
    let currentActive = 0;

    if (referrerStats) {
      currentTotal = referrerStats.totalReferrals || 0;
      currentActive = referrerStats.activeReferrals || 0;
    }

    await fetch(referrerStatsUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalReferrals: currentTotal + 1,
        activeReferrals: currentActive + 1,
      }),
    });

    // Store referrer info in new user's data for tracking
    const newUserReferrerUrl = `${FIREBASE_DB_URL}/users/${newUserId}/referredBy.json`;
    await fetch(newUserReferrerUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrerId,
        referralCode,
        referredAt: now,
      }),
    });

    return NextResponse.json({
      valid: true,
      message: 'Referral code is valid',
      referrerId,
    });
  } catch (error: any) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}
