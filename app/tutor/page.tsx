'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { 
  Plus, 
  Share2, 
  Settings, 
  FileText, 
  Layout, 
  MoreVertical, 
  BrainCircuit, 
  ChevronRight, 
  Headphones, 
  FileVideo, 
  Layers, 
  BarChart, 
  MessageSquare, 
  HelpCircle, 
  Database,
  Columns
} from 'lucide-react';
import Link from 'next/link';
import FileUpload, { type UploadedFileData } from '@/components/FileUpload';
import PaywallModal from '@/components/PaywallModal';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useAppUsage } from '@/hooks/useAppUsage';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function TutorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isActive } = useSubscription();
  const { usageCount, isLimitExceeded, trackUsage, isLoaded } = useAppUsage('tutor', 2);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileData[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Layout states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check free tier limit
    if (!isActive && isLimitExceeded) {
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
    
    // Track usage for free tier users
    if (!isActive && user) {
      await trackUsage();
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          subject: 'General',
          fileContents: uploadedFiles.map(f => ({
            filename: f.filename,
            content: f.content,
          })),
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

  const handleFileUpload = (fileData: UploadedFileData) => {
    setUploadedFiles(prev => [...prev, fileData]);
  };

  const generateStudioContent = async (type: 'mind-map' | 'reports' | 'flashcards' | 'quiz') => {
    if (uploadedFiles.length === 0) {
      alert('Please upload study materials first');
      return;
    }

    if (!isActive && isLimitExceeded) {
      setShowPaywall(true);
      return;
    }

    const prompts = {
      'mind-map': 'Create a detailed mind map for the uploaded materials. Show the main topics, subtopics, and connections between concepts.',
      'reports': 'Generate a comprehensive report analyzing the uploaded materials. Include key concepts, summaries, and important takeaways.',
      'flashcards': 'Generate 10 flashcard questions and answers based on the uploaded materials. Format each as Q: [question] A: [answer].',
      'quiz': 'Generate a quiz with 5 multiple-choice questions based on the uploaded materials. Include the correct answer and brief explanations.',
    };

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompts[type],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Track usage for free tier users
    if (!isActive && user) {
      await trackUsage();
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          subject: 'General',
          fileContents: uploadedFiles.map(f => ({
            filename: f.filename,
            content: f.content,
          })),
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
        content: 'Sorry, I encountered an error generating the content. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 overflow-hidden font-sans">
      {showPaywall && (
        <PaywallModal
          feature="unlimited-chat"
          featureName="Unlimited AI Chat"
          requiredPlan="pro"
        />
      )}

      {/* Top Header */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
        <div className="flex items-center gap-2">
        </div>
        <div className="flex items-center gap-2 text-right">
           {!isActive && user && (
            <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-200 flex items-center gap-2">
               <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                  {!isLoaded ? "..." : `Free Plan: ${usageCount}/2`}
               </span>
               <Link href="/pricing" className="text-[10px] uppercase font-bold tracking-widest text-blue-600 hover:text-blue-700">
                  Upgrade
               </Link>
            </div>
           )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Sources */}
        <aside className={`${leftSidebarOpen ? 'w-64' : 'w-0'} border-r border-gray-200 flex flex-col bg-white transition-all duration-300 relative`}>
          <div className="p-4 flex items-center justify-between overflow-hidden">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">Sources</h2>
            <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
              <Columns size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {uploadedFiles.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500 italic">No sources uploaded yet</p>
              </div>
            ) : (
              uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer group">
                  <div className={`p-1.5 rounded bg-red-100 text-red-600`}>
                    <FileText size={14} />
                  </div>
                  <span className="text-xs text-gray-700 truncate flex-1">{file.filename}</span>
                  <div className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center bg-white">
                     <span className="text-[10px] text-blue-600">✓</span>
                  </div>
                </div>
              ))
            )}
            
          </div>
        </aside>

        {/* Center - Chat */}
        <div className="flex-1 flex flex-col bg-white relative">
          <header className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">Chat</h2>
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                <Layout size={14} />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                <MoreVertical size={14} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
            <div className="w-full max-w-2xl space-y-8">
              {messages.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <BrainCircuit className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Welcome to Your AI Tutor!
                  </h2>
                  <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                    Ask me anything or upload study materials to get started. 
                    I can help you understand complex topics, solve problems, or prepare for exams.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((m) => (
                     <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[100%] ${
                          m.role === 'user' 
                          ? 'bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-sm text-gray-900' 
                          : 'bg-gray-50 px-4 py-3 rounded-2xl border border-gray-200 text-gray-900'
                        }`}>
                          {m.role === 'assistant' && (
                             <div className="flex items-center gap-2 mb-3 opacity-80">
                               <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                                 <BrainCircuit size={12} className="text-blue-600" />
                               </div>
                               <span className="text-[10px] uppercase font-bold tracking-widest text-gray-600">Spark.E AI</span>
                             </div>
                          )}
                          <div className="text-sm leading-relaxed markdown-content">
                            <ReactMarkdown
                              components={{
                                h1: ({node, ...props}) => <h1 className="text-lg font-bold my-2 text-gray-900" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-base font-bold my-2 text-gray-900" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-sm font-bold my-1 text-gray-900" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                                em: ({node, ...props}) => <em className="italic text-gray-900" {...props} />,
                                code: ({node, ...props}) => <code className="bg-gray-200 px-1 rounded text-red-700" {...props} />,
                                pre: ({node, ...props}) => <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-gray-900" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc ml-5 my-2 text-gray-900" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal ml-5 my-2 text-gray-900" {...props} />,
                                li: ({node, ...props}) => <li className="my-1 text-gray-900" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2 text-gray-900" {...props} />,
                                p: ({node, ...props}) => <p className="my-1 text-gray-900" {...props} />,
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                          <div className="mt-2 flex items-center gap-2 opacity-50 text-[9px] uppercase font-bold tracking-widest text-gray-500">
                            <span>{m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                     </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start px-2">
                      <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                         <BrainCircuit size={14} />
                         <span className="text-[9px] uppercase font-bold tracking-widest">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Chat Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="w-full">
                <FileUpload onFileUpload={handleFileUpload} />
              </div>
              
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-2xl p-4 pr-32 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 placeholder-gray-400 resize-none min-h-[60px] transition-all"
                  rows={1}
                />
                <div className="absolute right-4 bottom-4 flex items-center gap-3">
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className={`p-1.5 rounded-lg transition-colors ${
                      input.trim() && !isLoading ? 'bg-blue-600 text-white' : 'text-gray-600 border border-white/5'
                    }`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Studio */}
        <aside className={`${rightSidebarOpen ? 'w-80' : 'w-0'} border-l border-gray-200 flex flex-col bg-gray-50 transition-all duration-300 relative`}>
          <div className="p-4 flex items-center justify-between overflow-hidden">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">Studio</h2>
            <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
              <Columns size={14} className="rotate-180" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <StudioTool icon={<Layers size={16} />} label="Mind Map" onClick={() => generateStudioContent('mind-map')} />
                <StudioTool icon={<BarChart size={16} />} label="Reports" onClick={() => generateStudioContent('reports')} />
                <StudioTool icon={<MessageSquare size={16} />} label="Flashcards" onClick={() => generateStudioContent('flashcards')} />
                <StudioTool icon={<HelpCircle size={16} />} label="Quiz" onClick={() => generateStudioContent('quiz')} />
              </div>
            </div>

            <div className="mt-12 text-center p-8">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Layers className="w-6 h-6 rotate-12" />
              </div>
              <h3 className="text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-widest">Studio output will be saved here.</h3>
              <p className="text-[9px] text-gray-600 leading-relaxed uppercase tracking-widest font-bold">
                After adding sources, click to generate study guides and more.
              </p>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 overflow-hidden">
            <button className="w-full bg-gray-200 text-gray-900 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-300 transition whitespace-nowrap">
              <Plus size={14} /> Add note
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StudioTool({ icon, label, beta, onClick }: { icon: React.ReactNode, label: string, beta?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white border border-gray-300 p-3 rounded-xl hover:bg-blue-50 transition cursor-pointer group relative">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
          {icon}
        </div>
        <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition" />
      </div>
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest truncate">{label}</span>
        {beta && <span className="text-[7px] px-1 bg-gray-200 text-gray-600 rounded-sm font-bold">BETA</span>}
      </div>
    </div>
  );
}