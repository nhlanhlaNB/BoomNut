'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';
import { Zap, Check, AlertCircle, Home } from 'lucide-react';

export default function TestSubscriptionPage() {
  const { user } = useAuth();
  const { subscription, isActive, showPaymentButton, daysRemaining, createSubscription, clearSubscription, refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const handleTestSubscription = async () => {
    if (!user) {
      alert('Please sign in first');
      return;
    }

    if (!user.uid) {
      alert('❌ ERROR: User UID is missing! This is a login issue.');
      console.error('[TEST PAGE] ❌ user.uid is:', user.uid, 'user object:', user);
      return;
    }

    try {
      setLoading(true);
      console.log('[TEST PAGE] ⚠️ PRE-CREATE CHECK:');
      console.log('[TEST PAGE] user.uid:', user.uid);
      console.log('[TEST PAGE] user.email:', user.email);
      console.log('[TEST PAGE] typeof user.uid:', typeof user.uid);
      console.log('[TEST PAGE] typeof user.email:', typeof user.email);
      
      console.log('[TEST PAGE] Creating subscription with:', { userId: user.uid, email: user.email, plan: 'premium', subscriptionId: `TEST-${Date.now()}` });
      
      // Create the subscription
      await createSubscription('premium', `TEST-${Date.now()}`);
      console.log('[TEST PAGE] Subscription created, waiting 1 second before refresh...');
      
      // Wait a moment for database to fully save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the subscription status
      console.log('[TEST PAGE] Refreshing subscription status with userId:', user.uid);
      await refreshSubscription();
      
      console.log('[TEST PAGE] ✅ Subscription complete! Current status:', subscription);
      alert(`✅ Test subscription created!\n\nEmail: ${user.email}\nStatus: Active\nPlan: Premium\nDays: 30\n\nCheck the debug section to verify it was saved.`);
    } catch (error: any) {
      console.error('[TEST PAGE] ❌ Error:', error);
      alert(`❌ Error: ${error?.message || 'Failed to create subscription'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSubscription = async () => {
    try {
      setLoading(true);
      console.log('[TEST PAGE] Clearing subscription...');
      await clearSubscription?.();
      
      // Wait for database to sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh status
      console.log('[TEST PAGE] Refreshing status...');
      await refreshSubscription();
      
      alert('✅ Test data cleared!');
    } catch (error: any) {
      console.error('[TEST PAGE] Clear error:', error);
      alert(`❌ Error: ${error?.message || 'Failed to clear subscription'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDebugCheck = async () => {
    if (!user?.uid) {
      alert('User UID not available');
      return;
    }

    try {
      setLoading(true);
      const searchUid = user.uid;
      console.log('[DEBUG] Checking with userId:', searchUid);
      console.log('[DEBUG] Full URL:', `/api/subscription/debug?userId=${searchUid}`);
      
      const response = await fetch(`/api/subscription/debug?userId=${searchUid}`);
      const data = await response.json();
      
      console.log('[DEBUG] Full response:', data);
      setDebugData({
        ...data,
        searchUidUsed: searchUid
      });
    } catch (error: any) {
      console.error('[DEBUG] Error:', error);
      alert(`Debug error: ${error?.message || 'Failed to fetch debug data'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-900 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Tests</h1>
          </div>
          <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Logged In User</h2>
          {user ? (
            <div className="space-y-2">
              <p className="text-gray-700"><strong>Email:</strong> {user.email}</p>
              <p className="text-gray-700"><strong>UID:</strong> {user.uid?.substring(0, 10)}...</p>
            </div>
          ) : (
            <p className="text-gray-500">Not logged in</p>
          )}
        </div>

        {/* Current Subscription Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Subscription Status</h2>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isActive ? '✅ ACTIVE' : '❌ INACTIVE'}
                </span>
              </div>
              <p className="text-gray-700"><strong>Plan:</strong> {subscription.plan?.toUpperCase() || 'None'}</p>
              <p className="text-gray-700"><strong>Status:</strong> {subscription.status?.toUpperCase()}</p>
              <p className="text-gray-700"><strong>Days Remaining:</strong> {daysRemaining}</p>
              {subscription.endDate && <p className="text-gray-700"><strong>Expires:</strong> {new Date(subscription.endDate).toLocaleDateString()}</p>}
              {subscription.email && <p className="text-gray-700"><strong>Email:</strong> {subscription.email}</p>}
            </div>
          ) : (
            <p className="text-gray-500">No subscription found</p>
          )}
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Test Actions</h2>
          <div className="space-y-3">
            {/* Test Pay Button */}
            <button
              onClick={handleTestSubscription}
              disabled={loading || (isActive && !showPaymentButton)}
              className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {loading ? '⏳ Creating subscription...' : '🧪 Create Test Subscription'}
            </button>

            {/* Clear Data Button */}
            {isActive && !showPaymentButton && (
              <button
                onClick={handleClearSubscription}
                disabled={loading}
                className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {loading ? '⏳ Clearing...' : '🗑️ Clear Test Data'}
              </button>
            )}

            {/* Refresh Status Button */}
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  console.log('[TEST PAGE] Refreshing subscription status...');
                  await refreshSubscription();
                  console.log('[TEST PAGE] ✅ Status refreshed');
                  alert('✅ Status refreshed! Check your subscription above.');
                } catch (error: any) {
                  console.error('[TEST PAGE] Refresh error:', error);
                  alert(`❌ Error: ${error?.message || 'Failed to refresh status'}`);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {loading ? '⏳ Refreshing...' : '🔄 Refresh Status'}
            </button>

            {/* Go to Dashboard */}
            <Link
              href="/study"
              className="w-full py-3 rounded-lg font-bold text-white text-center transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 block"
            >
              📊 Go to Dashboard
            </Link>

            {/* Go to Pricing */}
            <Link
              href="/pricing"
              className="w-full py-3 rounded-lg font-bold text-white text-center transition-all bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black block"
            >
              💳 Go to Pricing
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8 rounded">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            How to Test
          </h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>✅ Click "Create Test Subscription" to add yourself to the database</li>
            <li>✅ Email and status will be stored in Realtime Database</li>
            <li>✅ Go to Dashboard to see pro features unlock</li>
            <li>✅ Click "Clear Test Data" to remove and start over</li>
            <li>✅ The subscription auto-expires after 30 days</li>
          </ul>
        </div>

        {/* Debug Section */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mt-8 rounded">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="font-bold text-yellow-900 flex items-center gap-2 hover:underline"
          >
            🔧 Troubleshooting & Debug
            <span>{showDebug ? '▼' : '▶'}</span>
          </button>

          {showDebug && (
            <div className="mt-4 space-y-4">
              <div className="bg-white rounded p-4 border border-yellow-200">
                <p className="font-bold text-gray-900 mb-2">Your Full UID (for copying):</p>
                <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all select-all">
                  {user?.uid || 'Not logged in'}
                </div>
              </div>

              <button
                onClick={handleDebugCheck}
                disabled={loading}
                className="w-full py-2 rounded-lg font-bold text-sm bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 transition-all"
              >
                {loading ? '⏳ Checking database...' : '🔍 Check Database for Your Subscriptions'}
              </button>

              {debugData && (
                <div className="bg-white rounded p-4 border border-yellow-200">
                  <p className="font-bold text-gray-900 mb-3">Database Results:</p>
                  <div className="text-sm space-y-2">
                    <p><strong>Searched for UID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{debugData.searchUidUsed || debugData.searchingForUserId}</code></p>
                    <p><strong>Total subscriptions in database:</strong> <span className="font-bold text-lg">{debugData.totalSubscriptions}</span></p>
                    <p><strong>Subscriptions matching YOUR UID:</strong> <span className="font-bold text-lg text-blue-600">{debugData.matchingSubscriptions}</span></p>
                    
                    {debugData.totalSubscriptions === 0 ? (
                      <div className="mt-3 p-2 bg-orange-100 rounded border border-orange-300">
                        <p className="font-bold text-orange-900">⚠️ Database is completely empty</p>
                        <p className="text-xs text-orange-800 mt-1">No subscriptions have been created yet. Try clicking "Create Test Subscription" first.</p>
                      </div>
                    ) : debugData.matchingSubscriptions && debugData.matchingSubscriptions > 0 ? (
                      <div className="mt-3 p-2 bg-green-100 rounded border border-green-300">
                        <p className="font-bold text-green-900 mb-2">✅ Your subscriptions found:</p>
                        <div className="text-xs font-mono space-y-3">
                          {debugData.userSubscriptions?.map((sub: any, idx: number) => (
                            <div key={idx} className="p-2 bg-white rounded border border-green-200 space-y-1">
                              <div><strong>ID:</strong> {sub.key}</div>
                              <div><strong>UID Stored:</strong> {sub.userId}</div>
                              <div><strong>Email:</strong> {sub.email}</div>
                              <div><strong>Plan:</strong> {sub.plan}</div>
                              <div><strong>Status:</strong> {sub.status}</div>
                              <div><strong>Created:</strong> {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'N/A'}</div>
                              <div><strong>Expires:</strong> {sub.endDate ? new Date(sub.endDate).toLocaleString() : 'N/A'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-2 bg-red-100 rounded border border-red-300">
                        <p className="font-bold text-red-900">❌ No subscriptions found for your UID</p>
                        <p className="text-xs text-red-800 mt-2">
                          <strong>This means subscriptions were created but with a DIFFERENT UID.</strong><br/>
                          This usually indicates a login/auth issue. Check browser console logs for the actual UID being sent.
                        </p>
                      </div>
                    )}

                    {debugData.totalSubscriptions > 0 && debugData.allSubscriptions && (
                      <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                        <p className="font-bold text-blue-900 mb-2">All subscriptions in database ({debugData.totalSubscriptions}):</p>
                        <div className="text-xs space-y-1 max-h-40 overflow-y-auto font-mono">
                          {debugData.allSubscriptions?.map((sub: any, idx: number) => (
                            <div key={idx} className="text-blue-800 bg-white p-1 rounded border border-blue-200">
                              <div><strong>ID:</strong> {sub.key}</div>
                              <div><strong>UID:</strong> <span className={sub.userId === (debugData.searchUidUsed || debugData.searchingForUserId) ? 'text-green-600 font-bold' : 'text-red-600'}>{sub.userId}</span></div>
                              <div><strong>Plan:</strong> {sub.plan} | <strong>Status:</strong> {sub.status}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
