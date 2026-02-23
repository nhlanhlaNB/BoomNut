'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Check, Sparkles, Zap, Crown, Home, Star, TrendingUp, Users, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import AuthButton from '@/components/AuthButton';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    icon: Sparkles,
    color: 'from-gray-400 to-gray-600',
    features: [
      '5 AI tutor messages per day',
      '2 study sets per week',
      'Basic flashcards (10 cards max)',
      'Limited practice tests',
      'Text-only uploads',
    ],
    limitations: [
      'No video/audio uploads',
      'No live lecture assistant',
      'No photo uploads',
      'No handwritten notes scanning',
    ],
  },
  {
    name: 'Pro',
    price: 10,
    yearlyPrice: 5,
    period: 'month',
    icon: Zap,
    color: 'from-blue-500 to-purple-600',
    popular: true,
    paypalPlanId: 'P-0EW71788K8993972RNFP4YOY', // Monthly plan ID
    paypalYearlyPlanId: 'P-33A20854VN557325GNFP6CYQ', // Yearly plan ID ($5/month = $60/year)
    features: [
      'Unlimited chat with Lisa AI tutor',
      'Unlimited study sets',
      'Unlimited AI practice tests & flashcards',
      'Video & audio uploads',
      'Photo upload support',
      'Priority AI response',
      'Advanced study analytics',
    ],
  },
  {
    name: 'Premium',
    price: 15,
    yearlyPrice: 10,
    period: 'month',
    icon: Crown,
    color: 'from-yellow-500 to-orange-600',
    paypalPlanId: 'P-8W509033WG9931346NFP5YAQ', // Premium monthly plan ID
    paypalYearlyPlanId: 'P-3NC19032VG801351ENFP56MY', // Premium yearly plan ID ($10/month = $120/year)
    features: [
      'Everything in Pro, plus:',
      'Live Lecture Assistant with real-time notes',
      'Handwritten notes scanning & digitization',
      'Advanced OCR for complex equations',
      'Study room hosting (unlimited participants)',
      'Export to PDF, Word, Notion',
      'Custom AI tutor personality',
      'Priority support',
    ],
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const paypalButtonsRef = useRef<{ [key: string]: any }>({});

  // Handle subscription success
  const handleSubscriptionSuccess = async (subscriptionId: string, planName: string) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        subscription: {
          plan: planName.toLowerCase(),
          subscriptionId: subscriptionId,
          startDate: new Date(),
          status: 'active',
          billingPeriod: billingPeriod,
        },
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
      }, { merge: true });

      alert(`Successfully subscribed to ${planName} plan! Subscription ID: ${subscriptionId}`);
      router.push('/');
    } catch (error) {
      console.error('Error saving subscription:', error);
      alert('Subscription created but failed to save. Please contact support.');
    }
  };

  // Initialize PayPal buttons when SDK loads
  useEffect(() => {
    if (!paypalLoaded || !user) return;

    const initializePayPalButtons = () => {
      plans.forEach((plan) => {
        if (plan.price === 0 || !plan.paypalPlanId) return;

        const containerId = `paypal-button-container-${plan.name.toLowerCase()}`;
        const container = document.getElementById(containerId);
        
        if (!container || paypalButtonsRef.current[plan.name]) return;

        const planId = billingPeriod === 'yearly' && plan.paypalYearlyPlanId 
          ? plan.paypalYearlyPlanId 
          : plan.paypalPlanId;

        try {
          const buttons = (window as any).paypal.Buttons({
            style: {
              shape: 'rect',
              color: plan.popular ? 'blue' : 'gold',
              layout: 'vertical',
              label: 'subscribe'
            },
            createSubscription: function(data: any, actions: any) {
              return actions.subscription.create({
                plan_id: planId,
                custom_id: user?.uid // Store user ID for webhook processing
              });
            },
            onApprove: function(data: any, actions: any) {
              handleSubscriptionSuccess(data.subscriptionID, plan.name);
            },
            onError: function(err: any) {
              console.error('PayPal error:', err);
              alert('Payment failed. Please try again.');
            }
          });

          buttons.render(`#${containerId}`);
          paypalButtonsRef.current[plan.name] = buttons;
        } catch (error) {
          console.error(`Error rendering PayPal button for ${plan.name}:`, error);
        }
      });
    };

    // Clear existing buttons when billing period changes
    Object.values(paypalButtonsRef.current).forEach((button: any) => {
      if (button && button.close) {
        button.close();
      }
    });
    paypalButtonsRef.current = {};

    // Re-initialize buttons
    initializePayPalButtons();
  }, [paypalLoaded, billingPeriod, user]);

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      alert('Please sign in to subscribe');
      return;
    }

    setLoading(planName);

    try {
      // In a real app, you would integrate with Stripe or another payment processor
      // For now, we'll just update the user's subscription in Firestore
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        subscription: {
          plan: planName.toLowerCase(),
          startDate: new Date(),
          status: 'active',
        },
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
      }, { merge: true });

      alert(`Successfully subscribed to ${planName} plan!`);
      router.push('/');
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* PayPal SDK */}
      <Script
        src="https://www.paypal.com/sdk/js?client-id=AV4Blmjwp981Sl85YsvLyCpdJC1qCdRnZ-Y6jzQNcFtEr9laPnG8zt3fQffQpBUmUzEo0UUlBd_McFGe&vault=true&intent=subscription"
        onLoad={() => setPaypalLoaded(true)}
        strategy="lazyOnload"
      />

      <header className="z-10 p-4 md:p-6 bg-white/70 backdrop-blur-lg shadow-sm sticky top-0 border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors group">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:inline bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">BoomNut</span>
          </Link>
          <AuthButton />
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-16">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16 space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full border border-indigo-200 backdrop-blur-sm">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">Trusted by 10,000+ students</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 leading-tight">
            Supercharge Your Learning
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join thousands of students achieving their goals with AI-powered study tools
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 sm:gap-4 bg-white rounded-full p-1.5 sm:p-2 shadow-xl border border-gray-200">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 sm:px-8 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 sm:px-8 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all duration-300 relative ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full font-bold shadow-lg animate-bounce">
                Save up to 50%! 🎉
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const displayPrice = billingPeriod === 'yearly' && plan.yearlyPrice 
              ? plan.yearlyPrice 
              : plan.price;
            const totalYearly = plan.yearlyPrice ? plan.yearlyPrice * 12 : null;
            const savings = plan.price > 0 && plan.yearlyPrice 
              ? Math.round(((plan.price - plan.yearlyPrice) / plan.price) * 100)
              : 0;
            
            return (
              <div
                key={plan.name}
                className={`relative group transform transition-all duration-500 hover:scale-105 ${
                  plan.popular ? 'md:-mt-4 md:scale-110' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-1.5 animate-pulse">
                      <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>MOST POPULAR</span>
                    </div>
                  </div>
                )}

                <div
                  className={`relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border-2 h-full flex flex-col ${
                    plan.popular 
                      ? 'border-indigo-400 shadow-indigo-200/50' 
                      : 'border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  {/* Icon & Badge */}
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                    </div>
                    {billingPeriod === 'yearly' && savings > 0 && (
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        Save {savings}%
                      </div>
                    )}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  
                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div>
                        <span className="text-4xl sm:text-5xl font-extrabold text-gray-900">Free</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            ${displayPrice}
                          </span>
                          <span className="text-xl text-gray-500">/month</span>
                        </div>
                        {billingPeriod === 'yearly' && totalYearly && (
                          <div className="text-sm text-gray-500 mt-2 font-medium">
                            ${totalYearly} billed annually
                          </div>
                        )}
                        {billingPeriod === 'monthly' && (
                          <div className="text-xs text-gray-400 mt-1">
                            or ${plan.price * 12}/year
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 sm:space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 group/item">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mt-0.5 group-hover/item:scale-110 transition-transform">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white font-bold" />
                        </div>
                        <span className="text-sm sm:text-base text-gray-700 font-medium leading-relaxed">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((limitation, idx) => (
                      <li key={idx} className="flex items-start gap-3 opacity-50">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-red-500 text-xs sm:text-sm">✕</span>
                        </div>
                        <span className="text-sm sm:text-base text-gray-500 line-through">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {plan.price === 0 ? (
                    <button
                      disabled
                      className="w-full py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-base bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <div>
                      {!user ? (
                        <button
                          onClick={() => alert('Please sign in to subscribe')}
                          className={`w-full py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            plan.popular
                              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl'
                              : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800'
                          }`}
                        >
                          Get Started
                        </button>
                      ) : (
                        <div id={`paypal-button-container-${plan.name.toLowerCase()}`} className="w-full"></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Social Proof */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-16 text-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex justify-center mb-2">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">10K+</div>
            <div className="text-xs sm:text-sm text-gray-600">Active Students</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex justify-center mb-2">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">4.9/5</div>
            <div className="text-xs sm:text-sm text-gray-600">Average Rating</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex justify-center mb-2">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">95%</div>
            <div className="text-xs sm:text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex justify-center mb-2">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">50K+</div>
            <div className="text-xs sm:text-sm text-gray-600">Study Sessions</div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 max-w-4xl mx-auto border border-gray-200">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, debit cards, and PayPal for your convenience."
              },
              {
                q: "Is there a student discount?",
                a: "Yes! Students get 20% off any plan. Contact support with your student ID for the discount code."
              },
              {
                q: "Can I upgrade or downgrade my plan?",
                a: "Absolutely! You can change your plan at any time from your account settings with no hassle."
              }
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                <h3 className="font-bold text-gray-900 mb-3 text-base sm:text-lg flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{idx + 1}</span>
                  </div>
                  {faq.q}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed ml-8">
                  {faq.a}
                </p>
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

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
