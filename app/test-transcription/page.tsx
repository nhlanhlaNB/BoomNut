'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Loader, AlertCircle } from 'lucide-react';

export default function TranscriptionTester() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscription('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadAndTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err: any) {
      console.error('Start recording failed', err);
      setError('Microphone access denied or error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const uploadAndTranscribe = async (audioBlob: Blob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    try {
      const response = await fetch('/api/test-transcription', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error + (data.details ? ': ' + data.details : ''));
      setTranscription(data.text);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 border-b pb-4">Live Transcription Tester</h1>
      
      <p className="text-sm text-gray-600">
        This tool records audio for a few seconds and sends it directly to the transcription API as a FormData blob.
      </p>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-6 p-6 bg-white shadow rounded-xl border border-gray-100">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-lg`}
        >
          {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        
        <div className="flex-1">
          <div className="text-lg font-mono font-bold">
            {isRecording ? `REC: ${recordingTime}s` : 'Ready'}
          </div>
          <div className="text-sm text-gray-500">
            {isRecording ? 'Click button to stop and transcribing' : 'Click microphone to start test'}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-indigo-600 font-semibold italic animate-pulse">
          <Loader className="w-5 h-5 animate-spin" />
          Transcribing...
        </div>
      )}

      {transcription && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-800">Transcript Result:</h2>
          <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 font-medium leading-relaxed">
            {transcription}
          </div>
        </div>
      )}
    </div>
  );
}
