'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, ArrowRight, Sparkles, Home, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import AuthButton from '@/components/AuthButton';

export default function StudyRoomsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    subject: '',
    description: '',
    isPublic: true,
    maxMembers: 10,
  });

  const loadRooms = async () => {
    try {
      const response = await fetch('/api/study-rooms?userId=demo_user');
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const createRoomWithDetails = async () => {
    try {
      const response = await fetch('/api/study-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRoom, userId: user?.uid || 'demo_user' }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/study-room/${data.room.id}`);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    router.push(`/study-room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/study-room/${roomCode.trim()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <header className="p-6 bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
              <Home className="w-5 h-5" />
              <span className="font-semibold">Home</span>
            </Link>
            <AuthButton />
          </div>
        </header>
        
        <div className="flex items-center justify-center p-6 min-h-[80vh]">
          <div className="bg-gray-50 rounded-lg shadow p-8 max-w-md w-full text-center border border-gray-200">
            <Sparkles className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In to Continue</h2>
            <p className="text-gray-600 mb-6">
              Sign in with Google to create or join study rooms and collaborate with friends
            </p>
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="p-6 bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <Home className="w-5 h-5" />
            <span className="font-semibold">Home</span>
          </Link>
          <AuthButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
            <Users className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Study Together with Friends
          </h1>
          <p className="text-xl text-gray-600">
            Create a study room or join an existing one to learn together with AI tutoring
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center mb-6">
              <Plus className="w-8 h-8 text-gray-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Create New Room</h2>
            <p className="text-gray-600 mb-6">
              Start a new study session and invite your friends to join
            </p>
            <button
              onClick={createRoom}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
            >
              Create Room
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Join Room */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-gray-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Join Existing Room</h2>
            <p className="text-gray-600 mb-6">
              Enter a room code to join your friends' study session
            </p>
            <div className="space-y-3">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                placeholder="Enter room code"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <button
                onClick={joinRoom}
                disabled={!roomCode.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Why Study Together?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Collaborative Learning</h4>
              <p className="text-sm text-gray-600">
                Learn together with friends in real-time
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">AI Tutor for All</h4>
              <p className="text-sm text-gray-600">
                Everyone gets help from the same AI tutor
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Easy Sharing</h4>
              <p className="text-sm text-gray-600">
                Share room link with one click
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
