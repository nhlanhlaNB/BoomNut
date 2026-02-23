'use client';

import { useState } from 'react';
import { FileText, Send, CheckCircle, XCircle, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/hooks/useAuth';

interface GradingResult {
  grade: string;
  score: number;
  totalPoints: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  grammarIssues: number;
  clarity: number;
  coherence: number;
  evidence: number;
  suggestions: string[];
}

export default function EssayGradingPage() {
  const { user } = useAuth();
  const [essay, setEssay] = useState('');
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState('English');
  const [gradeLevel, setGradeLevel] = useState('High School');
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const handleEssayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setEssay(text);
    setWordCount(text.trim().split(/\s+/).filter(w => w).length);
  };

  const gradeEssay = async () => {
    if (!essay.trim()) {
      alert('Please write or paste your essay first');
      return;
    }

    setIsGrading(true);
    try {
      const response = await fetch('/api/essay-grading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay,
          prompt: prompt || 'General essay evaluation',
          subject,
          gradeLevel
        })
      });

      if (!response.ok) throw new Error('Grading failed');

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to grade essay. Please try again.');
    } finally {
      setIsGrading(false);
    }
  };

  const resetForm = () => {
    setEssay('');
    setPrompt('');
    setResult(null);
    setWordCount(0);
  };

  return (
    <main className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-700 mb-4">
            <FileText className="w-4 h-4" />
            <span>AI-Powered Essay Analysis</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-4">
            Essay <span className="text-gray-900 font-bold">Grading</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant, detailed feedback on your essays with AI-powered grading
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Essay Input */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Your Essay
              </h2>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="essay-subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    id="essay-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    aria-label="Select essay subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>English</option>
                    <option>History</option>
                    <option>Science</option>
                    <option>Literature</option>
                    <option>Social Studies</option>
                    <option>Philosophy</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="essay-grade-level" className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Level
                  </label>
                  <select
                    id="essay-grade-level"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    aria-label="Select grade level"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Middle School</option>
                    <option>High School</option>
                    <option>College</option>
                    <option>Graduate</option>
                  </select>
                </div>
              </div>

              {/* Essay Prompt */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Essay Prompt (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter the essay question or prompt here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Essay Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Essay Text
                </label>
                <textarea
                  value={essay}
                  onChange={handleEssayChange}
                  placeholder="Write or paste your essay here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  rows={16}
                />
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <span>{wordCount} words</span>
                  <span>{essay.length} characters</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={gradeEssay}
                  disabled={isGrading || !essay.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGrading ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      Grading...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Grade My Essay
                    </>
                  )}
                </button>
                
                {result && (
                  <button
                    onClick={resetForm}
                    className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {!result ? (
              <div className="bg-white rounded-3xl shadow-xl p-8 h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <FileText className="w-24 h-24 mx-auto mb-4" />
                  <p className="text-lg font-medium">Submit your essay to see the grading results</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 space-y-6">
                {/* Grade Display */}
                <div className="text-center pb-6 border-b border-gray-200">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-300 text-gray-700 mb-4">
                    <div className="text-center">
                      <div className="text-5xl font-black">{result.grade}</div>
                      <div className="text-sm font-medium">{result.score}/{result.totalPoints}</div>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600">Overall Grade</p>
                </div>

                {/* Rubric Scores */}
                <div className="grid grid-cols-2 gap-4">
                  <ScoreCard label="Clarity" score={result.clarity} />
                  <ScoreCard label="Coherence" score={result.coherence} />
                  <ScoreCard label="Evidence" score={result.evidence} />
                  <ScoreCard label="Grammar" score={100 - result.grammarIssues * 10} />
                </div>

                {/* Strengths */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {result.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {result.improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-orange-600 mt-1">→</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Detailed Feedback */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Detailed Feedback</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown>{result.detailedFeedback}</ReactMarkdown>
                  </div>
                </div>

                {/* Suggestions */}
                {result.suggestions && result.suggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Suggestions for Next Time
                    </h3>
                    <ul className="space-y-2">
                      {result.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="text-purple-600 mt-1">💡</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-lg font-bold text-gray-900" aria-live="polite">{score}%</span>
      </div>
      {/* eslint-disable-next-line jsx-a11y/aria-proptypes */}
      <div 
        className="w-full bg-gray-200 rounded-full h-2 overflow-hidden relative"
        role="progressbar" 
        aria-valuenow={score} 
        aria-valuemin={0} 
        aria-valuemax={100} 
        aria-label={`${label} score`}
      >
        <div
          className={`absolute inset-0 h-full rounded-full bg-gradient-to-r ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
