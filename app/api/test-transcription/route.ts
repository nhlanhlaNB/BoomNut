import { NextResponse } from 'next/server';
import { createAudioTranscription } from '@/lib/azureOpenAI';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioContent = formData.get('audio') as Blob;
    
    if (!audioContent) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    const audioFile = new File([audioContent], 'recording.webm', { type: 'audio/webm' });
    
    console.log('[TRANSCRIPTION-TEST] Starting transcription for file:', audioFile.name, 'size:', audioFile.size);

    const transcription = await createAudioTranscription({
      file: audioFile,
      language: 'en'
    });

    console.log('[TRANSCRIPTION-TEST] Successful transcription:', transcription.text);

    return NextResponse.json({ text: transcription.text });
  } catch (error: any) {
    console.error('[TRANSCRIPTION-TEST] Error details:', {
      message: error.message,
      stack: error.stack,
      status: error.status,
      response: error.response?.data
    });
    return NextResponse.json({ 
      error: 'Transcription failed', 
      details: error.message,
      status: error.status
    }, { status: 500 });
  }
}
