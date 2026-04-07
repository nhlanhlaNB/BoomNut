'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, FileText, Download, Loader, Copy, Check, Sparkles, AlertCircle, Info, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import PaywallModal from './PaywallModal';
import LectureSlidesViewer, { Slide } from './LectureSlidesViewer';

export default function LiveLectureRecorder() {
  const { user } = useAuth();
  const { isActive } = useSubscription();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [notes, setNotes] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [showSlides, setShowSlides] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const FREE_LIMIT = 2;
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isStartingListeningRef = useRef(false);

  // Fetch usage on mount
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user || isActive) return;

      try {
        const response = await fetch(`/api/usage/track?userId=${user.uid}&appName=live-lecture`);
        if (response.ok) {
          const data = await response.json();
          setUsageCount(data.messageCount || 0);
        }
      } catch (error) {
        console.error('Error fetching usage:', error);
      }
    };

    fetchUsage();
  }, [user, isActive]);

  // Initialize Speech Recognition - EXACT VOICE TUTOR LOGIC
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Continuous for lecture recording
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        // Show transcription in real-time
        if (isRecording) {
          setTranscription((prev) => {
            if (event.results[event.results.length - 1].isFinal) {
              return prev + (prev ? ' ' : '') + transcript;
            }
            return prev;
          });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('[Live Lecture] Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        // Auto-restart if error occurred while session is active
        if (isRecording && event.error !== 'aborted') {
          setTimeout(() => {
            console.log('[Live Lecture] Auto-restarting after error');
            startListening();
          }, 1000);
        }
      };

      recognitionRef.current.onstart = () => {
        console.log('[Live Lecture] Speech recognition started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onend = () => {
        console.log('[Live Lecture] Speech recognition ended');
        // Don't auto-restart - let the flow control this explicitly
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('[Live Lecture] Error stopping recognition:', err);
        }
      }
    };
  }, []);

  // Helper function to start listening
  const startListening = () => {
    // Prevent multiple simultaneous calls
    if (isStartingListeningRef.current) {
      console.log('[Live Lecture] Already starting/listening - canceling duplicate call');
      return;
    }

    if (recognitionRef.current && isRecording) {
      try {
        isStartingListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
        console.log('[Live Lecture] Started listening');
      } catch (error: any) {
        isStartingListeningRef.current = false;
        // Ignore if already started
        if (error.message && error.message.includes('already started')) {
          console.log('[Live Lecture] Recognition already active');
          setIsListening(true);
          return;
        }
        console.error('Error starting recognition:', error);
      }
    }
  };

  // Helper function to stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        isStartingListeningRef.current = false;
        setIsListening(false);
        console.log('[Live Lecture] Stopped listening');
      } catch (error) {
        console.error('Error stopping recognition:', error);
        isStartingListeningRef.current = false;
      }
    }
  };

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    // Check free tier limit
    if (!isActive && usageCount >= FREE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    try {
      setError(null);
      setRecordingTime(0);
      setTranscription('');
      setNotes('');
      setUserInput('');
      setIsRecording(true);

      // Request microphone access first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[Live Lecture] Microphone access granted');
      } catch (err) {
        console.error('[Live Lecture] Microphone access error:', err);
        setError('Please grant microphone permission to start recording');
        setIsRecording(false);
        return;
      }

      // Start listening
      startListening();

      // Track usage for free tier
      if (!isActive && user) {
        try {
          const trackResponse = await fetch('/api/usage/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              appName: 'live-lecture'
            })
          });
          
          if (trackResponse.ok) {
            const trackData = await trackResponse.json();
            setUsageCount(trackData.messageCount);
          }
        } catch (error) {
          console.error('Error tracking usage:', error);
        }
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording. Please ensure your browser has microphone access.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      stopListening();

      // Auto-generate notes from transcription
      if (transcription.trim()) {
        await generateNotes(transcription);
      }
    }
  };

  const generateNotes = async (lectureTrans: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/live-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateNotes',
          transcription: lectureTrans,
        }),
      });

      const data = await response.json();
      if (data.notes) {
        setNotes(data.notes);
        // Auto-generate slides
        await generateSlides(lectureTrans, data.notes);
      }
    } catch (error) {
      console.error('Error generating notes:', error);
      setNotes('Unable to generate notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSlides = async (lectureTrans: string, lectureNotes: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/live-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateSlides',
          transcription: lectureTrans,
          notes: lectureNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate slides');
      }

      const data = await response.json();
      if (data.slides && Array.isArray(data.slides)) {
        setSlides(data.slides);
        setShowSlides(true);
      }
    } catch (error) {
      console.error('Error generating slides:', error);
      // Continue without slides if generation fails
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!userInput.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/live-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateNotes',
          transcription: userInput,
        }),
      });

      const data = await response.json();
      if (data.notes) {
        setNotes(data.notes);
        setTranscription(userInput);
        setUserInput('');
        // Auto-generate slides
        await generateSlides(userInput, data.notes);
      } else {
        setNotes('Unable to generate notes. Please try again.');
        setTranscription(userInput);
        setUserInput('');
      }
    } catch (error) {
      console.error('Error generating notes:', error);
      setNotes('Error generating notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const content = `${notes}\n\n---\n\n${transcription}`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadNotes = () => {
    const content = `LECTURE NOTES\n\n${notes}\n\n---\nFULL TRANSCRIPTION\n\n${transcription}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture_notes_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4 md:p-8">
      {showPaywall && (
        <PaywallModal
          feature="live-lecture"
          featureName="Unlimited Live Lectures"
          requiredPlan="pro"
        />
      )}

      <div className="max-w-5xl mx-auto">
        {/* Usage Indicator */}
        {!isActive && user && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
            usageCount >= FREE_LIMIT
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" style={{ color: usageCount >= FREE_LIMIT ? '#dc2626' : '#2563eb' }} />
              <span className={`text-sm font-medium ${
                usageCount >= FREE_LIMIT ? 'text-red-800' : 'text-blue-800'
              }`}>
                {usageCount >= FREE_LIMIT ? (
                  <>
                    ÔÜá´©Å You've used your {FREE_LIMIT} free recordings today.
                    <a
                      href="/pricing"
                      className="ml-2 font-bold underline text-red-700 hover:text-red-800"
                    >
                      Subscribe to continue ÔåÆ
                    </a>
                  </>
                ) : (
                  <>
                    Free Plan: {usageCount}/{FREE_LIMIT} recordings used today
                    <a
                      href="/pricing"
                      className="ml-2 text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      Upgrade
                    </a>
                  </>
                )}
              </span>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4 inline mr-2" />
            AI-Powered Study Tool
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Live Lecture Notes
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Record your lectures and get instant AI-generated notes with key concepts and summaries
          </p>
        </div>

        {/* Info Box */}
        {!isRecording && !notes && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>How it works:</strong> Click "Start Recording" to record your lecture using your browser's speech recognition. The transcription will appear in real-time. When done, we'll automatically generate organized notes with key concepts and presentation slides.
            </div>
          </div>
        )}

        {/* Main Recording Area */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {!notes ? (
            <div className="text-center">
              {/* Recording Status */}
              {isRecording && (
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    Recording... {formatTime(recordingTime)}
                  </div>
                </div>
              )}

              {/* Large Recording Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`mb-6 w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 shadow-lg'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'
                } text-white disabled:opacity-50`}
              >
                {isRecording ? (
                  <Square className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>

              <p className="text-lg font-semibold text-gray-700 mb-6">
                {isRecording ? 'Stop when finished' : 'Click to start recording'}
              </p>

              {/* Live Transcription Box */}
              {isRecording && (
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
                    <p className="text-sm font-semibold text-blue-700">
                      {isListening ? 'Listening...' : 'Processing...'}
                    </p>
                  </div>
                  <textarea
                    value={transcription}
                    readOnly
                    placeholder="Your speech will appear here..."
                    className="w-full h-32 p-3 border border-blue-200 rounded-lg bg-white text-gray-700 text-sm resize-none focus:outline-none"
                  />
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Alternative Input Method */}
              {!isRecording && !transcription && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">Don't have a recording? Paste transcription here:</p>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Paste your lecture transcription or notes here..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={() => {
                      if (userInput.trim()) {
                        handleGenerateNotes();
                      }
                    }}
                    disabled={loading || !userInput.trim()}
                    className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    Generate Notes
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Generated Notes */}
              {notes && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      AI-Generated Notes
                    </h3>
                    <button
                      onClick={copyToClipboard}
                      className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 max-h-96 overflow-y-auto prose prose-sm max-w-none text-gray-700">
                    {notes.split('\n').map((line, i) => (
                      <p key={i} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcription */}
              {transcription && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Full Transcription</h3>
                  <div className="bg-gray-50 rounded-xl p-6 max-h-48 overflow-y-auto">
                    <p className="text-sm text-gray-700 leading-relaxed">{transcription}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={downloadNotes}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5" />
                  Download as Text
                </button>
                <button
                  onClick={() => {
                    if (!showSlides && !slides.length) {
                      generateSlides(transcription, notes);
                    } else {
                      setShowSlides(!showSlides);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <FileText className="w-5 h-5" />
                  {showSlides ? 'Hide Slides' : 'Generate Slides'}
                </button>
                <button
                  onClick={() => {
                    setNotes('');
                    setTranscription('');
                    setUserInput('');
                    setShowSlides(false);
                    setSlides([]);
                    setError(null);
                  }}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-indigo-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="font-semibold">Generating notes and slides...</span>
            </div>
          )}
        </div>

        {/* Lecture Slides Viewer */}
        {showSlides && slides.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl mb-8">
            <LectureSlidesViewer
              slides={slides}
              title="Lecture Slides"
              onClose={() => setShowSlides(false)}
            />
          </div>
        )}

        {/* Real-time Transcription Display */}
        {isRecording && transcription && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Transcription</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-700">{transcription}</p>
              <div className="animate-pulse mt-2 text-gray-500 text-sm">Listening...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
