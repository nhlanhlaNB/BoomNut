import { NextRequest, NextResponse } from 'next/server';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

type ChatSession = {
  id?: string;
  userId: string;
  subject: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  title?: string;
};

const FIREBASE_DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://tutapp-88bf0-default-rtdb.firebaseio.com';

// GET - Retrieve chat history for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // If looking for specific session
    if (sessionId) {
      const response = await fetch(`${FIREBASE_DB_URL}/tutorChats/${sessionId}.json`);
      
      if (!response.ok) {
        console.error(`[TUTOR CHAT HISTORY] Failed to fetch session: ${response.status}`);
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
      }

      const session = await response.json();
      
      if (!session || session.userId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      return NextResponse.json({ session: { id: sessionId, ...session } });
    }

    // Get all sessions for user
    const response = await fetch(`${FIREBASE_DB_URL}/tutorChats.json`);
    
    if (!response.ok) {
      console.error(`[TUTOR CHAT HISTORY] Failed to fetch sessions: ${response.status}`);
      return NextResponse.json({ sessions: [] });
    }

    const allSessions = await response.json();
    const sessions: (ChatSession & { id: string })[] = [];

    if (allSessions && typeof allSessions === 'object') {
      Object.entries(allSessions).forEach(([key, value]: [string, any]) => {
        if (value && value.userId === userId) {
          sessions.push({
            id: key,
            ...value,
          });
        }
      });
    }

    // Sort by most recent first
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);

    console.log(`[TUTOR CHAT HISTORY] Retrieved ${sessions.length} sessions for user ${userId}`);
    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('[TUTOR CHAT HISTORY] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve chat history', sessions: [] },
      { status: 200 } // Return 200 even on error to prevent client retry loops
    );
  }
}

// POST - Save a new chat message or create session
export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, subject, messages, title } = await request.json();

    if (!userId || !subject || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'userId, subject, and messages array are required' },
        { status: 400 }
      );
    }

    const now = Date.now();

    // Create or update session
    if (sessionId) {
      // Update existing session - verify ownership first
      const checkResponse = await fetch(`${FIREBASE_DB_URL}/tutorChats/${sessionId}.json`);
      
      if (!checkResponse.ok) {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
      }

      const session = await checkResponse.json();
      if (!session || session.userId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Update using PATCH
      const updateData = {
        messages,
        updatedAt: now,
        ...(title && { title }),
      };

      const patchResponse = await fetch(`${FIREBASE_DB_URL}/tutorChats/${sessionId}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!patchResponse.ok) {
        throw new Error(`Failed to update session: ${patchResponse.statusText}`);
      }

      console.log(`[TUTOR CHAT HISTORY] Updated session ${sessionId}`);
      return NextResponse.json({ sessionId });
    } else {
      // Create new session with generated ID
      const newSessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newSession: ChatSession = {
        userId,
        subject,
        messages,
        createdAt: now,
        updatedAt: now,
        title: title || `${subject} Chat`,
      };

      const putResponse = await fetch(`${FIREBASE_DB_URL}/tutorChats/${newSessionId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      });

      if (!putResponse.ok) {
        throw new Error(`Failed to create session: ${putResponse.statusText}`);
      }

      console.log(`[TUTOR CHAT HISTORY] Created new session ${newSessionId}`);
      return NextResponse.json({ sessionId: newSessionId, session: newSession });
    }
  } catch (error: any) {
    console.error('[TUTOR CHAT HISTORY] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save chat history' },
      { status: 200 } // Return 200 to prevent client retry loops
    );
  }
}

// DELETE - Remove a chat session
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'userId and sessionId are required' }, { status: 400 });
    }

    // Verify ownership first
    const checkResponse = await fetch(`${FIREBASE_DB_URL}/tutorChats/${sessionId}.json`);
    
    if (!checkResponse.ok) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    const session = await checkResponse.json();
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the session
    const deleteResponse = await fetch(`${FIREBASE_DB_URL}/tutorChats/${sessionId}.json`, {
      method: 'DELETE',
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete session: ${deleteResponse.statusText}`);
    }

    console.log(`[TUTOR CHAT HISTORY] Deleted session ${sessionId}`);
    return NextResponse.json({ message: 'Chat session deleted' });
  } catch (error: any) {
    console.error('[TUTOR CHAT HISTORY] DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete chat session' },
      { status: 200 } // Return 200 to prevent client retry loops
    );
  }
}
