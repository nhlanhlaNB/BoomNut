'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, FileText, Download, Loader } from 'lucide-react';

export default function LiveLectureRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [notes, setNotes] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Start session
      const startRes = await fetch('/api/live-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const { sessionId: newSessionId } = await startRes.json();
      setSessionId(newSessionId);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);

          // Send chunk for transcription every 5 seconds
          if (chunksRef.current.length >= 5) {
            const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
            chunksRef.current = [];

            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64Audio = reader.result as string;

              const response = await fetch('/api/live-lecture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'transcribe',
                  audio: base64Audio,
                  sessionId: newSessionId,
                }),
              });

              const data = await response.json();
              if (data.transcription) {
                setTranscription((prev) => prev + ' ' + data.transcription);
              }
              if (data.notes) {
                setNotes(data.notes);
              }
            };
          }
        }
      };

      mediaRecorder.start(1000); // Capture data every second
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please allow microphone access.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setLoading(true);

      // Get final notes
      try {
        const response = await fetch('/api/live-lecture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'end', sessionId }),
        });

        const data = await response.json();
        setTranscription(data.transcription || transcription);
        setNotes(data.notes || notes);
      } catch (error) {
        console.error('Error getting final notes:', error);
      } finally {
        setLoading(false);
      }
    }
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
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Live Lecture Notes
        </h2>

        <div className="flex gap-4 mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className={`flex-1 py-4 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : isRecording ? (
              <>
                <Square className="w-5 h-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start Recording
              </>
            )}
          </button>

          {(notes || transcription) && (
            <button
              onClick={downloadNotes}
              className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          )}
        </div>

        {isRecording && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="font-medium">Recording in progress...</span>
            </div>
          </div>
        )}

        {notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">AI-Generated Notes</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {notes}
              </div>
            </div>
          </div>
        )}

        {transcription && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Transcription</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {transcription}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
