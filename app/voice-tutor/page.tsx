'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Volume2, VolumeX, Settings, AlertCircle, CheckCircle, Loader, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import PaywallModal from '@/components/PaywallModal';

export default function VoiceTutorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isActive } = useSubscription();

  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [currentSpeaking, setCurrentSpeaking] = useState<'user' | 'assistant' | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPressingButton, setIsPressingButton] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const FREE_MESSAGE_LIMIT = 2;

  // Check authentication on mount
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  // Fetch message usage from database on load
  useEffect(() => {
    if (!user || isActive) return; // Don't track for paid users

    const fetchUsage = async () => {
      try {
        const response = await fetch(`/api/usage/track?userId=${user.uid}&appName=voiceTutor`);
        if (response.ok) {
          const data = await response.json();
          setMessageCount(data.messageCount);
          console.log('[VOICE TUTOR] Loaded usage:', data);
        }
      } catch (error) {
        console.error('[VOICE TUTOR] Error fetching usage:', error);
      }
    };

    fetchUsage();
  }, [user, isActive]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingAudioRef = useRef(false);

  // Check if browser supports required APIs
  const [browserSupport, setBrowserSupport] = useState({
    mediaRecorder: false,
    speechRecognition: false,
    audioContext: false,
  });

  useEffect(() => {
    // Check browser capabilities
    setBrowserSupport({
      mediaRecorder: typeof MediaRecorder !== 'undefined',
      speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      audioContext: typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined',
    });

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Changed to false for better turn-taking
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        if (event.results[event.results.length - 1].isFinal) {
          handleUserSpeech(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Auto-restart if error occurred while session is active
        if (isConnected && !isTutorSpeaking && event.error !== 'aborted') {
          setTimeout(() => startListening(), 1000);
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart recognition when it ends (unless tutor is speaking)
        if (isConnected && !isTutorSpeaking) {
          setTimeout(() => startListening(), 500);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPressingButton) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPressingButton]);

  const startListening = () => {
    if (recognitionRef.current && !isTutorSpeaking && isConnected) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setCurrentSpeaking('user');
      } catch (error: any) {
        // Ignore if already started
        if (error.message.includes('already started')) {
          return;
        }
        console.error('Error starting recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        setCurrentSpeaking(null);
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  };

  const handleUserSpeech = async (text: string) => {
    // Only process if there's actual content
    if (!text || text.trim().length === 0) return;
    
    // Check free tier message limit
    if (!isActive && messageCount >= FREE_MESSAGE_LIMIT) {
      setShowPaywall(true);
      setIsListening(false);
      return;
    }
    
    // Stop listening while processing
    stopListening();
    
    setTranscript(prev => [...prev, { role: 'user', content: text }]);
    setCurrentSpeaking(null);
    
    // Track usage for free tier users
    if (!isActive && user) {
      try {
        const trackResponse = await fetch('/api/usage/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            appName: 'voiceTutor'
          })
        });
        
        if (trackResponse.ok) {
          const trackData = await trackResponse.json();
          setMessageCount(trackData.messageCount);
          console.log('[VOICE TUTOR] Usage tracked:', trackData);
        }
      } catch (error) {
        console.error('[VOICE TUTOR] Error tracking usage:', error);
      }
    }
    
    // Send to AI tutor
    await getAIResponse(text);
  };

  const getAIResponse = async (userMessage: string) => {
    try {
      setIsLoading(true);
      setIsTutorSpeaking(true);
      setCurrentSpeaking('assistant');

      // Build conversation history for context
      const conversationHistory = transcript.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful, patient tutor. Keep your responses conversational and concise (2-3 sentences). Speak naturally as if having a real conversation. Ask follow-up questions to keep the discussion engaging.'
            },
            ...conversationHistory,
            { role: 'user', content: userMessage }
          ],
          subject: 'General',
          uploadedFiles: [],
        }),
      });

      const data = await response.json();
      
      if (data.response) {
        setTranscript(prev => [...prev, { role: 'assistant', content: data.response }]);
        
        // Speak the response (this will manage turn-taking)
        if (!isMuted) {
          await speakText(data.response);
        } else {
          // If muted, still need to signal turn is over
          setIsTutorSpeaking(false);
          setCurrentSpeaking(null);
          // Restart listening after a brief pause
          setTimeout(() => startListening(), 500);
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError('Failed to get response from AI tutor');
      setIsTutorSpeaking(false);
      setCurrentSpeaking(null);
      // Restart listening after error
      setTimeout(() => startListening(), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (text: string) => {
    return new Promise<void>(async (resolve) => {
      try {
        // Stop listening while tutor speaks
        stopListening();
        
        // Use Azure Speech Services TTS API
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: 'en-US-AriaNeural' }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          // Store reference to current audio
          currentAudioRef.current = audio;
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            setIsTutorSpeaking(false);
            setCurrentSpeaking(null);
            
            // Add natural pause before listening again (feels more human)
            setTimeout(() => {
              if (isConnected) {
                startListening();
              }
              resolve();
            }, 800); // 800ms pause for natural conversation flow
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            setIsTutorSpeaking(false);
            setCurrentSpeaking(null);
            setTimeout(() => {
              if (isConnected) {
                startListening();
              }
              resolve();
            }, 500);
          };
          
          await audio.play();
        } else {
          // If TTS fails, still manage turn-taking
          setIsTutorSpeaking(false);
          setCurrentSpeaking(null);
          setTimeout(() => {
            if (isConnected) {
              startListening();
            }
            resolve();
          }, 500);
        }
      } catch (error) {
        console.error('Error speaking text:', error);
        setIsTutorSpeaking(false);
        setCurrentSpeaking(null);
        setTimeout(() => {
          if (isConnected) {
            startListening();
          }
          resolve();
        }, 500);
      }
    });
  };

  const startVoiceSession = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsConnected(true);
      setIsRecording(true);
      setIsTutorSpeaking(true);
      
      // Add welcome message
      const welcomeMessage = "Hi! I'm your AI tutor. What would you like to learn about today?";
      setTranscript([{ 
        role: 'assistant', 
        content: welcomeMessage
      }]);
      
      // Speak welcome message first, then start listening
      if (!isMuted) {
        await speakText(welcomeMessage);
      } else {
        // If muted, start listening immediately
        setIsTutorSpeaking(false);
        setTimeout(() => startListening(), 500);
      }

    } catch (error: any) {
      console.error('Error starting voice session:', error);
      setError(error.message || 'Failed to start voice session. Please check microphone permissions.');
      setIsConnected(false);
      setIsRecording(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopVoiceSession = () => {
    // Stop any ongoing speech recognition
    stopListening();
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    setIsRecording(false);
    setIsConnected(false);
    setCurrentSpeaking(null);
    setIsTutorSpeaking(false);
    setIsListening(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const clearTranscript = () => {
    setTranscript([]);
  };

  const startPressToSpeak = async () => {
    try {
      // Don't start if tutor is speaking or already recording
      if (isTutorSpeaking || isPressingButton) return;

      // First, try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      console.log('[Voice] Microphone stream acquired');

      // Use Web Audio API for better control
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const source = audioContext.createMediaStreamSource(stream);
      const audioData: Float32Array[] = [];

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        audioData.push(new Float32Array(inputData));
        console.log('[Voice] Captured audio chunk, total chunks:', audioData.length);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Store references
      mediaRecorderRef.current = {
        stream,
        audioContext,
        processor,
        source,
        audioData,
        state: 'recording'
      } as any;

      setIsPressingButton(true);
      setCurrentSpeaking('user');
      setError(null);
      console.log('[Voice] Started recording with Web Audio API');
    } catch (error: any) {
      console.error('[Voice] Error starting press-to-speak:', error);
      setError(`Microphone error: ${error.message}`);
      setIsPressingButton(false);
    }
  };

  const stopPressToSpeak = async () => {
    if (!mediaRecorderRef.current || (mediaRecorderRef.current as any).state === 'inactive') return;

    try {
      console.log('[Voice] Stopping recording...');
      
      const ref = mediaRecorderRef.current as any;
      const { stream, audioContext, processor, source, audioData } = ref;

      // Mark as inactive immediately to prevent double calls
      ref.state = 'inactive';

      // Stop the stream and processors
      source.disconnect();
      processor.disconnect();
      stream.getTracks().forEach((track: any) => track.stop());
      
      // Close audio context safely
      try {
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
      } catch (e) {
        console.warn('[Voice] Audio context close error:', e);
      }

      console.log(`[Voice] Recording stopped. Captured ${audioData.length} chunks`);

      if (audioData.length === 0) {
        console.error('[Voice] No audio data captured');
        setError('No audio captured. Please speak louder or check microphone.');
        setIsPressingButton(false);
        return;
      }

      // Convert audio data to WAV format
      const wavBlob = encodeWAV(audioData, audioContext.sampleRate);
      console.log('[Voice] WAV blob created:', wavBlob.size, 'bytes');

      // Send to transcription API
      const formData = new FormData();
      formData.append('audio', wavBlob, 'audio.wav');

      console.log('[Voice] Sending audio to transcribe API...');
      setIsLoading(true);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      console.log('[Voice] Transcribe response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('[Voice] API error response:', text);
        throw new Error(`API returned ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log('[Voice] Transcribed text:', data.transcript);

      if (data.transcript && data.transcript.trim().length > 0) {
        setCurrentSpeaking('user');
        setIsPressingButton(false);
        setRecordingTime(0);
        await handleUserSpeech(data.transcript);
      } else {
        setError('No speech detected. Please speak clearly and try again.');
        setIsPressingButton(false);
        setRecordingTime(0);
      }
    } catch (error: any) {
      console.error('[Voice] Error in stopPressToSpeak:', error);
      setError(`Error: ${error.message || 'Failed to process audio'}`);
      setIsPressingButton(false);
      setRecordingTime(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to encode audio data to WAV format
  const encodeWAV = (audioData: Float32Array[], sampleRate: number): Blob => {
    const channelData = audioData;
    const length = channelData.reduce((sum, arr) => sum + arr.length, 0);
    const audioBuffer = new Float32Array(length);
    let offset = 0;
    for (const data of channelData) {
      audioBuffer.set(data, offset);
      offset += data.length;
    }

    // Convert to PCM16
    const pcm = new Int16Array(audioBuffer.length);
    for (let i = 0; i < audioBuffer.length; i++) {
      const s = Math.max(-1, Math.min(1, audioBuffer[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Create WAV header
    const wavHeader = createWavHeader(pcm.length * 2, sampleRate);
    const blob = new Blob([wavHeader, pcm.buffer], { type: 'audio/wav' });
    return blob;
  };

  // Helper to create WAV file header
  const createWavHeader = (audioLength: number, sampleRate: number): ArrayBuffer => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    const channels = 1;
    const bitDepth = 16;

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + audioLength, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, channels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate
    view.setUint32(28, sampleRate * 2 * channels, true);
    // block-align
    view.setUint16(32, channels * bitDepth / 8, true);
    // bits per sample
    view.setUint16(34, bitDepth, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, audioLength, true);

    return buffer;
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Voice Tutor
          </h1>
          <p className="text-gray-600">
            Have a real-time voice conversation with your AI tutor
          </p>
        </div>

        {/* Browser Support Warning */}
        {(!browserSupport.speechRecognition || !browserSupport.audioContext) && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-800 mb-2">Browser Compatibility</h3>
                <p className="text-yellow-700 mb-2">
                  For the best experience, please use Google Chrome, Microsoft Edge, or Safari.
                </p>
                <ul className="text-sm text-yellow-600 list-disc list-inside">
                  {!browserSupport.speechRecognition && <li>Speech recognition not supported</li>}
                  {!browserSupport.audioContext && <li>Audio playback not supported</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 sticky top-6">
              {/* Status */}
              <div className="mb-6">
                <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-full w-full justify-center ${
                  isConnected 
                    ? 'bg-green-100 border-2 border-green-300' 
                    : 'bg-gray-100 border-2 border-gray-300'
                }`}>
                  {isConnected ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-semibold text-green-700">Connected</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      <span className="font-semibold text-gray-600">Offline</span>
                    </>
                  )}
                </div>
              </div>

              {/* Speaking Indicator */}
              {(isListening || isTutorSpeaking || isLoading) && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-blue-700">
                      {isTutorSpeaking ? '🤖 Tutor speaking...' : 
                       isLoading ? '💭 Thinking...' :
                       isListening ? '🎤 Listening to you...' : '⏳ Processing...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Free tier usage indicator */}
              {!isActive && user && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        Free Plan: {messageCount}/{FREE_MESSAGE_LIMIT} messages used
                      </span>
                    </div>
                    <a
                      href="/pricing"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      Upgrade
                    </a>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="space-y-3">
                <button
                  onClick={isRecording ? stopVoiceSession : startVoiceSession}
                  disabled={isLoading}
                  className={`flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all w-full ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                      : 'bg-gray-900 hover:bg-gray-800 text-white shadow-md'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : isRecording ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      End Session
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Start Voice Tutor
                    </>
                  )}
                </button>

                {/* Press to Speak Button */}
                {isRecording && (
                  <div className="space-y-2">
                    <button
                      onMouseDown={startPressToSpeak}
                      onMouseUp={stopPressToSpeak}
                      onMouseLeave={stopPressToSpeak}
                      onTouchStart={startPressToSpeak}
                      onTouchEnd={stopPressToSpeak}
                      disabled={isTutorSpeaking || isLoading}
                      className={`flex flex-col items-center justify-center gap-2 w-full py-8 px-4 rounded-xl font-bold transition-all text-lg ${
                        isLoading
                          ? 'bg-yellow-500 text-white shadow-lg'
                          : isPressingButton
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg scale-95'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                    >
                      {isLoading ? (
                        <>
                          <Loader className="w-8 h-8 animate-spin" />
                          <span>Processing speech...</span>
                        </>
                      ) : isPressingButton ? (
                        <>
                          <Mic className="w-8 h-8" />
                          <span>Hold & Speak...</span>
                          <span className="text-sm font-normal">{recordingTime.toFixed(1)}s</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-8 h-8" />
                          <span>Press to Speak</span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      {isLoading ? '⏳ Wait for transcription...' : 'Hold button • Speak • Release to send'}
                    </p>
                  </div>
                )}

                <button
                  onClick={toggleMute}
                  disabled={!isRecording}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  {isMuted ? 'Unmuted' : 'Mute Tutor'}
                </button>

                <button
                  onClick={clearTranscript}
                  disabled={transcript.length === 0}
                  className="px-6 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Clear Transcript
                </button>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">💡 Tips:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Speak clearly into your microphone</li>
                  <li>• The tutor guides with questions</li>
                  <li>• Ask for hints if you're stuck</li>
                  <li>• Works best in Chrome/Edge</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Conversation Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 min-h-[600px] flex flex-col">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Conversation</h2>
              
              {/* Transcript */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {transcript.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Mic className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg">Click "Start Voice Tutor" to begin</p>
                      <p className="text-sm mt-2">Your conversation will appear here</p>
                    </div>
                  </div>
                ) : (
                  transcript.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-gray-200 text-gray-900'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">
                            {msg.role === 'user' ? '👤 You' : '🤖 Tutor'}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Example Questions */}
              {transcript.length === 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">Try asking:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Explain photosynthesis',
                      'Help with algebra',
                      'What is DNA?',
                      'How does gravity work?',
                    ].map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => isRecording && handleUserSpeech(question)}
                        disabled={!isRecording}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 text-left disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-3xl mb-2">🎤</div>
            <h3 className="font-bold text-sm mb-1">Real-time Voice</h3>
            <p className="text-xs text-gray-600">Natural conversation with speech recognition</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-3xl mb-2">🧠</div>
            <h3 className="font-bold text-sm mb-1">Socratic Method</h3>
            <p className="text-xs text-gray-600">Learn through guided questions</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-3xl mb-2">🔊</div>
            <h3 className="font-bold text-sm mb-1">Voice Responses</h3>
            <p className="text-xs text-gray-600">Hear the tutor speak back to you</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-bold text-sm mb-1">Live Transcript</h3>
            <p className="text-xs text-gray-600">See the conversation in text</p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Voice Tutor
          </h1>
          <p className="text-gray-600">
            Real-time voice conversation powered by Azure AI
          </p>
        </div>

        {/* Setup Instructions */}
        {showSetup && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-yellow-600" />
                <h2 className="text-xl font-bold text-yellow-800">Setup Required</h2>
              </div>
              <button
                onClick={() => setShowSetup(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">🚀 Quick Start Guide</h3>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Open a terminal and navigate to: <code className="bg-gray-100 px-2 py-1 rounded">voice-tutor/</code></li>
                  <li>Create Python virtual environment:
                    <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto">
python -m venv venv{'\n'}
# Windows: venv\Scripts\activate{'\n'}
# Mac/Linux: source venv/bin/activate
                    </pre>
                  </li>
                  <li>Install dependencies:
                    <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2">pip install -r requirements.txt</pre>
                  </li>
                  <li>Configure Azure credentials:
                    <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto">
copy .env.example .env{'\n'}
# Edit .env with your Azure credentials
                    </pre>
                  </li>
                  <li>Start the voice tutor:
                    <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2">python voice_tutor.py</pre>
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Azure Credentials Needed</h3>
                <ul className="list-disc list-inside space-y-1 text-blue-800 ml-2">
                  <li>AZURE_VOICELIVE_ENDPOINT</li>
                  <li>AZURE_VOICELIVE_API_KEY</li>
                  <li>AZURE_VOICELIVE_MODEL (e.g., gpt-4o)</li>
                </ul>
                <p className="mt-2 text-sm text-blue-700">
                  Get these from: Azure Portal → Your Resource → Keys and Endpoint
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">💡 How It Works</h3>
                <p className="text-green-800">
                  The voice tutor runs as a standalone Python application that connects directly
                  to Azure's Voice Live API. It captures your microphone audio, sends it to Azure,
                  and plays back the AI tutor's voice responses in real-time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Interface */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-100">
          {/* Status Display */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${
              isRecording 
                ? 'bg-green-100 border-2 border-green-300' 
                : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              {isRecording ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-semibold text-green-700">Voice Tutor Active</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                  <span className="font-semibold text-gray-600">Tutor Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setIsRecording(!isRecording)}
              disabled
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5" />
                  Stop Session
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Voice Tutor
                </>
              )}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              disabled
              className="flex items-center gap-2 px-6 py-4 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
            <h3 className="font-bold text-lg mb-3 text-gray-800">🎯 Using the Voice Tutor</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold mb-2">✨ Features:</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Real-time voice conversation</li>
                  <li>Socratic teaching method</li>
                  <li>Natural interruptions</li>
                  <li>Noise suppression</li>
                  <li>Echo cancellation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">💬 Example Questions:</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>"Explain photosynthesis"</li>
                  <li>"Help me with quadratic equations"</li>
                  <li>"What is quantum mechanics?"</li>
                  <li>"How does DNA work?"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal 
          feature="unlimited-voice-tutor"
          featureName="Unlimited Voice Tutor Chat"
          requiredPlan="pro"
        />
      )}
    </div>
  );
}
