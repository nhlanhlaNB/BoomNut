'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Check, Sparkles, Zap, Star, TrendingUp, Users, Award, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';
import AuthButton from '@/components/AuthButton';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    icon: Sparkles,
    color: 'from-gray-400 to-gray-600',
    popular: false,
    features: [
      '20 AI messages/day',
      '2 study sets/week',
      'Basic flashcards',
      'Limited practice tests',
      'Text uploads only',
    ],
    paypalPlanId: '',
  },
  {
    name: 'Premium',
    price: 3,
    period: '30 days',
    icon: Zap,
    color: 'from-emerald-500 to-teal-600',
    popular: true,
    features: [
      'Unlimited AI chat',
      'Unlimited study sets',
      'Unlimited flashcards',
      'Video & audio uploads',
      'Priority support',
    ],
    paypalPlanId: 'P-51711759R0127122YNHA4ITY',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const { subscription, isActive, showPaymentButton, daysRemaining, createSubscription, clearSubscription, refreshSubscription } = useSubscription();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const paypalButtonsRef = useRef<{ [key: string]: any }>({});

  const handleSubscriptionSuccess = async (subscriptionId: string, planName: string) => {
    if (!user) return;

    try {
      setLoading(null);
      console.log('[PAYPAL] Payment approved for:', { userId: user.uid, planName, subscriptionId });

      const result = await createSubscription(planName.toLowerCase(), subscriptionId);
      console.log('[PAYPAL] Subscription created:', result);

      // Wait for database to fully save
      console.log('[PAYPAL] Waiting for database to sync...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh subscription status
      console.log('[PAYPAL] Refreshing subscription status...');
      await refreshSubscription();

      alert(`✅ Successfully subscribed to ${planName} plan for 30 days!\n\nYour subscription is now active!`);
    } catch (error) {
      console.error('[PAYPAL] Error saving subscription:', error);
      alert('❌ Subscription created but failed to save to database. Please try refreshing the page or contact support.');
    }
  };

  useEffect(() => {
    if (!paypalLoaded || !user) return;

    const initializePayPalButtons = () => {
      plans.forEach((plan) => {
        if (plan.price === 0 || !plan.paypalPlanId) return;

        const containerId = `paypal-button-container-${plan.name.toLowerCase().replace(/\s+/g, '-')}`;
        const container = document.getElementById(containerId);

        if (!container || paypalButtonsRef.current[plan.name]) return;

        try {
          const buttons = (window as any).paypal.Buttons({
            style: {
              shape: 'rect',
              color: plan.popular ? 'blue' : 'gold',
              layout: 'vertical',
              label: 'pay',
            },
            createSubscription: function (data: any, actions: any) {
              return actions.subscription.create({
                plan_id: plan.paypalPlanId,
                custom_id: user?.uid,
              });
            },
            onApprove: function (data: any, actions: any) {
              handleSubscriptionSuccess(data.subscriptionID, plan.name);
            },
            onError: function (err: any) {
              console.error('PayPal error:', err);
              alert('Payment failed. Please try again.');
            },
          });

          buttons.render(`#${containerId}`);
          paypalButtonsRef.current[plan.name] = buttons;
        } catch (error) {
          console.error(`Error rendering PayPal button for ${plan.name}:`, error);
        }
      });
    };

    Object.values(paypalButtonsRef.current).forEach((button: any) => {
      if (button && button.close) button.close();
    });
    paypalButtonsRef.current = {};

    initializePayPalButtons();
  }, [paypalLoaded, user]);

  return (
    <div className="min-h-screen bg-white">

      {/* PayPal SDK */}
      <Script
        src="https://www.paypal.com/sdk/js?client-id=AV4Blmjwp981Sl85YsvLyCpdJC1qCdRnZ-Y6jzQNcFtEr9laPnG8zt3fQffQpBUmUzEo0UUlBd_McFGe&vault=true&intent=subscription"
        onLoad={() => setPaypalLoaded(true)}
        strategy="lazyOnload"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-16">

        {/* Subscription Status Banner */}
        {user && isActive && (
          <div className="mb-8 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-900">Active Subscription</p>
              <p className="text-sm text-green-800">{daysRemaining} days remaining • Plan: {subscription?.plan?.toUpperCase()}</p>
              <p className="text-xs text-green-700 mt-1">
                Your subscription will automatically renew on{' '}
                {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'TBD'}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 md:mb-10 space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Pick the perfect plan for your learning journey
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-16 max-w-3xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPaidPlan = plan.name === 'Premium';
            // Show subscribe/cancel based on: active subscription + on a paid plan = user is subscribed to this plan
            // Since Premium is the only paid plan, if they're active and this is Premium, show cancel button
            const isUserSubscribed = isActive && isPaidPlan;
            const showPayButton = plan.price > 0 && showPaymentButton && !isUserSubscribed;

            // Debug logging for each plan
            if (user) {
              console.log(`[PRICING] ${plan.name} card:`, {
                isActive,
                isPaidPlan,
                subscriptionPlan: subscription?.plan,
                isUserSubscribed,
                daysRemaining,
                showPayButton
              });
            }

            return (
              <div
                key={plan.name}
                className="relative group transform transition-all duration-500 hover:scale-105"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>POPULAR</span>
                    </div>
                  </div>
                )}

                <div
                  className={`relative bg-white rounded-lg shadow-md p-5 sm:p-6 border h-full flex flex-col ${
                    plan.popular
                      ? 'border-gray-400 shadow-lg'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {isUserSubscribed && (
                      <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">
                        ✓ Active
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>

                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-gray-900">Free</span>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                          <span className="text-sm text-gray-500">/{plan.period}</span>
                        </div>
                        {isPaidPlan && (
                          <div className="text-sm text-emerald-600 mt-2 font-bold">
                            📆 Renews every 30 days
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-2 mb-5 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 group/item">
                        <div className="flex-shrink-0 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mt-0.5 group-hover/item:scale-110 transition-transform">
                          <Check className="w-2.5 h-2.5 text-white font-bold" />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-700 font-medium leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {plan.price === 0 ? (
                    <button
                      disabled
                      className="w-full py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : isUserSubscribed ? (
                    <div className="flex flex-col gap-2">
                      <button
                        disabled
                        className="w-full py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm bg-green-100 text-green-700 cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        ✅ Active — {daysRemaining} days left
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to cancel this subscription?')) {
                            try {
                              console.log('[PRICING PAGE] Cancelling subscription...');
                              await clearSubscription?.();
                              
                              // Wait for database to sync
                              await new Promise(resolve => setTimeout(resolve, 1000));
                              
                              // Refresh the subscription status
                              await refreshSubscription();
                              
                              alert('✅ Subscription cancelled successfully!');
                            } catch (error) {
                              console.error('[PRICING PAGE] Cancel error:', error);
                              alert('Failed to cancel subscription. Please try again.');
                            }
                          }
                        }}
                        className="w-full py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        ✕ Cancel Subscription
                      </button>
                    </div>
                  ) : !user ? (
                    <button
                      onClick={() => alert('Please sign in to subscribe')}
                      className={`w-full py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl'
                          : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800'
                      }`}
                    >
                      Get Started
                    </button>
                  ) : showPayButton ? (
                    <div id={`paypal-button-container-${plan.name.toLowerCase().replace(/\s+/g, '-')}`} className="w-full" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Social Proof */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-16 text-center">
          {[
            { icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />, value: '10K+', label: 'Active Students' },
            { icon: <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 fill-yellow-500" />, value: '4.9/5', label: 'Average Rating' },
            { icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />, value: '95%', label: 'Success Rate' },
            { icon: <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />, value: '50K+', label: 'Study Sessions' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 max-w-4xl mx-auto border border-gray-200">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              { q: 'Can I cancel anytime?', a: "Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period." },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, and PayPal for your convenience.' },
              { q: 'Is there a student discount?', a: 'Yes! Students get 20% off any plan. Contact support with your student ID for the discount code.' },
              { q: 'Can I upgrade or downgrade my plan?', a: 'Absolutely! You can change your plan at any time from your account settings with no hassle.' },
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                <h3 className="font-bold text-gray-900 mb-3 text-base sm:text-lg flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{idx + 1}</span>
                  </div>
                  {faq.q}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed ml-8">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
