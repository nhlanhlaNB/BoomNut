'use client';

import { useState } from 'react';
import {
  Brain, FileText, Zap, BookOpen, GraduationCap, Upload, Sparkles, Lock,
  Mic, Video, Gamepad2, PenTool, Lightbulb, Users, TrendingUp, Target,
  Home, Filter, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';

type AppCategory = 'all' | 'learning' | 'tools' | 'premium';

interface AppCard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: 'learning' | 'tools';
  isPro?: boolean;
  color: string;
  gradient: string;
}

export default function StudyPage() {
  const { user } = useAuth();
  const { isActive, subscription, loading } = useSubscription();
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('all');

  const apps: AppCard[] = [
    {
      id: 'study-dashboard',
      name: 'Study Dashboard',
      description: 'Flashcards, Quizzes & More',
      icon: <BookOpen className="w-12 h-12" />,
      href: '/study',
      category: 'learning',
      color: 'blue',
      gradient: 'from-blue-100 to-blue-200',
    },
    {
      id: 'tutor',
      name: 'AI Tutor Chat',
      description: '24/7 Personal AI Tutor',
      icon: <Brain className="w-12 h-12" />,
      href: '/tutor',
      category: 'learning',
      color: 'purple',
      gradient: 'from-purple-100 to-purple-200',
    },
    {
      id: 'voice-tutor',
      name: 'Voice Tutor',
      description: 'Speak & Learn',
      icon: <Mic className="w-12 h-12" />,
      href: '/voice-tutor',
      category: 'tools',
      color: 'indigo',
      gradient: 'from-indigo-100 to-indigo-200',
      isPro: true,
    },
    {
      id: 'voice-tutor-webrtc',
      name: 'Voice Tutor WebRTC',
      description: 'Real-time Voice Learning',
      icon: <Video className="w-12 h-12" />,
      href: '/voice-tutor-webrtc',
      category: 'tools',
      color: 'red',
      gradient: 'from-red-100 to-red-200',
      isPro: true,
    },
    {
      id: 'live-lecture',
      name: 'Live Lecture',
      description: 'Record & Transcribe',
      icon: <GraduationCap className="w-12 h-12" />,
      href: '/live-lecture',
      category: 'tools',
      color: 'cyan',
      gradient: 'from-cyan-100 to-cyan-200',
      isPro: true,
    },
    {
      id: 'arcade',
      name: 'Study Arcade',
      description: 'Gamified Learning',
      icon: <Gamepad2 className="w-12 h-12" />,
      href: '/arcade',
      category: 'learning',
      color: 'lime',
      gradient: 'from-lime-100 to-lime-200',
      isPro: true,
    },
    {
      id: 'essay-grading',
      name: 'Essay Grading',
      description: 'AI Essay Feedback',
      icon: <PenTool className="w-12 h-12" />,
      href: '/essay-grading',
      category: 'tools',
      color: 'rose',
      gradient: 'from-rose-100 to-rose-200',
      isPro: true,
    },
    {
      id: 'visual-analysis',
      name: 'Visual Analysis',
      description: 'Image & Diagram Analysis',
      icon: <Lightbulb className="w-12 h-12" />,
      href: '/visual-analysis',
      category: 'tools',
      color: 'violet',
      gradient: 'from-violet-100 to-violet-200',
      isPro: true,
    },
    {
      id: 'explainers',
      name: 'Explainers',
      description: 'Concept Explanations',
      icon: <Sparkles className="w-12 h-12" />,
      href: '/explainers',
      category: 'learning',
      color: 'teal',
      gradient: 'from-teal-100 to-teal-200',
    },
  ];

  // Filter apps based on selected category
  const filteredApps = apps.filter(app => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'premium') return app.isPro;
    return app.category === selectedCategory;
  });

  const categories = [
    { id: 'all', label: 'All Apps', count: apps.length },
    { id: 'learning', label: 'Learning', count: apps.filter(a => a.category === 'learning').length },
    { id: 'tools', label: 'Tools', count: apps.filter(a => a.category === 'tools').length },
    { id: 'premium', label: 'Premium', count: apps.filter(a => a.isPro).length },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition">
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900">Study Dashboard</h1>
              <p className="text-lg text-gray-600 mt-2">Welcome back, {user?.displayName?.split(' ')[0] || 'learner'}! 🎓</p>
            </div>
            {!isPro && (
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">📚 Free tier user</p>
                <Link href="/pricing" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Filter Apps</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as AppCategory)}
                className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  {cat.label}
                  <span className="text-xs opacity-75">({cat.count})</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredApps.map(app => (
            <Link key={app.id} href={app.href}>
              <div className={`
                group relative w-full aspect-square rounded-xl overflow-hidden cursor-pointer
                transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
                bg-gradient-to-b ${app.gradient}
                flex flex-col
              `}>
                {/* Top - Image/Icon Area */}
                <div className="flex-1 bg-gradient-to-b from-white/40 to-transparent flex items-center justify-center p-6">
                  <div className="text-gray-600 group-hover:scale-110 transition-transform">
                    {app.icon}
                  </div>
                </div>

                {/* Bottom - Content Area */}
                <div className="flex-1 p-6 flex flex-col justify-between bg-gradient-to-t from-white/60 to-transparent backdrop-blur-sm">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{app.name}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{app.description}</p>
                  </div>

                  {/* Badge area */}
                  <div className="flex items-center justify-between">
                    {app.isPro && !isActive ? (
                      <div className="flex items-center gap-2 bg-white/50 backdrop-blur px-3 py-1.5 rounded-lg">
                        <Lock className="w-3 h-3 text-gray-600" />
                        <span className="text-xs text-gray-700 font-semibold">Pro</span>
                      </div>
                    ) : app.isPro ? (
                      <div className="flex items-center gap-2 bg-yellow-200/50 backdrop-blur px-3 py-1.5 rounded-lg">
                        <Sparkles className="w-3 h-3 text-yellow-700" />
                        <span className="text-xs text-yellow-700 font-semibold">Pro</span>
                      </div>
                    ) : null}
                    
                    <ArrowRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Overlay for locked Pro features */}
                {app.isPro && !isActive && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-white mx-auto mb-2" />
                      <p className="text-white font-bold text-xs">Subscribe to unlock</p>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No apps found in this category</p>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Available Apps</p>
                  <p className="text-3xl font-bold text-gray-900">{apps.length}</p>
                </div>
                <Sparkles className="w-12 h-12 text-blue-500 opacity-50" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Free Apps</p>
                  <p className="text-3xl font-bold text-gray-900">{apps.filter(a => !a.isPro).length}</p>
                </div>
                <Upload className="w-12 h-12 text-green-500 opacity-50" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pro Features</p>
                  <p className="text-3xl font-bold text-gray-900">{apps.filter(a => a.isPro).length}</p>
                  {!isActive && (
                    <Link href="/pricing" className="text-blue-600 text-xs font-semibold mt-2 hover:underline">
                      Upgrade now →
                    </Link>
                  )}
                </div>
                <Sparkles className="w-12 h-12 text-purple-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
