'use client';

import Link from 'next/link';
import { BookOpen, Upload, TrendingUp, Brain, Zap, Sparkles, Users, Volume2, Target, Clock, Award, MessageCircle, Gamepad2, FileText, Lightbulb, Mic, Video, BookMarked } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 pb-12 md:pb-16">
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full text-sm font-bold text-orange-700 mb-6 shadow-md">
            <Sparkles className="w-4 h-4" />
            <span>Trusted by 10,000+ students worldwide</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
            Study Smarter,<br />
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">Not Harder</span> 🚀
          </h2>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Turn any study material into flashcards, quizzes, and summaries instantly. 
            Get 24/7 help from your AI tutor. Ace your exams with confidence!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/study"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-lg font-bold rounded-full hover:scale-105 transition-all shadow-2xl"
            >
              <Sparkles className="w-5 h-5" />
              Start For Free
            </Link>
            <Link 
              href="/voice-tutor"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-800 text-lg font-bold rounded-full hover:scale-105 transition-all shadow-xl border-2 border-gray-200"
            >
              <Volume2 className="w-5 h-5" />
              Try Voice Tutor
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">No credit card required • Free forever plan</p>
        </div>

        {/* Nelson Mandela Quote Section */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200 mb-16 md:mb-24 transform hover:scale-[1.02] transition-all">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Side */}
            <div className="relative h-64 md:h-auto">
              <img 
                src="/Mandela.jpg" 
                alt="Nelson Mandela"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>
            </div>
            
            {/* Quote Side */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <svg className="w-12 h-12 text-orange-500 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              
              <blockquote className="mb-6">
                <p className="text-xl md:text-3xl font-bold text-gray-900 leading-relaxed mb-4">
                  "Education is the most powerful weapon which you can use to change the world."
                </p>
                <footer className="text-lg md:text-xl text-orange-600 font-semibold">
                  — Nelson Mandela
                </footer>
              </blockquote>
              
              <p className="text-sm md:text-base text-gray-600 italic">
                Start your journey to academic excellence with AI-powered learning tools.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-16 md:mb-24">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-lg text-center border border-white/50 hover:scale-105 transition-transform">
            <div className="text-3xl md:text-4xl font-black text-orange-600 mb-2">10K+</div>
            <div className="text-sm md:text-base text-gray-600 font-medium">Active Students</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-lg text-center border border-white/50 hover:scale-105 transition-transform">
            <div className="text-3xl md:text-4xl font-black text-amber-600 mb-2">4.9★</div>
            <div className="text-sm md:text-base text-gray-600 font-medium">Average Rating</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-lg text-center border border-white/50 hover:scale-105 transition-transform">
            <div className="text-3xl md:text-4xl font-black text-orange-600 mb-2">1M+</div>
            <div className="text-sm md:text-base text-gray-600 font-medium">Flashcards Made</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-lg text-center border border-white/50 hover:scale-105 transition-transform">
            <div className="text-3xl md:text-4xl font-black text-amber-600 mb-2">95%</div>
            <div className="text-sm md:text-base text-gray-600 font-medium">Pass Rate</div>
          </div>
        </div>

        {/* Study Modes */}
        <div className="mb-16 md:mb-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Everything You Need in One Place
            </h3>
            <p className="text-lg md:text-xl text-gray-600">Powerful study tools that adapt to your learning style</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StudyModeCard
              icon={<Zap className="w-12 h-12 text-orange-600" />}
              title="Smart Flashcards"
              description="AI-powered flashcards with spaced repetition for maximum retention"
              gradient="from-orange-400 to-amber-500"
              link="/study"
            />
            <StudyModeCard
              icon={<Target className="w-12 h-12 text-purple-600" />}
              title="Practice Quizzes"
              description="Adaptive quizzes that test exactly what you need to learn"
              gradient="from-purple-400 to-pink-500"
              link="/study"
            />
            <StudyModeCard
              icon={<BookOpen className="w-12 h-12 text-blue-600" />}
              title="Study Guides"
              description="Comprehensive guides with all key concepts organized perfectly"
              gradient="from-blue-400 to-cyan-500"
              link="/study"
            />
            <StudyModeCard
              icon={<MessageCircle className="w-12 h-12 text-green-600" />}
              title="AI Tutor Chat"
              description="24/7 personal tutor that explains concepts in simple terms"
              gradient="from-green-400 to-emerald-500"
              link="/tutor"
            />
          </div>
          
          {/* New Features Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StudyModeCard
              icon={<Gamepad2 className="w-12 h-12 text-pink-600" />}
              title="Study Arcade"
              description="Gamified learning with points, challenges, and leaderboards"
              gradient="from-pink-400 to-rose-500"
              link="/arcade"
            />
            <StudyModeCard
              icon={<FileText className="w-12 h-12 text-indigo-600" />}
              title="Essay Grading"
              description="Get instant AI feedback on your essays with detailed analysis"
              gradient="from-indigo-400 to-purple-500"
              link="/essay-grading"
            />
            <StudyModeCard
              icon={<Lightbulb className="w-12 h-12 text-yellow-600" />}
              title="Explainers"
              description="Clear, simple explanations for any complex topic with examples"
              gradient="from-yellow-400 to-amber-500"
              link="/explainers"
            />
            <StudyModeCard
              icon={<Mic className="w-12 h-12 text-red-600" />}
              title="Live Lecture"
              description="Real-time transcription and AI notes during your lectures"
              gradient="from-red-400 to-orange-500"
              link="/live-lecture"
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16 md:mb-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Why Students Love BoomNut
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Upload className="w-12 h-12 text-orange-500" />}
              title="Upload Anything"
              description="PDFs, notes, textbooks, lectures - we handle it all"
            />
            <FeatureCard
              icon={<Volume2 className="w-12 h-12 text-blue-500" />}
              title="Audio Recap"
              description="Convert your notes into engaging audio podcasts"
            />
            <FeatureCard
              icon={<BookMarked className="w-12 h-12 text-purple-500" />}
              title="Notes & Materials"
              description="Organize, store, and access all your study materials"
            />
            <FeatureCard
              icon={<Clock className="w-12 h-12 text-green-500" />}
              title="Save Hours of Time"
              description="Get study materials ready in seconds, not hours"
            />
            <FeatureCard
              icon={<Brain className="w-12 h-12 text-pink-500" />}
              title="Learn Faster"
              description="AI adapts to your learning pace and style"
            />
            <FeatureCard
              icon={<Users className="w-12 h-12 text-cyan-500" />}
              title="Study Together"
              description="Join study rooms and collaborate with classmates"
            />
            <FeatureCard
              icon={<TrendingUp className="w-12 h-12 text-indigo-500" />}
              title="Track Progress"
              description="See your improvement with detailed analytics"
            />
            <FeatureCard
              icon={<Award className="w-12 h-12 text-amber-500" />}
              title="Better Grades"
              description="95% of students improve their test scores"
            />
            <FeatureCard
              icon={<Video className="w-12 h-12 text-red-500" />}
              title="Visual Learning"
              description="Analyze diagrams, charts, and images with AI"
            />
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-16 mb-16 md:mb-24 border border-gray-100">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Get Started in 3 Easy Steps
            </h3>
            <p className="text-lg md:text-xl text-gray-600">From upload to mastery in minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:scale-110 transition">
                <span className="text-3xl md:text-4xl font-black text-white">1</span>
              </div>
              <h4 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">Upload Your Stuff</h4>
              <p className="text-gray-600">Drop any study material - notes, PDFs, slides, or textbooks</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:scale-110 transition">
                <span className="text-3xl md:text-4xl font-black text-white">2</span>
              </div>
              <h4 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">Choose Your Tool</h4>
              <p className="text-gray-600">Pick flashcards, quizzes, guides, or chat with your AI tutor</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:scale-110 transition">
                <span className="text-3xl md:text-4xl font-black text-white">3</span>
              </div>
              <h4 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">Ace Your Exams</h4>
              <p className="text-gray-600">Study smarter and watch your grades soar</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-12 text-white shadow-2xl">
          <h3 className="text-4xl font-bold mb-4">🚀 Ready to Ace Your Next Exam?</h3>
          <p className="text-xl mb-8 text-orange-100">Join thousands of students getting better grades with BoomNut</p>
          <Link 
            href="/study"
            className="inline-block px-8 py-4 bg-white text-orange-600 text-lg font-bold rounded-lg hover:bg-orange-50 transition shadow-lg transform hover:scale-105"
          >
            Start Learning for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 py-12 bg-gradient-to-r from-orange-50 to-amber-50 border-t border-orange-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/logoBoomNut.png" 
                  alt="BoomNut Logo" 
                  className="h-16 w-auto object-contain mix-blend-multiply"
                />
              </div>
              <p className="text-gray-600 text-sm">Your smart AI study companion for better grades.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Study Tools</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/study" className="hover:text-orange-500">Flashcards</Link></li>
                <li><Link href="/study" className="hover:text-orange-500">Quizzes</Link></li>
                <li><Link href="/study" className="hover:text-orange-500">Study Guides</Link></li>
                <li><Link href="/arcade" className="hover:text-orange-500">Study Arcade</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/tutor" className="hover:text-orange-500">AI Tutor</Link></li>
                <li><Link href="/essay-grading" className="hover:text-orange-500">Essay Grading</Link></li>
                <li><Link href="/explainers" className="hover:text-orange-500">Explainers</Link></li>
                <li><Link href="/live-lecture" className="hover:text-orange-500">Live Lecture</Link></li>
                <li><Link href="/voice-tutor" className="hover:text-orange-500">Voice Chat</Link></li>
                <li><Link href="/progress" className="hover:text-orange-500">Progress Tracking</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/pricing" className="hover:text-orange-500">Pricing</Link></li>
                <li><Link href="/study-plan" className="hover:text-orange-500">Study Plans</Link></li>
                <li><Link href="/study-rooms" className="hover:text-orange-500">Study Rooms</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-orange-200">
            <p className="text-gray-600 text-sm">© 2026 BoomNut. Study smarter, not harder.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </main>
  );
}

function StudyModeCard({ icon, title, description, gradient, link }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  gradient: string;
  link?: string;
}) {
  const CardContent = (
    <div className="relative group cursor-pointer">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-all duration-300`} />
      <div className="relative p-6 md:p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 h-full flex flex-col">
        <div className="mb-4 transform group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link}>{CardContent}</Link>;
  }
  
  return CardContent;
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 md:p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-300">
      <div className="mb-4 transform hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
