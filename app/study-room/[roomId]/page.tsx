'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Send, Users, Copy, CheckCircle, Home, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';
import ChatMessage from '@/components/ChatMessage';
import SubjectSelector from '@/components/SubjectSelector';
import AuthButton from '@/components/AuthButton';
import PaywallModal from '@/components/PaywallModal';

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
  const { isActive } = useSubscription();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState('General');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [copied, setCopied] = useState(false);
  const [roomExists, setRoomExists] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const FREE_MESSAGE_LIMIT = 2;

  // Fetch message usage from database on load
  useEffect(() => {
    if (!user || isActive) return; // Don't track for paid users

    const fetchUsage = async () => {
      try {
        const response = await fetch(`/api/usage/track?userId=${user.uid}&appName=studyRoom`);
        if (response.ok) {
          const data = await response.json();
          setMessageCount(data.messageCount);
          console.log('[STUDY ROOM] Loaded usage:', data);
        }
      } catch (error) {
        console.error('[STUDY ROOM] Error fetching usage:', error);
      }
    };

    fetchUsage();
  }, [user, isActive]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize room and join
  useEffect(() => {
    if (!user || authLoading || !db) return;

    const initializeRoom = async () => {
      const roomRef = doc(db!, 'studyRooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        // Create room if it doesn't exist
        await setDoc(roomRef, {
          createdAt: new Date(),
          createdBy: user.uid,
          roomCode: roomId,
          subject: 'General',
          maxParticipants: 5,
          participants: [{
            uid: user.uid,
            name: user.displayName || 'Anonymous',
            photo: user.photoURL || '',
            joinedAt: new Date()
          }]
        });
      } else {
        // Join existing room
        const roomData = roomSnap.data();
        const currentParticipants = roomData.participants || [];
        const maxParticipants = roomData.maxParticipants || 5;
        const alreadyJoined = currentParticipants.some((p: Participant) => p.uid === user.uid);
        
        // Check if room is full
        if (!alreadyJoined && currentParticipants.length >= maxParticipants) {
          alert('❌ This room is full! Maximum 5 participants allowed.');
          setRoomExists(false);
          return;
        }
        
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

        setSubject(roomData.subject || 'General');
      }

      setRoomExists(true);
    };

    initializeRoom();
  }, [user, authLoading, roomId]);

  // Listen to room updates
  useEffect(() => {
    if (!roomId || !db) return;

    const roomRef = doc(db!, 'studyRooms', roomId);
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
    if (!roomId || !db) return;

    const messagesRef = collection(db!, 'studyRooms', roomId, 'messages');
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
    if (!input.trim() || isLoading || !user || !db) return;

    // Check free tier limit
    if (!isActive && messageCount >= FREE_MESSAGE_LIMIT) {
      setShowPaywall(true);
      return;
    }

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
    
    // Track usage for free tier users
    if (!isActive && user) {
      try {
        const trackResponse = await fetch('/api/usage/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            appName: 'studyRoom'
          })
        });
        
        if (trackResponse.ok) {
          const trackData = await trackResponse.json();
          setMessageCount(trackData.messageCount);
          console.log('[STUDY ROOM] Usage tracked:', trackData);
        }
      } catch (error) {
        console.error('[STUDY ROOM] Error tracking usage:', error);
      }
    }

    try {
      // Add user message to Firestore
      const messagesRef = collection(db!, 'studyRooms', roomId, 'messages');
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
    if (!db) return;
    setSubject(newSubject);
    const roomRef = doc(db!, 'studyRooms', roomId);
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
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex gap-4">
        {/* Participants Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow p-4">
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Room Code</p>
            <p className="text-lg font-bold text-blue-600">{roomId}</p>
            <p className="text-xs text-gray-500 mt-2">Share this code with friends to join</p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Participants</h3>
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{participants.length}/5</span>
          </div>
          
          {participants.length >= 5 && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              ⚠️ Room is full!
            </div>
          )}
          
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
            {/* Free tier usage indicator */}
            {!isActive && user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Free Plan: {messageCount}/{FREE_MESSAGE_LIMIT} messages used
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

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal 
          feature="unlimited-study-room"
          featureName="Unlimited Study Room Chat"
          requiredPlan="pro"
        />
      )}
    </div>
  );
}
