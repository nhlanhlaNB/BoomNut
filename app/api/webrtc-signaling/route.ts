import { NextRequest, NextResponse } from 'next/server';

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastus';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

/**
 * WebRTC Signaling Server for Azure Speech Services
 * Handles SDP offer/answer exchange and ICE candidate signaling
 */
export async function POST(request: NextRequest) {
  try {
    if (!AZURE_SPEECH_KEY) {
      return NextResponse.json(
        { error: 'Azure Speech key not configured' },
        { status: 500 }
      );
    }

    const message: SignalingMessage = await request.json();

    switch (message.type) {
      case 'offer':
        return handleOffer(message);
      
      case 'ice-candidate':
        return handleIceCandidate(message);
      
      default:
        return NextResponse.json(
          { error: 'Unknown message type' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('WebRTC signaling error:', error);
    return NextResponse.json(
      { error: error.message || 'Signaling failed' },
      { status: 500 }
    );
  }
}

async function handleOffer(message: SignalingMessage) {
  try {
    // Get Azure Speech SDK token
    const tokenResponse = await fetch(
      `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY!,
        },
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Azure Speech token');
    }

    const token = await tokenResponse.text();

    // Create WebRTC connection with Azure
    // Note: Azure Speech Service WebRTC endpoint
    const azureWebRTCEndpoint = `https://${AZURE_SPEECH_REGION}.convai.speech.microsoft.com/api/webrtc/v1/connect`;

    const response = await fetch(azureWebRTCEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sdp: message.sdp,
        configuration: {
          // Azure Speech configuration
          recognitionMode: 'Conversation',
          language: 'en-US',
          ttsVoice: 'en-US-JennyNeural',
          enableAudioProcessing: true,
          audioProcessing: {
            echoCancellation: true,
            noiseSuppression: true,
            automaticGainControl: true,
          },
          // AI configuration
          systemPrompt: 'You are a patient AI tutor using the Socratic method. Guide students with questions, never give direct answers.',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure WebRTC connection failed: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      answer: data.answer,
      iceServers: data.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

  } catch (error: any) {
    console.error('Error handling offer:', error);
    
    // Fallback: Return a mock answer for development
    return NextResponse.json({
      answer: {
        type: 'answer',
        sdp: 'v=0\r\no=- 0 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\n',
      },
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
      warning: 'Using mock response - configure Azure Speech Service for production',
    });
  }
}

async function handleIceCandidate(message: SignalingMessage) {
  // In a real implementation, you would relay ICE candidates to Azure
  // For now, we acknowledge receipt
  return NextResponse.json({ success: true });
}

/**
 * GET endpoint to check WebRTC signaling server status
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    configured: !!AZURE_SPEECH_KEY,
    region: AZURE_SPEECH_REGION,
    capabilities: [
      'WebRTC signaling',
      'Azure Speech Integration',
      'Real-time audio streaming',
      'Socratic tutoring',
    ],
  });
}
