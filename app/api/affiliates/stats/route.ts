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

    const enhancedReferrals = await Promise.all(referrals.map(async (ref: any) => {
      let hasPaid = false;
      try {
        const subUrl = `${FIREBASE_DB_URL}/subscriptions.json?orderBy="userId"&equalTo="${ref.userId || ref.id}"`;
        const subRes = await fetch(subUrl, { cache: 'no-store' });
        const subData = await subRes.json();
        if (subData && typeof subData === 'object') {
          hasPaid = Object.values(subData).some((sub: any) => sub.status === 'active');
        }
      } catch (err) {
        console.error('Error fetching subscription for referral:', err);
      }
      return {
        ...ref,
        hasPaid
      };
    }));

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


