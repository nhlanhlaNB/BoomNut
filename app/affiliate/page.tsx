'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Copy, Check, Users, BarChart3, Gift, ArrowRight } from 'lucide-react';

interface AffiliateStats {
  referralCode: string | null;
  totalReferrals: number;
  activeReferrals: number;
  referrals: Array<{
    id: string;
    email: string;
    referredAt: string;
    status: string;
  }>;
  createdAt?: string;
}

export default function AffiliatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
      return;
    }

    if (user?.uid) {
      fetchAffiliateData();
    }
  }, [user, loading, router]);

  const fetchAffiliateData = async () => {
    try {
      setIsFetching(true);
      const response = await fetch(`/api/affiliates/stats?userId=${user?.uid}`);
      const data = await response.json();
      setStats(data);

      if (data.referralCode) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        setShareLink(`${baseUrl}/signup?ref=${data.referralCode}`);
      }
    } catch (err: any) {
      console.error('Error fetching affiliate data:', err);
      setError('Failed to load affiliate data');
    } finally {
      setIsFetching(false);
    }
  };

  const generateReferralCode = async () => {
    if (!user?.uid) return;

    try {
      setIsGenerating(true);
      setError('');
      const response = await fetch('/api/affiliates/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();
      if (response.ok) {
        setStats(prev => prev ? { ...prev, referralCode: data.code } : null);
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        setShareLink(`${baseUrl}/signup?ref=${data.code}`);
      } else {
        setError(data.error || 'Failed to generate referral code');
      }
    } catch (err: any) {
      console.error('Error generating referral code:', err);
      setError('Failed to generate referral code');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading your affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/study" 
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-6 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Affiliate Program</h1>
          <p className="text-xl text-gray-600">Earn rewards by referring friends to BoomNut</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Referral Code Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Referral Code</h2>
            </div>

            {stats?.referralCode ? (
              <div>
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
                    <p className="text-sm text-gray-600 mb-2">Share this code</p>
                    <p className="text-4xl font-bold text-orange-600 font-mono tracking-wider">
                      {stats.referralCode}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(stats.referralCode!)}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy Code
                    </>
                  )}
                </button>

                {shareLink && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">Share this link</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-600"
                      />
                      <button
                        onClick={() => copyToClipboard(shareLink)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-6">
                  You don't have a referral code yet. Generate one to start earning rewards!
                </p>
                <button
                  onClick={generateReferralCode}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5" />
                      Generate Referral Code
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Referrals */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Total Referrals</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {stats?.totalReferrals || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">People you've referred</p>
            </div>

            {/* Active Referrals */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Active</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {stats?.activeReferrals || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">Active members</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Share Your Code</h3>
              <p className="text-gray-600 text-sm">
                Share your unique referral code with friends and on social media
              </p>
            </div>

            <div className="flex flex-col">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Friends Sign Up</h3>
              <p className="text-gray-600 text-sm">
                They enter your code during registration
              </p>
            </div>

            <div className="flex flex-col">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Earn Rewards</h3>
              <p className="text-gray-600 text-sm">
                Get bonuses for each successful referral
              </p>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        {stats && stats.referrals && stats.referrals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Referrals</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.referrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{referral.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          {referral.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {new Date(referral.referredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats && stats.referrals && stats.referrals.length === 0 && stats.referralCode && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-dashed border-orange-200 p-12 text-center">
            <Users className="w-16 h-16 text-orange-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Referrals Yet</h3>
            <p className="text-gray-600 mb-6">
              Start sharing your referral code to see your referrals here
            </p>
            <button
              onClick={() => copyToClipboard(shareLink || stats.referralCode)}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <Copy className="w-5 h-5" />
              Copy & Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
