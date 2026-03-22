import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use Azure Speech Services for transcription (speech-to-text)
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!speechKey) {
      // Fallback: Try Groq API for transcription
      return await transcribeWithGroq(buffer, audioFile.type);
    }

    const endpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': audioFile.type || 'audio/wav',
      },
      body: buffer,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Azure Speech Services error:', error);
      // Fallback to Groq if Azure fails
      return await transcribeWithGroq(buffer, audioFile.type);
    }

    const result = await response.json();

    return NextResponse.json({
      transcript: result.DisplayText || result.NBest?.[0]?.Display || '',
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    
    // Last resort: return error
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

// Fallback transcription using Groq API
async function transcribeWithGroq(audioBuffer: Buffer, mimeType?: string): Promise<NextResponse> {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'No transcription service available. Please configure AZURE_SPEECH_KEY or GROQ_API_KEY' },
        { status: 500 }
      );
    }

    // Create form data for Groq
    const formData = new FormData();
    const uint8Array = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8Array], { type: mimeType || 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-large-v3-turbo');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq transcription error:', error);
      return NextResponse.json(
        { error: 'Transcription failed' },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      transcript: result.text || '',
    });
  } catch (error: any) {
    console.error('Groq fallback error:', error);
    return NextResponse.json(
      { error: 'Transcription service unavailable' },
      { status: 500 }
    );
  }
}

