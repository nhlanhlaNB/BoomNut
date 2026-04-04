import { NextRequest, NextResponse } from 'next/server';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'start';
  sdp?: any;
  candidate?: any;
}

// Simple in-memory session store for WebRTC connections
const sessions = new Map<string, any>();

/**
 * WebRTC Signaling Server
 * Handles SDP offer/answer exchange for peer-to-peer connections
 */
export async function POST(request: NextRequest) {
  try {
    const message: SignalingMessage = await request.json();

    switch (message.type) {
      case 'start':
        // Start a new WebRTC session
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessions.set(sessionId, {
          createdAt: Date.now(),
          offer: null,
          answer: null,
          iceCandidates: [],
        });
        
        console.log(`[WebRTC Signaling] Started session: ${sessionId}`);
        return NextResponse.json({ sessionId });

      case 'offer':
        // Handle offer from client
        const { sessionId: offerId } = message as any;
        const session = sessions.get(offerId);
        
        if (!session) {
          return NextResponse.json({ error: 'Session not found' }, { status: 400 });
        }

        // Store the offer
        session.offer = message.sdp;
        
        console.log(`[WebRTC Signaling] Received offer for session: ${offerId}`);

        // Generate a simple answer (in production, this would come from the server's peer connection)
        // For now, return a mock answer that acknowledges the connection
        const answer = {
          type: 'answer',
          sdp: `v=0
o=answer 0 0 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
a=extmap-allow-mixed
m=application 9 UDP/TLS/RTP/SAVPF 120
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:${Math.random().toString(36).substr(2, 8)}
a=ice-pwd:${Math.random().toString(36).substr(2, 24)}
a=fingerprint:sha-256 ${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}
a=setup:active
a=mid:0
a=sendrecv`
        };

        session.answer = answer;

        return NextResponse.json({ 
          answer,
          sessionId: offerId 
        });

      case 'ice-candidate':
        // Handle ICE candidates
        const { sessionId: iceSessionId } = message as any;
        const iceSession = sessions.get(iceSessionId);
        
        if (!iceSession) {
          return NextResponse.json({ error: 'Session not found' }, { status: 400 });
        }

        iceSession.iceCandidates.push(message.candidate);
        
        console.log(`[WebRTC Signaling] Received ICE candidate for session: ${iceSessionId}`);

        return NextResponse.json({ 
          success: true,
          sessionId: iceSessionId
        });

      default:
        return NextResponse.json(
          { error: 'Unknown message type' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[WebRTC Signaling] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Signaling failed' },
      { status: 200 } // Return 200 to avoid client retry loops
    );
  }
}

/**
 * GET endpoint to check WebRTC signaling server status
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    activeSessions: sessions.size,
    capabilities: [
      'WebRTC signaling',
      'SDP offer/answer exchange',
      'ICE candidate handling',
      'Real-time communication',
    ],
  });
}
