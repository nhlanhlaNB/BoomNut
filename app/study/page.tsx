'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  bgImage: string;
}

export default function StudyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isActive, subscription, loading } = useSubscription();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);
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
      gradient: 'from-blue-600 to-blue-800',
      bgImage: 'url(https://t4.ftcdn.net/jpg/04/26/81/25/360_F_426812570_B2dNNbd6gwOh3jXoZEjYDkrE2mUAuqiv.jpg)',
    },
    {
      id: 'tutor',
      name: 'AI Tutor Chat',
      description: '24/7 Personal AI Tutor',
      icon: <Brain className="w-12 h-12" />,
      href: '/tutor',
      category: 'learning',
      color: 'purple',
      gradient: 'from-purple-600 to-purple-800',
      bgImage: 'url(https://img.freepik.com/premium-photo/humanoid-robot-teaching-classroom-diverse-students_1175634-5778.jpg)',
    },
    {
      id: 'voice-tutor',
      name: 'Voice Tutor',
      description: 'Speak & Learn',
      icon: <Mic className="w-12 h-12" />,
      href: '/voice-tutor',
      category: 'tools',
      color: 'indigo',
      gradient: 'from-indigo-600 to-indigo-800',
      bgImage: 'url(https://tse3.mm.bing.net/th/id/OIP.84gpn3MaeVNNU-4CRvrAWwHaEK?rs=1&pid=ImgDetMain&o=7&rm=3)',
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
      gradient: 'from-cyan-600 to-cyan-800',
      bgImage: 'url(https://allfortheai.com/wp-content/uploads/2024/04/Article-17.-Website.8.jpg)',
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
      gradient: 'from-lime-600 to-lime-800',
      bgImage: 'url(https://t4.ftcdn.net/jpg/05/85/31/79/360_F_585317906_FYykH76pqcwV3UIA3oSiS3lxtGRro2gx.jpg)',
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
      gradient: 'from-rose-600 to-rose-800',
      bgImage: 'url(https://www.kangaroos.ai/wp-content/uploads/elementor/thumbs/ai-essay-1-qr09cwn5772nowa41vvu2nzhhafv7qa0wmhb8ld6ce.jpg)',
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
      gradient: 'from-violet-600 to-violet-800',
      bgImage: 'url(https://pixel-earth.com/wp-content/uploads/2024/12/Leonardo_Kino_XL_ai_drawing_0.jpg)',
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
      gradient: 'from-teal-600 to-teal-800',
      bgImage: 'url(https://cdn.analyticsvidhya.com/wp-content/uploads/2023/05/ai-drawing-1.png)',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredApps.map(app => (
            <Link key={app.id} href={app.href}>
              <div className={`
                group relative w-full overflow-hidden rounded-2xl cursor-pointer
                transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2
                bg-white shadow-lg
                flex flex-col h-full
              `}>
                {/* Banner/Image Area - Top */}
                <div 
                  className="w-full h-40 flex items-center justify-center text-white font-bold text-lg relative overflow-hidden bg-cover bg-center"
                  style={{ backgroundImage: app.bgImage }}
                >
                  <div className="absolute inset-0 bg-black/40 opacity-20 group-hover:opacity-30 transition-opacity" />
                  <div className="relative z-10 text-white drop-shadow-lg text-3xl">
                    {app.icon}
                  </div>
                </div>

                {/* Content Area - Bottom */}
                <div className="flex-1 p-6 flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{app.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{app.description}</p>
                  </div>

                  {/* Badge area */}
                  <div className="flex items-center justify-between pt-4 mt-auto">
                    {app.isPro && !isActive ? (
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <Lock className="w-3 h-3 text-gray-600" />
                        <span className="text-xs text-gray-700 font-semibold">Pro</span>
                      </div>
                    ) : app.isPro ? (
                      <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded-lg">
                        <Sparkles className="w-3 h-3 text-yellow-600" />
                        <span className="text-xs text-yellow-700 font-semibold">Pro</span>
                      </div>
                    ) : null}
                    
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Overlay for locked Pro features */}
                {app.isPro && !isActive && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-white mx-auto mb-2" />
                      <p className="text-white font-bold">Subscribe to unlock</p>
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
