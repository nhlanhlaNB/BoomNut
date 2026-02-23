'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, ChevronDown, Home, BookOpen, Brain, Mic, Video, 
  Gamepad2, FileText, Lightbulb, GraduationCap, PenTool, 
  Users, TrendingUp, Target, DollarSign
} from 'lucide-react';
import AuthButton from './AuthButton';
import SubscriptionBadge from './SubscriptionBadge';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const pathname = usePathname();

  const services = [
    { name: 'Study Dashboard', href: '/study', icon: BookOpen, description: 'Flashcards, Quizzes & More' },
    { name: 'AI Tutor Chat', href: '/tutor', icon: Brain, description: '24/7 Personal AI Tutor' },
    { name: 'Voice Tutor', href: '/voice-tutor', icon: Mic, description: 'Speak & Learn' },
    { name: 'Voice Tutor WebRTC', href: '/voice-tutor-webrtc', icon: Video, description: 'Real-time Voice Learning' },
    { name: 'Live Lecture', href: '/live-lecture', icon: Video, description: 'Record & Transcribe' },
    { name: 'Study Arcade', href: '/arcade', icon: Gamepad2, description: 'Gamified Learning' },
    { name: 'Essay Grading', href: '/essay-grading', icon: PenTool, description: 'AI Essay Feedback' },
    { name: 'Visual Analysis', href: '/visual-analysis', icon: Lightbulb, description: 'Image & Diagram Analysis' },
    { name: 'Explainers', href: '/explainers', icon: FileText, description: 'Concept Explanations' },
  ];

  const mainLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Progress', href: '/progress', icon: TrendingUp },
    { name: 'Study Plan', href: '/study-plan', icon: Target },
    { name: 'Study Rooms', href: '/study-rooms', icon: Users },
    { name: 'Pricing', href: '/pricing', icon: DollarSign },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Desktop & Mobile Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <img 
                src="/logoBoomNut.png" 
                alt="BoomNut Logo" 
                className="h-12 md:h-16 w-auto object-contain mix-blend-multiply"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {mainLinks.slice(0, -1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Services Dropdown */}
              <div className="relative">
                <button
                  onMouseEnter={() => setIsServicesOpen(true)}
                  onMouseLeave={() => setIsServicesOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors inline-flex items-center gap-1"
                >
                  Services
                  <ChevronDown className={`w-4 h-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isServicesOpen && (
                  <div
                    onMouseEnter={() => setIsServicesOpen(true)}
                    onMouseLeave={() => setIsServicesOpen(false)}
                    className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50"
                  >
                    {services.map((service) => (
                      <Link
                        key={service.href}
                        href={service.href}
                        className="block px-4 py-3 hover:bg-orange-50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <service.icon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-orange-600 text-sm">
                              {service.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {service.description}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:opacity-90 transition font-bold text-sm shadow-lg"
              >
                💸 Pricing
              </Link>
            </div>

            {/* Right Side - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <SubscriptionBadge />
              <AuthButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto">
            <div className="p-6">
              {/* Close Button */}
              <div className="flex justify-between items-center mb-6">
                <img 
                  src="/logoBoomNut.png" 
                  alt="BoomNut Logo" 
                  className="h-12 w-auto object-contain mix-blend-multiply"
                />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Auth & Subscription */}
              <div className="mb-6 space-y-3">
                <SubscriptionBadge />
                <AuthButton />
              </div>

              {/* Main Links */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Navigation
                </h3>
                <div className="space-y-1">
                  {mainLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(link.href)
                          ? 'bg-orange-100 text-orange-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Services
                </h3>
                <div className="space-y-1">
                  {services.map((service) => (
                    <Link
                      key={service.href}
                      href={service.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(service.href)
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <service.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">{service.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {service.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
