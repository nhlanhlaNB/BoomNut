'use client';

import { Crown, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type PaywallProps = {
  feature: string;
  featureName: string;
  requiredPlan: 'pro' | 'premium';
};

export default function PaywallModal({ feature, featureName, requiredPlan }: PaywallProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
        <div className={`w-20 h-20 bg-gradient-to-br ${
          requiredPlan === 'premium' 
            ? 'from-yellow-500 to-orange-600' 
            : 'from-blue-500 to-purple-600'
        } rounded-2xl flex items-center justify-center mx-auto mb-6`}>
          {requiredPlan === 'premium' ? (
            <Crown className="w-10 h-10 text-white" />
          ) : (
            <Zap className="w-10 h-10 text-white" />
          )}
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
          Upgrade to {requiredPlan === 'premium' ? 'Premium' : 'Pro'}
        </h2>

        <p className="text-center text-gray-600 mb-6">
          <span className="font-semibold">{featureName}</span> is available on our{' '}
          <span className="font-semibold capitalize">{requiredPlan}</span> plan
        </p>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            {requiredPlan === 'premium' ? 'Premium' : 'Pro'} includes:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {requiredPlan === 'premium' ? (
              <>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  Live Lecture Assistant with real-time notes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  Handwritten notes scanning & digitization
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  Advanced OCR for complex equations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  Everything in Pro plan
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  Unlimited chat with AI tutor
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  Unlimited study sets & flashcards
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  Video & audio uploads
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  Photo upload support
                </li>
              </>
            )}
          </ul>
        </div>

        <Link
          href="/pricing"
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
            requiredPlan === 'premium'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:opacity-90'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'
          } text-white shadow-lg`}
        >
          View Pricing
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link
          href="/"
          className="block text-center mt-4 text-gray-600 hover:text-gray-800 text-sm"
        >
          Maybe later
        </Link>
      </div>
    </div>
  );
}
