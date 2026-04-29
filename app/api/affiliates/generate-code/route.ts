import { NextRequest, NextResponse } from 'next/server';

// Generate a unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const FIREBASE_DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

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

    // Check if user already has a referral code
    const userAffiliateUrl = `${FIREBASE_DB_URL}/affiliates/${userId}.json`;
    let userAffiliateResponse = await fetch(userAffiliateUrl);
    let userAffiliateData = await userAffiliateResponse.json();

    if (userAffiliateData && userAffiliateData.referralCode) {
      const existingCode = userAffiliateData.referralCode;
      return NextResponse.json({
        code: existingCode,
        message: 'Referral code already exists',
      });
    }

    // Generate unique code
    let referralCode = generateReferralCode();
    let codeExists = true;
    let attempts = 0;

    while (codeExists && attempts < 10) {
      const codeUrl = `${FIREBASE_DB_URL}/referralCodes/${referralCode}.json`;
      const codeResponse = await fetch(codeUrl);
      const codeData = await codeResponse.json();
      
      if (codeData === null) {
        codeExists = false;
      } else {
        referralCode = generateReferralCode();
      }
      attempts++;
    }

    if (codeExists) {
      return NextResponse.json(
        { error: 'Failed to generate unique referral code' },
        { status: 500 }
      );
    }

    // Save referral code
    const now = new Date().toISOString();
    
    // Create referral code entry
    const codeEntryUrl = `${FIREBASE_DB_URL}/referralCodes/${referralCode}.json`;
    await fetch(codeEntryUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        code: referralCode,
        createdAt: now,
      }),
    });

    // Create/update user affiliate entry
    const userAffiliateUpdateUrl = `${FIREBASE_DB_URL}/affiliates/${userId}.json`;
    const userAffiliateUpdateData = {
      userId,
      referralCode,
      createdAt: now,
      referrals: {},
      stats: {
        totalReferrals: 0,
        activeReferrals: 0,
      },
    };

    await fetch(userAffiliateUpdateUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAffiliateUpdateData),
    });

    return NextResponse.json({
      code: referralCode,
      message: 'Referral code generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating referral code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate referral code' },
      { status: 500 }
    );
  }
}

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

    const userAffiliateUrl = `${FIREBASE_DB_URL}/affiliates/${userId}/referralCode.json`;
    const response = await fetch(userAffiliateUrl);
    const data = await response.json();

    if (data) {
      return NextResponse.json({
        code: data,
      });
    }

    return NextResponse.json(
      { error: 'No referral code found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error fetching referral code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referral code' },
      { status: 500 }
    );
  }
}
