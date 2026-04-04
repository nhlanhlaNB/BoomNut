import { NextRequest, NextResponse } from 'next/server';
import { ref, push, get, remove } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

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

// GET - Retrieve chat history for a user
export async function GET(request: NextRequest) {
  try {
    if (!rtdb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const userId = request.nextUrl.searchParams.get('userId');
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const tutorChatsRef = ref(rtdb, 'tutorChats');

    // If looking for specific session
    if (sessionId) {
      const snapshot = await get(ref(rtdb, `tutorChats/${sessionId}`));
      if (!snapshot.exists()) {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
      }

      const session = snapshot.val();
      if (session.userId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      return NextResponse.json({ session: { id: sessionId, ...session } });
    }

    // Get all sessions for user - iterate through all and filter
    const snapshot = await get(tutorChatsRef);
    const sessions: (ChatSession & { id: string })[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const session = child.val();
        if (session.userId === userId) {
          sessions.push({
            id: child.key!,
            ...session,
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
      { error: error.message || 'Failed to retrieve chat history' },
      { status: 500 }
    );
  }
}

// POST - Save a new chat message or create session
export async function POST(request: NextRequest) {
  try {
    if (!rtdb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

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
      // Update existing session
      const sessionRef = ref(rtdb, `tutorChats/${sessionId}`);
      const snapshot = await get(sessionRef);

      if (!snapshot.exists()) {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
      }

      const session = snapshot.val();
      if (session.userId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Update using REST API (Firebase SDK update doesn't work in server context reliably)
      const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
      if (!databaseURL) {
        throw new Error('Firebase database URL not configured');
      }

      const updateData = {
        messages,
        updatedAt: now,
        ...(title && { title }),
      };

      const patchResponse = await fetch(`${databaseURL}/tutorChats/${sessionId}.json`, {
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
      // Create new session
      const newSession: ChatSession = {
        userId,
        subject,
        messages,
        createdAt: now,
        updatedAt: now,
        title: title || `${subject} Chat`,
      };

      const tutorChatsRef = ref(rtdb, 'tutorChats');
      const newSessionRef = push(tutorChatsRef, newSession);

      console.log(`[TUTOR CHAT HISTORY] Created new session ${newSessionRef.key}`);
      return NextResponse.json({ sessionId: newSessionRef.key!, session: newSession });
    }
  } catch (error: any) {
    console.error('[TUTOR CHAT HISTORY] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save chat history' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a chat session
export async function DELETE(request: NextRequest) {
  try {
    if (!rtdb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const userId = request.nextUrl.searchParams.get('userId');
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'userId and sessionId are required' }, { status: 400 });
    }

    const sessionRef = ref(rtdb, `tutorChats/${sessionId}`);
    const snapshot = await get(sessionRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    const session = snapshot.val();
    if (session.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await remove(sessionRef);

    console.log(`[TUTOR CHAT HISTORY] Deleted session ${sessionId}`);
    return NextResponse.json({ message: 'Chat session deleted' });
  } catch (error: any) {
    console.error('[TUTOR CHAT HISTORY] DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}
