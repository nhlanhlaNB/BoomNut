import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, update, get } from 'firebase/database';

// Map PayPal plan ID to subscription tier
function getPlanNameFromPlanId(planId: string): string {
  const planMap: { [key: string]: string } = {
    'P-51711759R0127122YNHA4ITY': 'basic',     // $3 30-day plan
    'P-7N509033WG9931346NFP5YAQ': 'pro',       // Pro monthly
    'P-8W509033WG9931346NFP5YAQ': 'premium',   // Premium monthly
  };
  return planMap[planId] || 'free';
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('paypal-transmission-sig');
    
    if (!signature) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
    }

    const body = await req.text();
    const event = JSON.parse(body);

    if (!event.resource) {
      return NextResponse.json({ success: true });
    }

    const subscriptionId = event.resource.id;
    const status = event.resource.status;
    const planId = event.resource.plan_id;
    const customId = event.resource.custom_id;

    if (!rtdb) {
      console.warn('Realtime Database not configured');
      return NextResponse.json({ success: true });
    }

    // Handle subscription cancellation/suspension
    if (status === 'CANCELLED' || status === 'SUSPENDED') {
      if (customId) {
        const subscriptionRef = ref(rtdb, `users/${customId}/subscription`);
        await update(subscriptionRef, {
          status: 'expired',
          endDate: new Date().toISOString(),
        });
      }
      return NextResponse.json({ 
        success: true, 
        message: `Subscription ${status.toLowerCase()}` 
      });
    }

    // Handle new subscription activation
    if (status === 'ACTIVE' && customId) {
      const planName = getPlanNameFromPlanId(planId);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days from now

      const subscriptionRef = ref(rtdb, `users/${customId}/subscription`);
      const snapshot = await get(subscriptionRef);
      
      if (snapshot.exists()) {
        const currentData = snapshot.val();
        await update(subscriptionRef, {
          plan: planName,
          status: 'active',
          subscriptionId: subscriptionId,
          startDate: new Date().toISOString(),
          endDate: endDate.toISOString(),
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Subscription activated' 
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
