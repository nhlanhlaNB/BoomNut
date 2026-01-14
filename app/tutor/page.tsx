'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Upload, Download, BookOpen, Home, Lock } from 'lucide-react';
import Link from 'next/link';
import ChatMessage from '@/components/ChatMessage';
import FileUpload from '@/components/FileUpload';
import VoiceRecorder from '@/components/VoiceRecorder';
import SubjectSelector from '@/components/SubjectSelector';
import AuthButton from '@/components/AuthButton';
import PaywallModal from '@/components/PaywallModal';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function TutorPage() {
  const { user } = useAuth();
  const { plan, isPro } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState('General');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const FREE_MESSAGE_LIMIT = 5;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check free tier limit
    if (!isPro && messageCount >= FREE_MESSAGE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    if (!isPro) setMessageCount(prev => prev + 1);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          subject,
          uploadedFiles,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (filename: string) => {
    setUploadedFiles(prev => [...prev, filename]);
  };

  const handleVoiceInput = (transcript: string) => {
    setInput(transcript);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showPaywall && (
        <PaywallModal
          feature="unlimited-chat"
          featureName="Unlimited AI Chat"
          requiredPlan="pro"
        />
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-blue-100">
            <Home className="w-5 h-5" />
            <span className="font-semibold">Home</span>
          </Link>
          <div className="flex items-center gap-4">
            <AuthButton />
            <Link 
              href="/study-rooms" 
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors font-medium"
            >
              Study Rooms
            </Link>
            <Link 
              href="/study" 
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors font-medium"
            >
              Study Dashboard
            </Link>
            <SubjectSelector subject={subject} onSubjectChange={setSubject} />
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 overflow-hidden flex flex-col">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-white rounded-lg shadow p-4">
          {/* Free tier usage indicator */}
          {!isPro && user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Free Plan: {messageCount}/{FREE_MESSAGE_LIMIT} messages used today
                  </span>
                </div>
                <Link
                  href="/pricing"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                Welcome to Your AI Tutor!
              </h2>
              <p className="text-gray-500">
                Ask me anything or upload study materials to get started.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File Upload Info */}
        {uploadedFiles.length > 0 && (
          <div className="mb-2 p-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              {uploadedFiles.length} file(s) uploaded and ready for questions
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex gap-2 mb-2">
            <FileUpload onFileUpload={handleFileUpload} />
            <VoiceRecorder 
              onTranscript={handleVoiceInput}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
            />
          </div>
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              aria-label="Send message"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
