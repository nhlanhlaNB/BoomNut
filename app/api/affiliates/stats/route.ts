import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FIREBASE_DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!FIREBASE_DB_URL) {
      return NextResponse.json(
        { error: 'Firebase database URL not configured' },
        { status: 500 }
      );
    }

    const userAffiliateUrl = `${FIREBASE_DB_URL}/affiliates/${userId}.json`;
    const response = await fetch(userAffiliateUrl, { cache: 'no-store' });
    const affiliateData = await response.json();

    if (!affiliateData) {
      return NextResponse.json({
        referralCode: null,
        totalReferrals: 0,
        activeReferrals: 0,
        referrals: [],
        message: 'No affiliate data found',
      });
    }

    const referrals = affiliateData.referrals 
      ? Object.entries(affiliateData.referrals).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }))
      : [];

    // Fetch all subscriptions once to avoid index errors in Firebase
    let allSubscriptions: any = {};
    try {
      const allSubsUrl = `${FIREBASE_DB_URL}/subscriptions.json`;
      const allSubsRes = await fetch(allSubsUrl, { cache: 'no-store' });
      allSubscriptions = await allSubsRes.json() || {};
    } catch (err) {
      console.error('Error fetching all subscriptions:', err);
    }

    const enhancedReferrals = referrals.map((ref: any) => {
      let hasPaid = false;
      const refUserId = ref.userId || ref.id;
      
      // Filter subscriptions in memory
      const userSubs = Object.values(allSubscriptions).filter(
        (sub: any) => sub && sub.userId === refUserId
      );
      
      hasPaid = userSubs.some((sub: any) => sub.status === 'active');
      
      return {
        ...ref,
        hasPaid
      };
    });

    return NextResponse.json({
      referralCode: affiliateData.referralCode || null,
      totalReferrals: affiliateData.stats?.totalReferrals || 0,
      activeReferrals: affiliateData.stats?.activeReferrals || 0,
      referrals: enhancedReferrals,
      createdAt: affiliateData.createdAt,
    });
  } catch (error: any) {
    console.error('Error fetching affiliate stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch affiliate stats' },
      { status: 500 }
    );
  }
}


