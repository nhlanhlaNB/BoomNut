import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Join or manage room
export async function POST(req: NextRequest) {
  try {
    const { params } = await req.json();
    const roomId = params?.roomId;
    const { userId, action } = await req.json(); // join, leave, invite

    if (!roomId || !userId || !action) {
      return NextResponse.json(
        { error: 'Room ID, user ID, and action required' },
        { status: 400 }
      );
    }

    // In a real app, handle database operations
    return NextResponse.json({
      success: true,
      message: `Successfully ${action}ed room`,
    });
  } catch (error: any) {
    console.error('Study room action error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform action' },
      { status: 500 }
    );
  }
}

// Get room details
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID required' },
        { status: 400 }
      );
    }

    // Mock room details
    const roomDetails = {
      id: roomId,
      name: 'Advanced Calculus Study Group',
      subject: 'Mathematics',
      description: 'Daily problem-solving sessions',
      isPublic: true,
      members: [
        {
          id: 'user_1',
          name: 'John Doe',
          role: 'owner',
          joinedAt: new Date().toISOString(),
        },
        {
          id: 'user_2',
          name: 'Jane Smith',
          role: 'member',
          joinedAt: new Date().toISOString(),
        },
      ],
      resources: [
        {
          id: 'res_1',
          type: 'flashcard',
          title: 'Derivatives Flashcards',
          createdBy: 'John Doe',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'res_2',
          type: 'quiz',
          title: 'Integration Practice Quiz',
          createdBy: 'Jane Smith',
          createdAt: new Date().toISOString(),
        },
      ],
      recentActivity: [
        {
          user: 'John Doe',
          action: 'added flashcards',
          timestamp: new Date().toISOString(),
        },
        {
          user: 'Jane Smith',
          action: 'completed quiz',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return NextResponse.json(roomDetails);
  } catch (error: any) {
    console.error('Fetch room details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch room details' },
      { status: 500 }
    );
  }
}

// Share resource to room
export async function PUT(req: NextRequest) {
  try {
    const { roomId, resourceType, resourceId, title, userId } = await req.json();

    if (!roomId || !resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'Room ID, resource type, and resource ID required' },
        { status: 400 }
      );
    }

    // In a real app, save to database
    return NextResponse.json({
      success: true,
      message: 'Resource shared successfully',
    });
  } catch (error: any) {
    console.error('Share resource error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to share resource' },
      { status: 500 }
    );
  }
}
