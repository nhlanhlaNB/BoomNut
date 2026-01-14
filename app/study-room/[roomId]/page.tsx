'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Send, Users, Copy, CheckCircle, Home, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ChatMessage from '@/components/ChatMessage';
import SubjectSelector from '@/components/SubjectSelector';
import AuthButton from '@/components/AuthButton';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  userPhoto?: string;
};

type Participant = {
  uid: string;
  name: string;
  photo: string;
  joinedAt: Date;
};

export default function StudyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user, loading: authLoading } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState('General');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [copied, setCopied] = useState(false);
  const [roomExists, setRoomExists] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize room and join
  useEffect(() => {
    if (!user || authLoading) return;

    const initializeRoom = async () => {
      const roomRef = doc(db, 'studyRooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        // Create room if it doesn't exist
        await setDoc(roomRef, {
          createdAt: new Date(),
          createdBy: user.uid,
          subject: 'General',
          participants: [{
            uid: user.uid,
            name: user.displayName || 'Anonymous',
            photo: user.photoURL || '',
            joinedAt: new Date()
          }]
        });
      } else {
        // Join existing room
        const currentParticipants = roomSnap.data().participants || [];
        const alreadyJoined = currentParticipants.some((p: Participant) => p.uid === user.uid);
        
        if (!alreadyJoined) {
          await updateDoc(roomRef, {
            participants: arrayUnion({
              uid: user.uid,
              name: user.displayName || 'Anonymous',
              photo: user.photoURL || '',
              joinedAt: new Date()
            })
          });
        }

        setSubject(roomSnap.data().subject || 'General');
      }

      setRoomExists(true);
    };

    initializeRoom();
  }, [user, authLoading, roomId]);

  // Listen to room updates
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, 'studyRooms', roomId);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setParticipants(data.participants || []);
        if (data.subject) setSubject(data.subject);
      } else {
        setRoomExists(false);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Listen to messages
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, 'studyRooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          userId: data.userId,
          userName: data.userName,
          userPhoto: data.userPhoto
        });
      });
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userPhoto: user.photoURL || ''
    };

    setInput('');
    setIsLoading(true);

    try {
      // Add user message to Firestore
      const messagesRef = collection(db, 'studyRooms', roomId, 'messages');
      await addDoc(messagesRef, userMessage);

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })).concat([{ role: 'user', content: input }]),
          subject,
          uploadedFiles: [],
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      // Add AI response to Firestore
      await addDoc(messagesRef, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send message');
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

  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateRoomSubject = async (newSubject: string) => {
    setSubject(newSubject);
    const roomRef = doc(db, 'studyRooms', roomId);
    await updateDoc(roomRef, { subject: newSubject });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In to Join Study Room</h2>
          <p className="text-gray-600 mb-6">You need to sign in with Google to join collaborative study sessions</p>
          <AuthButton />
          <Link href="/" className="block mt-4 text-blue-600 hover:text-blue-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!roomExists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Room Not Found</h2>
          <p className="text-gray-600 mb-6">This study room doesn't exist.</p>
          <Link href="/study-rooms" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Study Rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-blue-100">
              <Home className="w-5 h-5" />
              <span className="font-semibold">Home</span>
            </Link>
            <div className="h-6 w-px bg-white/30"></div>
            <span className="text-white font-semibold">Study Room</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={copyRoomLink}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share Room'}
            </button>
            <SubjectSelector subject={subject} onSubjectChange={updateRoomSubject} />
            <AuthButton />
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex gap-4">
        {/* Participants Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Participants ({participants.length})</h3>
          </div>
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.uid} className="flex items-center gap-3">
                {participant.photo ? (
                  <img src={participant.photo} alt={participant.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {participant.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{participant.name}</p>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-white rounded-lg shadow p-4">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                  Study Together with AI!
                </h2>
                <p className="text-gray-500">
                  Ask questions and learn together. Everyone in the room can see the conversation.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.role === 'user' && message.userName && (
                      <div className="flex items-center gap-2 mb-1 ml-2">
                        {message.userPhoto ? (
                          <img src={message.userPhoto} alt={message.userName} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                            {message.userName.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-600">{message.userName}</span>
                      </div>
                    )}
                    <ChatMessage message={message} />
                  </div>
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

          {/* Input Area */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask the AI tutor anything..."
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                aria-label="Send message"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
