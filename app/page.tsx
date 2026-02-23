'use client';

import Link from 'next/link';
import { ArrowRight, LogIn } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="flex flex-col justify-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Study Smarter with AI
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg">
              Master any subject with AI-powered flashcards, quizzes, study guides, and personalized tutoring. Learn at your own pace
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/study"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/signin"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="bg-gray-200 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=80"
                alt="Professional workspace"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nelson Mandela Quote Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Side */}
            <div className="relative h-64 md:h-full min-h-96">
              <img 
                src="/Mandela.jpg"
                alt="Nelson Mandela"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            </div>
            
            {/* Quote Side */}
            <div className="p-8 md:p-12 flex flex-col justify-center bg-gray-50">
              <div className="mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              
              <blockquote className="mb-6">
                <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed mb-4">
                  "Education is the most powerful weapon which you can use to change the world."
                </p>
                <footer className="text-lg text-gray-700 font-semibold">
                  — Nelson Mandela
                </footer>
              </blockquote>
              
              <p className="text-base text-gray-600">
                BoomNut combines AI technology with proven study methods to accelerate your learning and boost your grades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-sm">© 2026 BoomNut. Study smarter, not harder.</p>
        </div>
      </footer>
    </main>
  );
}
