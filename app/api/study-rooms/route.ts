import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create study room
export async function POST(req: NextRequest) {
  try {
    const { name, subject, description, isPublic, userId, maxMembers } = await req.json();

    if (!name || !subject || !userId) {
      return NextResponse.json(
        { error: 'Name, subject, and user ID required' },
        { status: 400 }
      );
    }

    // In a real app, save to database
    const roomId = `room_${Date.now()}`;

    return NextResponse.json({
      room: {
        id: roomId,
        name,
        subject,
        description,
        isPublic: isPublic || false,
        maxMembers: maxMembers || 10,
        memberCount: 1,
        createdAt: new Date().toISOString(),
      },
      success: true,
    });
  } catch (error: any) {
    console.error('Create study room error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create study room' },
      { status: 500 }
    );
  }
}

// Get study rooms
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'my-rooms', 'public', 'all'

    // Mock data
    const rooms = [
      {
        id: 'room_1',
        name: 'Advanced Calculus Study Group',
        subject: 'Mathematics',
        description: 'Daily problem-solving sessions',
        isPublic: true,
        memberCount: 8,
        maxMembers: 10,
        createdAt: new Date().toISOString(),
        resources: {
          flashcards: 45,
          quizzes: 12,
          notes: 23,
        },
      },
      {
        id: 'room_2',
        name: 'Physics Lab Prep',
        subject: 'Physics',
        description: 'Preparing for lab practicals',
        isPublic: false,
        memberCount: 5,
        maxMembers: 6,
        createdAt: new Date().toISOString(),
        resources: {
          flashcards: 30,
          quizzes: 8,
          notes: 15,
        },
      },
    ];

    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error('Fetch study rooms error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch study rooms' },
      { status: 500 }
    );
  }
}
