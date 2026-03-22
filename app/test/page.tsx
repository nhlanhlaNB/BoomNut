'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ServiceStatus {
  service: string;
  configured: boolean;
  required: boolean;
  variables: Record<string, boolean>;
}

interface ConfigCheckResponse {
  status: string;
  summary: {
    requiredServices: number;
    requiredConfigured: number;
    optionalServices: number;
    optionalConfigured: number;
    allRequiredConfigured: boolean;
  };
  services: ServiceStatus[];
  missingRequired: string[];
  recommendations: string[];
}

export default function TestPage() {
  const [configStatus, setConfigStatus] = useState<ConfigCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchConfigStatus();
  }, []);

  const fetchConfigStatus = async () => {
    try {
      const response = await fetch('/api/config-check');
      const data = await response.json();
      setConfigStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch config status:', error);
      setLoading(false);
    }
  };

  const testFeature = async (name: string, endpoint: string, payload: any) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const success = response.ok;
      setTestResults(prev => ({ ...prev, [name]: success }));
      return success;
    } catch (error) {
      console.error(`Test failed for ${name}:`, error);
      setTestResults(prev => ({ ...prev, [name]: false }));
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading configuration status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">System Configuration Check</h1>
          <p className="text-gray-300">Verify all AI services and features are properly configured</p>
        </div>

        {/* Status Overview */}
        {configStatus && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className={`p-6 rounded-lg ${configStatus.status === 'healthy' ? 'bg-green-900 border-2 border-green-500' : 'bg-yellow-900 border-2 border-yellow-500'}`}>
                <h2 className="text-2xl font-bold text-white mb-2">Overall Status</h2>
                <p className={`text-lg font-semibold ${configStatus.status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {configStatus.status === 'healthy' ? '✅ Healthy' : '⚠️ Incomplete'}
                </p>
              </div>

              <div className="bg-blue-900 border-2 border-blue-500 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Services Status</h2>
                <p className="text-white">
                  <span className="text-green-400 font-bold">{configStatus.summary.requiredConfigured}</span>
                  <span className="text-gray-300">/{configStatus.summary.requiredServices}</span>
                  <span className="text-gray-400 ml-2">required configured</span>
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8 border-l-4 border-blue-500">
              <h2 className="text-xl font-bold text-white mb-4">Status & Recommendations</h2>
              <div className="space-y-2">
                {configStatus.recommendations.map((rec, idx) => (
                  <p key={idx} className="text-gray-300 flex items-start">
                    <span className="mr-3">{rec.startsWith('✅') ? '✅' : rec.startsWith('❌') ? '❌' : 'ℹ️'}</span>
                    <span>{rec.replace(/^[✅❌ℹ️]\s/, '')}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Services Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-8 border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-white font-semibold">Service</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Variables Configured</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configStatus.services.map((service, idx) => {
                      const configuredCount = Object.values(service.variables).filter(Boolean).length;
                      const totalCount = Object.keys(service.variables).length;
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-750' : 'bg-gray-800'}>
                          <td className="px-6 py-4 text-white font-medium">{service.service}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              service.configured ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                            }`}>
                              {service.configured ? '✅ Configured' : '❌ Missing'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            <span className={`px-3 py-1 rounded text-sm ${
                              service.required ? 'bg-red-800 text-red-200' : 'bg-blue-800 text-blue-200'
                            }`}>
                              {service.required ? 'Required' : 'Optional'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm">
                            {configuredCount}/{totalCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feature Tests */}
            {configStatus.summary.allRequiredConfigured && (
              <div className="bg-gray-800 rounded-lg p-6 border border-green-700">
                <h2 className="text-xl font-bold text-white mb-4">Feature Tests</h2>
                <p className="text-gray-400 mb-6">All required services are configured. You can test individual features here:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/study" className="block p-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg hover:from-purple-500 hover:to-purple-600 transition">
                    <h3 className="text-white font-bold mb-1">📚 Study Dashboard</h3>
                    <p className="text-purple-200 text-sm">Test flashcards, quizzes, guides, summaries</p>
                  </Link>
                  
                  <Link href="/tutor" className="block p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition">
                    <h3 className="text-white font-bold mb-1">🤖 AI Tutor Chat</h3>
                    <p className="text-blue-200 text-sm">Test AI conversation and tutoring</p>
                  </Link>

                  <Link href="/explainers" className="block p-4 bg-gradient-to-br from-green-600 to-green-700 rounded-lg hover:from-green-500 hover:to-green-600 transition">
                    <h3 className="text-white font-bold mb-1">💡 Explainers</h3>
                    <p className="text-green-200 text-sm">Test concept explanations</p>
                  </Link>

                  <Link href="/visual-analysis" className="block p-4 bg-gradient-to-br from-pink-600 to-pink-700 rounded-lg hover:from-pink-500 hover:to-pink-600 transition">
                    <h3 className="text-white font-bold mb-1">👁️ Visual Analysis</h3>
                    <p className="text-pink-200 text-sm">Test image/diagram analysis</p>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
