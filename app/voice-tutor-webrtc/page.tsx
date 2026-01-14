'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader, Phone, PhoneOff } from 'lucide-react';

export default function WebRTCVoiceTutorPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'speaking' | 'listening'>('idle');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      disconnectWebRTC();
    };
  }, []);

  const connectWebRTC = async () => {
    try {
      setIsLoading(true);
      setStatus('connecting');
      setError(null);

      // Get user media (microphone)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        } 
      });
      localStreamRef.current = stream;

      // Create RTCPeerConnection
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Create data channel for text messages
      const dataChannel = peerConnection.createDataChannel('chat', {
        ordered: true,
      });
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.log('Data channel opened');
        setIsConnected(true);
        setStatus('connected');
        setIsLoading(false);
        
        // Send initial Socratic tutor prompt
        dataChannel.send(JSON.stringify({
          type: 'system',
          content: 'You are a patient AI tutor using the Socratic method. Guide students with questions, never give direct answers.',
        }));
      };

      dataChannel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript') {
            setTranscript(prev => [...prev, { role: data.role, content: data.content }]);
          } else if (data.type === 'status') {
            setStatus(data.status);
          }
        } catch (error) {
          console.error('Error parsing data channel message:', error);
        }
      };

      dataChannel.onerror = (error) => {
        console.error('Data channel error:', error);
        setError('Communication error occurred');
      };

      dataChannel.onclose = () => {
        console.log('Data channel closed');
        setIsConnected(false);
        setStatus('idle');
      };

      // Handle incoming audio stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote track');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(e => console.error('Error playing audio:', e));
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          // Send ICE candidate to signaling server
          await sendToSignalingServer({
            type: 'ice-candidate',
            candidate: event.candidate,
          });
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'failed' || 
            peerConnection.iceConnectionState === 'disconnected') {
          setError('Connection lost. Please reconnect.');
          disconnectWebRTC();
        }
      };

      // Create and send offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await peerConnection.setLocalDescription(offer);

      // Send offer to signaling server
      const response = await sendToSignalingServer({
        type: 'offer',
        sdp: offer,
      });

      if (response.answer) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(response.answer)
        );
      }

    } catch (error: any) {
      console.error('Error connecting WebRTC:', error);
      setError(error.message || 'Failed to connect');
      setIsLoading(false);
      setStatus('idle');
      disconnectWebRTC();
    }
  };

  const sendToSignalingServer = async (data: any) => {
    const response = await fetch('/api/webrtc-signaling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Signaling server error');
    }

    return response.json();
  };

  const disconnectWebRTC = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsConnected(false);
    setStatus('idle');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            WebRTC Voice Tutor
          </h1>
          <p className="text-gray-600">Real-time voice conversations with AI using WebRTC</p>
        </div>

        {/* Main Container */}
        <div className="max-w-4xl mx-auto">
          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'connected' ? 'bg-green-500 animate-pulse' :
                  status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-gray-300'
                }`} />
                <span className="font-medium text-gray-700 capitalize">{status}</span>
              </div>
              
              {isConnected && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className={`p-2 rounded-lg transition-colors ${
                      isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-4">
              {!isConnected ? (
                <button
                  onClick={connectWebRTC}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-6 h-6 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-6 h-6" />
                      <span>Start Voice Tutor</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={disconnectWebRTC}
                  className="flex items-center space-x-2 px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <PhoneOff className="w-6 h-6" />
                  <span>End Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Transcript */}
          {transcript.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Conversation</h2>
                <button
                  onClick={clearTranscript}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transcript.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1 opacity-70">
                        {msg.role === 'user' ? 'You' : 'AI Tutor'}
                      </p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Use</h3>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Click "Start Voice Tutor" to connect</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Allow microphone access when prompted</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Start speaking - the AI will respond naturally</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Use the mute button to temporarily disable your mic</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Hidden audio element for remote stream */}
        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </div>
  );
}
