import { NextRequest, NextResponse } from 'next/server';
import { createAudioTranscription } from '@/lib/azureOpenAI';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Use Azure OpenAI gpt-audio deployment for transcription
    const result = await createAudioTranscription({
      file: audioFile,
      language: 'en',
    });

    return NextResponse.json({
      transcript: result.text || '',
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

