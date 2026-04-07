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
  const [isPressingButton, setIsPressingButton] = useState(false);

  const FREE_LIMIT = 2;
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isStartingListeningRef = useRef(false);
  const recognitionInstanceRef = useRef<any>(null);
  const isRecordingRef = useRef(false); // Track recording state for handlers
  const lastProcessedResultIndexRef = useRef(0); // Track which results we've processed

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
      recognitionRef.current.continuous = true; // Continuous recording while button held - no timeout
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        // Find the last FINAL result we haven't processed yet
        let finalTranscript = '';
        let lastFinalIndex = -1;
        
        // Scan from the end backwards to find the last final result
        for (let i = event.results.length - 1; i >= lastProcessedResultIndexRef.current; i--) {
          if (event.results[i].isFinal) {
            // Only add this result if we haven't seen it before
            if (i >= lastProcessedResultIndexRef.current) {
              finalTranscript = event.results[i][0].transcript;
              lastFinalIndex = i;
            }
            break;
          }
        }
        
        // Only add if we found a new final result
        if (finalTranscript && lastFinalIndex > -1) {
          setTranscription((prev) => {
            return prev + (prev ? ' ' : '') + finalTranscript;
          });
          // Update to track the last final result we've processed
          lastProcessedResultIndexRef.current = lastFinalIndex + 1;
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('[Live Lecture] Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        // Error handled, no auto-restart (user controls via button)
      };

      recognitionRef.current.onstart = () => {
        console.log('[Live Lecture] Speech recognition started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onend = () => {
        console.log('[Live Lecture] Speech recognition ended');
        setIsListening(false);
        
        // Auto-restart if user is still recording
        // Use ref to avoid closure issues with state
        if (isRecordingRef.current) {
          console.log('[Live Lecture] Auto-restarting recognition for continuous recording');
          setTimeout(() => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
                console.log('[Live Lecture] Restarted listening');
              } catch (e) {
                console.error('Error restarting recognition:', e);
              }
            }
          }, 100);
        }
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



  // Sync recording state to ref - for use in handlers to avoid closure issues
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Timer effect - for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      // Don't start if already recording or if tier limit reached
      if (isRecording) return;
      if (!isActive && usageCount >= FREE_LIMIT) {
        setShowPaywall(true);
        return;
      }

      // Request microphone access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        console.log('[Live Lecture] Microphone access granted');
        stream.getTracks().forEach(track => track.stop()); // Stop immediately, will restart when listening
      } catch (err: any) {
        console.error('[Live Lecture] Microphone access error:', err);
        setError(`Microphone error: ${err.message}`);
        return;
      }

      setError(null);
      setRecordingTime(0);
      setTranscription('');
      setNotes('');
      lastProcessedResultIndexRef.current = 0; // Reset result tracking
      setIsRecording(true);

      // Start listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          console.log('[Live Lecture] Started continuous recording');
        } catch (error: any) {
          if (!error.message.includes('already started')) {
            console.error('Error starting recognition:', error);
            setError('Failed to start recording');
            setIsRecording(false);
          }
        }
      }

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
    if (!isRecording) return;

    try {
      console.log('[Live Lecture] Stopped recording');
      setIsRecording(false);

      // Stop listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          setIsListening(false);
          lastProcessedResultIndexRef.current = 0; // Reset for next recording
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }

      // Auto-generate notes from transcription
      if (transcription.trim()) {
        await generateNotes(transcription);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setError('Error processing recording');
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

  const downloadSlides = () => {
    if (!slides.length) return;
    let html = '';
    html += '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lecture Slides</title>';
    html += '<style>body{font-family:Arial,sans-serif;background:#f5f5f5;padding:20px}';
    html += '.slide{background:white;padding:60px;margin:20px 0;border-radius:8px;page-break-after:always}';
    html += '.slide-num{color:#6366f1;font-size:14px;margin-bottom:20px}';
    html += '.slide h1{color:#0f172a;font-size:48px;margin:0 0 30px 0}';
    html += '.slide h2{color:#0f172a;font-size:32px;margin:30px 0 20px 0}';
    html += '.slide ul{margin:20px 0 0 30px}.slide li{margin:10px 0;color:#334155;font-size:18px;line-height:1.6}';
    html += '</style></head><body>';
    slides.forEach((slide: any, idx: number) => {
      html += '<div class="slide"><div class="slide-num">Slide ' + (idx + 1) + ' of ' + slides.length + '</div>';
      html += '<h1>' + (slide.title || 'Slide') + '</h1>';
      if (slide.content && slide.content.length > 0) {
        html += '<ul>';
        slide.content.forEach((pt: string) => { html += '<li>' + pt + '</li>'; });
        html += '</ul>';
      }
      if (slide.keyPoints && slide.keyPoints.length > 0) {
        html += '<h2>Key Points</h2><ul>';
        slide.keyPoints.forEach((pt: string) => { html += '<li>' + pt + '</li>'; });
        html += '</ul>';
      }
      html += '</div>';
    });
    html += '</body></html>';
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slides_' + new Date().toISOString().split('T')[0] + '.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printSlides = () => {
    if (!slides.length) return;
    let html = '';
    html += '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lecture Slides</title>';
    html += '<style>body{font-family:Arial,sans-serif;margin:0}';
    html += '.slide{background:white;padding:60px;min-height:800px;page-break-after:always}';
    html += '.slide-num{color:#6366f1;font-size:14px;margin-bottom:20px}';
    html += '.slide h1{color:#0f172a;font-size:44px;margin:0 0 30px 0}';
    html += '.slide h2{color:#0f172a;font-size:28px;margin:25px 0 15px 0}';
    html += '.slide ul{margin:20px 0 0 30px}.slide li{margin:8px 0;color:#334155;font-size:16px;line-height:1.6}';
    html += '@media print{body{margin:0;padding:0}}';
    html += '</style></head><body>';
    slides.forEach((slide: any, idx: number) => {
      html += '<div class="slide"><div class="slide-num">Slide ' + (idx + 1) + ' of ' + slides.length + '</div>';
      html += '<h1>' + (slide.title || 'Slide') + '</h1>';
      if (slide.content && slide.content.length > 0) {
        html += '<ul>';
        slide.content.forEach((pt: string) => { html += '<li>' + pt + '</li>'; });
        html += '</ul>';
      }
      if (slide.keyPoints && slide.keyPoints.length > 0) {
        html += '<h2>Key Points</h2><ul>';
        slide.keyPoints.forEach((pt: string) => { html += '<li>' + pt + '</li>'; });
        html += '</ul>';
      }
      html += '</div>';
    });
    html += '</body></html>';
    const pw = window.open('', '_blank');
    if (pw) {
      pw.document.write(html);
      pw.document.close();
      setTimeout(() => pw.print(), 250);
    }
  };

  const downloadNotes = () => {
    let html = '';
    html += '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lecture Notes</title>';
    html += '<style>body{font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;color:#0f172a}';
    html += '.container{max-width:900px;margin:0 auto}';
    html += '.section{background:white;padding:40px;margin:20px 0;border-radius:8px;page-break-after:always}';
    html += 'h1{color:#6366f1;font-size:36px;margin:0 0 20px 0}h2{color:#0f172a;font-size:28px;margin:30px 0 15px 0}';
    html += 'h3{color:#334155;font-size:20px;margin:20px 0 10px 0}';
    html += 'p{line-height:1.8;margin:10px 0;color:#334155;font-size:16px}';
    html += 'ul{margin:20px 0 0 30px}li{margin:8px 0;color:#334155;font-size:16px;line-height:1.6}';
    html += '.timestamp{color:#64748b;font-size:14px;margin-top:15px}';
    html += '@media print{body{background:white;padding:0}.section{page-break-after:always}}';
    html += '</style></head><body><div class="container">';
    html += '<div class="section"><h1>Lecture Notes & Slides</h1>';
    html += '<p class="timestamp">Generated on ' + new Date().toLocaleString() + '</p></div>';
    
    html += '<div class="section"><h2>AI-Generated Notes</h2>';
    notes.split('\n').forEach((line: string) => {
      if (line.startsWith('#')) {
        html += '<h3>' + line.replace(/#/g, '').trim() + '</h3>';
      } else if (line.trim()) {
        html += '<p>' + line + '</p>';
      }
    });
    html += '</div>';
    
    html += '<div class="section"><h2>Full Transcription</h2><p>' + transcription + '</p></div>';
    
    slides.forEach((slide: any, idx: number) => {
      html += '<div class="section"><h2>Slide ' + (idx + 1) + ': ' + (slide.title || 'Slide') + '</h2>';
      if (slide.content && slide.content.length > 0) {
        html += '<ul>';
        slide.content.forEach((pt: string) => { html += '<li>' + pt + '</li>'; });
        html += '</ul>';
      }
      if (slide.keyPoints && slide.keyPoints.length > 0) {
        html += '<h3>Key Points</h3><ul>';
        slide.keyPoints.forEach((pt: string) => { html += '<li>' + pt + '</li>'; });
        html += '</ul>';
      }
      html += '</div>';
    });
    
    html += '</div></body></html>';
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes_' + new Date().toISOString().split('T')[0] + '.html';
    a.click();
    URL.revokeObjectURL(url);
  };

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

              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-4 mb-6">
                {/* Start Recording Button */}
                <button
                  onClick={isRecording ? undefined : startRecording}
                  disabled={loading || isRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform ${
                    isRecording
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
                  } text-white disabled:opacity-50 shadow-lg`}
                >
                  <Mic className="w-10 h-10" />
                </button>

                {/* Stop Recording Button - Only shows when recording */}
                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="w-24 h-24 rounded-full flex items-center justify-center transition-all transform bg-red-600 hover:bg-red-700 hover:scale-105 text-white shadow-lg animate-pulse"
                  >
                    <Square className="w-10 h-10" />
                  </button>
                )}
              </div>

              <p className="text-lg font-semibold text-gray-700 mb-6">
                {isRecording ? (
                  <>
                    <span className="text-red-600">● Recording...</span> {formatTime(recordingTime)}
                  </>
                ) : (
                  'Click to start recording'
                )}
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
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={downloadNotes}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5" />
                  Download Notes & Slides
                </button>
                <button
                  onClick={printSlides}
                  disabled={!slides.length}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🖨️
                  Print Slides
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
                  className="flex-1 min-w-[140px] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <FileText className="w-5 h-5" />
                  {showSlides ? 'Hide Slides' : 'View Slides'}
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
