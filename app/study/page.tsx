'use client';

import { useState } from 'react';
import { Brain, FileText, Zap, BookOpen, GraduationCap, Upload, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';
import FlashcardViewer from '@/components/FlashcardViewer';
import QuizViewer from '@/components/QuizViewer';
import ReactMarkdown from 'react-markdown';
import AuthButton from '@/components/AuthButton';
import PaywallModal from '@/components/PaywallModal';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';

type StudyMode = 'upload' | 'flashcards' | 'quiz' | 'guide' | 'summary' | null;

export default function StudyPage() {
  const { user } = useAuth();
  const { isPro, canAccessFeature } = useSubscription();
  const [studyMode, setStudyMode] = useState<StudyMode>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quiz, setQuiz] = useState<any>(null);
  const [studyGuide, setStudyGuide] = useState('');
  const [summary, setSummary] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState({ feature: '', name: '', plan: 'pro' as 'pro' | 'premium' });
  const [studySetsUsed, setStudySetsUsed] = useState(0);
  const FREE_STUDY_SETS_LIMIT = 2;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setContent(data.content || '');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  const generateFlashcards = async () => {
    if (!content) {
      alert('Please upload a file first');
      return;
    }

    // Check free tier limits
    if (!isPro && studySetsUsed >= FREE_STUDY_SETS_LIMIT) {
      setPaywallFeature({ feature: 'unlimited-study-sets', name: 'Unlimited Flashcards', plan: 'pro' });
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    try {
      // Free users get max 10 cards, Pro gets 15
      const cardCount = isPro ? 15 : 10;
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, count: cardCount }),
      });

      if (!response.ok) throw new Error('Failed to generate flashcards');

      const data = await response.json();
      setFlashcards(data.flashcards || []);
      setStudyMode('flashcards');
      if (!isPro) setStudySetsUsed(prev => prev + 1);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!content) {
      alert('Please upload a file first');
      return;
    }

    // Check free tier limits
    if (!isPro && studySetsUsed >= FREE_STUDY_SETS_LIMIT) {
      setPaywallFeature({ feature: 'unlimited-tests', name: 'Unlimited Quizzes', plan: 'pro' });
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    try {
      // Free users get 5 questions, Pro gets 10
      const questionCount = isPro ? 10 : 5;
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, questionCount, difficulty: 'medium' }),
      });

      if (!response.ok) throw new Error('Failed to generate quiz');

      const data = await response.json();
      setQuiz(data.quiz);
      setStudyMode('quiz');
      if (!isPro) setStudySetsUsed(prev => prev + 1);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const generateStudyGuide = async () => {
    if (!content) {
      alert('Please upload a file first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/study-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format: 'comprehensive' }),
      });

      if (!response.ok) throw new Error('Failed to generate study guide');

      const data = await response.json();
      setStudyGuide(data.studyGuide);
      setStudyMode('guide');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate study guide');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!content) {
      alert('Please upload a file first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, length: 'medium' }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      setSummary(data.summary);
      setStudyMode('summary');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  };

  const resetMode = () => {
    setStudyMode(null);
  };

  // Render different views based on study mode
  if (studyMode === 'flashcards' && flashcards.length > 0) {
    return <FlashcardViewer flashcards={flashcards} onClose={resetMode} />;
  }

  if (studyMode === 'quiz' && quiz) {
    return <QuizViewer quiz={quiz} onClose={resetMode} />;
  }

  if (studyMode === 'guide' && studyGuide) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={resetMode}
            className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to Study Modes
          </button>
          <div className="bg-gray-50 rounded-lg shadow-md p-8 border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">📚 Study Guide</h1>
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{studyGuide}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (studyMode === 'summary' && summary) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={resetMode}
            className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to Study Modes
          </button>
          <div className="bg-gray-50 rounded-lg shadow-md p-8 border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">📝 Summary</h1>
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-white">
      {showPaywall && (
        <PaywallModal
          feature={paywallFeature.feature}
          featureName={paywallFeature.name}
          requiredPlan={paywallFeature.plan}
        />
      )}
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Study Dashboard
            </h1>
            <p className="text-gray-600">
              Upload your materials and choose how you want to study
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <AuthButton />
            <Link
              href="/tutor"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium border-b-2 border-transparent hover:border-gray-400 transition"
            >
              AI Tutor
            </Link>
            <Link
              href="/study-rooms"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium border-b-2 border-transparent hover:border-gray-400 transition"
            >
              Study Rooms
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium border-b-2 border-transparent hover:border-gray-400 transition"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-gray-50 rounded-lg shadow-md p-8 mb-8 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Upload className="w-6 h-6 text-gray-700" />
              <h2 className="text-2xl font-bold text-gray-900">Upload Study Material</h2>
            </div>
            {!isPro && user && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                <Lock className="w-4 h-4" />
                {studySetsUsed}/{FREE_STUDY_SETS_LIMIT} free study sets used this week
              </div>
            )}
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              id="file-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {file ? (
                <>
                  <FileText className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-2">Click to change file</p>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-800">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    PDF, DOC, DOCX, or TXT files
                  </p>
                </>
              )}
            </label>
          </div>

          {isLoading && (
            <div className="mt-4 text-center text-blue-600">
              Processing your file...
            </div>
          )}
        </div>

        {/* Study Modes */}
        {content && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Flashcards */}
            <button
              onClick={generateFlashcards}
              disabled={isLoading || (!isPro && studySetsUsed >= FREE_STUDY_SETS_LIMIT)}
              className="relative bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            >
              {!isPro && studySetsUsed >= FREE_STUDY_SETS_LIMIT && (
                <div className="absolute top-3 right-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Flashcards</h3>
              <p className="text-gray-600 text-sm">
                {isPro ? 'Unlimited AI-powered flashcards' : 'Up to 10 flashcards (2 sets/week free)'}
              </p>
            </button>

            {/* Quiz */}
            <button
              onClick={generateQuiz}
              disabled={isLoading || (!isPro && studySetsUsed >= FREE_STUDY_SETS_LIMIT)}
              className="relative bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            >
              {!isPro && studySetsUsed >= FREE_STUDY_SETS_LIMIT && (
                <div className="absolute top-3 right-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quiz</h3>
              <p className="text-gray-600 text-sm">
                {isPro ? '10 AI-generated questions' : '5 questions (2 quizzes/week free)'}
              </p>
            </button>

            {/* Study Guide */}
            <button
              onClick={generateStudyGuide}
              disabled={isLoading}
              className="relative bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Study Guide</h3>
              <p className="text-gray-600 text-sm">
                {isPro ? 'Comprehensive AI study guide' : 'Available on all plans'}
              </p>
            </button>

            {/* Summary */}
            <button
              onClick={generateSummary}
              disabled={isLoading}
              className="relative bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Summarize</h3>
              <p className="text-gray-600 text-sm">
                {isPro ? 'Detailed AI summaries' : 'Available on all plans'}
              </p>
            </button>
          </div>
        )}

        {/* Free tier info banner */}
        {!isPro && user && content && (
          <div className="mt-6 bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Free Plan Limits
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  You're using the free plan with limited access. Upgrade to unlock unlimited study sets, more flashcards, and advanced features!
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>✓ 2 study sets per week (flashcards/quizzes)</li>
                  <li>✓ 10 flashcards per set (vs 15 on Pro)</li>
                  <li>✓ 5 quiz questions (vs 10 on Pro)</li>
                  <li>✓ Unlimited summaries & study guides</li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold whitespace-nowrap"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* AI Tutor & Study Rooms Links */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">AI Tutor</h3>
                  <p className="text-blue-100">
                    Chat with your personal AI tutor for explanations
                  </p>
                </div>
              </div>
              <Link
                href="/tutor"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Start Chat
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">Study Rooms</h3>
                  <p className="text-green-100">
                    Learn together with friends and AI
                  </p>
                </div>
              </div>
              <Link
                href="/study-rooms"
                className="px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
              >
                Join Room
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
