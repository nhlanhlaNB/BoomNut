'use client';

import { useState } from 'react';
import { BookOpen, Search, Lightbulb, ArrowLeft, Sparkles, Video, Image as ImageIcon, List } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface Explanation {
  title: string;
  simpleExplanation: string;
  detailedExplanation: string;
  examples: string[];
  analogies: string[];
  keyPoints: string[];
  visualSuggestions: string[];
  commonMistakes: string[];
  relatedConcepts: string[];
}

export default function ExplainersPage() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('General');
  const [complexity, setComplexity] = useState('simple');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [includeVisuals, setIncludeVisuals] = useState(true);
  const [includeAnalogies, setIncludeAnalogies] = useState(true);

  const popularTopics = [
    { emoji: '🧬', topic: 'Photosynthesis', subject: 'Biology' },
    { emoji: '⚛️', topic: 'Quantum Physics', subject: 'Physics' },
    { emoji: '📐', topic: 'Pythagorean Theorem', subject: 'Mathematics' },
    { emoji: '🌍', topic: 'Climate Change', subject: 'Environmental Science' },
    { emoji: '💻', topic: 'Machine Learning', subject: 'Computer Science' },
    { emoji: '📜', topic: 'French Revolution', subject: 'History' },
  ];

  const explainTopic = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic to explain');
      return;
    }

    setIsExplaining(true);
    try {
      const response = await fetch('/api/explainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject,
          complexity,
          includeVisuals,
          includeAnalogies
        })
      });

      if (!response.ok) throw new Error('Explanation failed');

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate explanation. Please try again.');
    } finally {
      setIsExplaining(false);
    }
  };

  const loadPopularTopic = (popularTopic: string, popularSubject: string) => {
    setTopic(popularTopic);
    setSubject(popularSubject);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-teal-100 rounded-full text-sm font-bold text-green-700 mb-4">
            <Lightbulb className="w-4 h-4" />
            <span>Understand Any Concept</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-4">
            Concept <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Explainers</span> 💡
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get clear, simple explanations for complex topics with examples, analogies, and visual aids
          </p>
        </div>

        {/* Popular Topics */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Popular Topics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularTopics.map((item, i) => (
              <button
                key={i}
                onClick={() => loadPopularTopic(item.topic, item.subject)}
                className="p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition text-center border-2 border-transparent hover:border-green-300"
              >
                <div className="text-4xl mb-2">{item.emoji}</div>
                <div className="text-sm font-bold text-gray-900">{item.topic}</div>
                <div className="text-xs text-gray-500">{item.subject}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Input */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Search className="w-6 h-6 text-green-600" />
                What to Explain?
              </h2>

              {/* Topic Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic or Concept
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && explainTopic()}
                  placeholder="e.g., Photosynthesis, Quantum Entanglement..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Subject */}
              <div className="mb-6">
                <label htmlFor="explainer-subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  id="explainer-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  aria-label="Select subject"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option>General</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                  <option>Computer Science</option>
                  <option>History</option>
                  <option>Literature</option>
                  <option>Economics</option>
                  <option>Psychology</option>
                </select>
              </div>

              {/* Complexity */}
              <div className="mb-6">
                <label htmlFor="explainer-complexity" className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation Level
                </label>
                <select
                  id="explainer-complexity"
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                  aria-label="Select explanation complexity level"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="simple">Simple (ELI5)</option>
                  <option value="medium">Medium (High School)</option>
                  <option value="detailed">Detailed (College)</option>
                  <option value="expert">Expert (Graduate)</option>
                </select>
              </div>

              {/* Options */}
              <div className="mb-6 space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeVisuals}
                    onChange={(e) => setIncludeVisuals(e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Include visual suggestions</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeAnalogies}
                    onChange={(e) => setIncludeAnalogies(e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Include analogies</span>
                </label>
              </div>

              {/* Explain Button */}
              <button
                onClick={explainTopic}
                disabled={isExplaining || !topic.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExplaining ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Generating Explanation...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-5 h-5" />
                    Explain It!
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Explanation */}
          <div className="lg:col-span-2">
            {!explanation ? (
              <div className="bg-white rounded-3xl shadow-xl p-8 h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <BookOpen className="w-24 h-24 mx-auto mb-4" />
                  <p className="text-lg font-medium">Enter a topic to get started</p>
                  <p className="text-sm mt-2">Try clicking on a popular topic above</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 space-y-8">
                {/* Title */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">{explanation.title}</h2>
                  <p className="text-sm text-gray-500">Subject: {subject} • Level: {complexity}</p>
                </div>

                {/* Simple Explanation */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    Quick Summary
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed">{explanation.simpleExplanation}</p>
                </div>

                {/* Detailed Explanation */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Detailed Explanation
                  </h3>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <ReactMarkdown>{explanation.detailedExplanation}</ReactMarkdown>
                  </div>
                </div>

                {/* Key Points */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <List className="w-5 h-5 text-purple-600" />
                    Key Points
                  </h3>
                  <ul className="space-y-2">
                    {explanation.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <span className="text-purple-600 font-bold mt-1">•</span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Examples */}
                {explanation.examples.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      Examples
                    </h3>
                    <div className="space-y-3">
                      {explanation.examples.map((example, i) => (
                        <div key={i} className="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                          <p className="text-gray-700">{example}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analogies */}
                {includeAnalogies && explanation.analogies.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Video className="w-5 h-5 text-orange-600" />
                      Analogies
                    </h3>
                    <div className="space-y-3">
                      {explanation.analogies.map((analogy, i) => (
                        <div key={i} className="p-4 bg-orange-50 rounded-xl">
                          <p className="text-gray-700 italic">{analogy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Suggestions */}
                {includeVisuals && explanation.visualSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      Visual Aids to Look For
                    </h3>
                    <ul className="space-y-2">
                      {explanation.visualSuggestions.map((visual, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <span className="text-blue-600 mt-1">🎨</span>
                          <span className="text-gray-700">{visual}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Common Mistakes */}
                {explanation.commonMistakes.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      ⚠️ Common Mistakes to Avoid
                    </h3>
                    <ul className="space-y-2">
                      {explanation.commonMistakes.map((mistake, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                          <span className="text-red-600 font-bold mt-1">×</span>
                          <span className="text-gray-700">{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Concepts */}
                {explanation.relatedConcepts.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Related Concepts to Explore</h3>
                    <div className="flex flex-wrap gap-2">
                      {explanation.relatedConcepts.map((concept, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setTopic(concept);
                            explainTopic();
                          }}
                          className="px-4 py-2 bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-green-300 rounded-lg text-sm font-medium text-gray-700 transition"
                        >
                          {concept}
                        </button>
                      ))}
                    </div>
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
