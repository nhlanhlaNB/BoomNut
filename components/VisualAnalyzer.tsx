'use client';

import { useState, useEffect } from 'react';
import { Camera, Upload, Loader, Image as ImageIcon, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import PaywallModal from './PaywallModal';

export default function VisualAnalyzer() {
  const { user } = useAuth();
  const { isActive } = useSubscription();
  const [image, setImage] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [explanation, setExplanation] = useState('');
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const FREE_LIMIT = 2;

  // Fetch usage on mount
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user || isActive) return;

      try {
        const response = await fetch(`/api/usage/track?userId=${user.uid}&appName=visual-analysis`);
        if (response.ok) {
          const data = await response.json();
          setUsageCount(data.messageCount || 0);
        }
      } catch (error) {
        console.error('Error fetching usage:', error);
      }
    };

    fetchUsage();
  }, [user, isActive]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    // Check free tier limit
    if (!isActive && usageCount >= FREE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);

    // Track usage for free tier
    if (!isActive && user) {
      try {
        const trackResponse = await fetch('/api/usage/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            appName: 'visual-analysis'
          })
        });
        
        if (trackResponse.ok) {
          const trackData = await trackResponse.json();
          setUsageCount(trackData.messageCount);
        }
      } catch (error) {
        console.error('Error tracking usage:', error);
      }
    }

    try {
      const response = await fetch('/api/visual-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          question,
          subject: 'General',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setExplanation(data.explanation);
        setFollowUpQuestions(data.followUpQuestions || []);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {showPaywall && (
        <PaywallModal
          feature="visual-analysis"
          featureName="Unlimited Visual Analysis"
          requiredPlan="pro"
        />
      )}

      {/* Usage Indicator */}
      {!isActive && user && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
          usageCount >= FREE_LIMIT
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" style={{ color: usageCount >= FREE_LIMIT ? '#dc2626' : '#2563eb' }} />
            <span className={`text-sm font-medium ${
              usageCount >= FREE_LIMIT ? 'text-red-800' : 'text-blue-800'
            }`}>
              {usageCount >= FREE_LIMIT ? (
                <>
                  ⚠️ You've used your {FREE_LIMIT} free analyses today.
                  <a
                    href="/pricing"
                    className="ml-2 font-bold underline text-red-700 hover:text-red-800"
                  >
                    Subscribe to continue →
                  </a>
                </>
              ) : (
                <>
                  Free Plan: {usageCount}/{FREE_LIMIT} analyses used today
                  <a
                    href="/pricing"
                    className="ml-2 text-blue-600 hover:text-blue-700 font-medium underline"
                  >
                    Upgrade
                  </a>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Camera className="w-6 h-6 text-indigo-600" />
          Spark.E Visual Analysis
        </h2>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Upload Image or Diagram</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
            {image ? (
              <div className="space-y-4">
                <img
                  src={image}
                  alt="Uploaded"
                  className="max-h-96 mx-auto rounded-lg shadow"
                />
                <button
                  onClick={() => setImage(null)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">Supports: JPG, PNG, diagrams, charts</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Question Input */}
        {image && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Ask a question about this image (optional)
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="e.g., What does this diagram show? Explain the labeled parts..."
              />
            </div>

            <button
              onClick={analyzeImage}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  Analyze Image
                </>
              )}
            </button>
          </>
        )}

        {/* Results */}
        {explanation && (
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Analysis</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{explanation}</p>
              </div>
            </div>

            {followUpQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Follow-up Questions</h3>
                <ul className="space-y-2">
                  {followUpQuestions.map((q, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                      onClick={() => setQuestion(q)}
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
