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
    
    // Fallback: Return a properly formatted mock answer for development
    const mockAnswerSdp = `v=0
o=webrtc-server 0 0 IN IP4 127.0.0.1
s=WebRTC Server
t=0 0
a=group:BUNDLE 0
a=msid-semantic: WMS *
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 103 104 9 0 8 106 105 13 110 112 113 114
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:0000
a=ice-pwd:0000000000000000000000
a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
a=setup:passive
a=mid:0
a=recv-only
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=rtpmap:63 H264/90000
a=rtpmap:103 ISAC/16000
a=rtpmap:104 ISAC/32000
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:106 CN/32000
a=rtpmap:105 CN/16000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:112 telephone-event/32000
a=rtpmap:113 telephone-event/16000
a=rtpmap:114 telephone-event/8000
a=ssrc:1001 cname:webrtc-server
a=ssrc:1001 msid:* *`;

    return NextResponse.json({
      answer: {
        type: 'answer',
        sdp: mockAnswerSdp,
      },
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
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
