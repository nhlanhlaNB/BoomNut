import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('[Transcribe] No audio file in formData');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log(`[Transcribe] Received audio file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`);

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Transcribe] Buffer created: ${buffer.length} bytes`);

    // First try Groq (more reliable for arbitrary audio formats)
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      console.log('[Transcribe] Attempting Groq transcription...');
      const groqResult = await transcribeWithGroq(buffer, audioFile.type);
      if (groqResult.success) {
        console.log('[Transcribe] Groq succeeded:', groqResult.transcript);
        return NextResponse.json({ transcript: groqResult.transcript });
      }
      console.log('[Transcribe] Groq failed:', groqResult.error);
    }

    // Otherwise try Azure Speech Services
    const speechKey = process.env.AZURE_SPEECH_KEY;
    if (speechKey) {
      console.log('[Transcribe] Attempting Azure Speech Services transcription...');
      const azureResult = await transcribeWithAzure(buffer, audioFile.type);
      if (azureResult.success) {
        return NextResponse.json({ transcript: azureResult.transcript });
      }
      return NextResponse.json({ error: azureResult.error }, { status: 500 });
    }

    console.error('[Transcribe] No transcription service configured');
    return NextResponse.json(
      { error: 'No transcription service available. Configure GROQ_API_KEY or AZURE_SPEECH_KEY' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[Transcribe] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

// Transcribe using Azure Speech Services
async function transcribeWithAzure(audioBuffer: Buffer, mimeType?: string): Promise<{ success: boolean; transcript?: string; error?: string }> {
  try {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!speechKey) {
      return { success: false, error: 'Azure Speech Key not configured' };
    }

    const endpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;

    console.log(`[Azure] Sending ${audioBuffer.length} bytes to ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': mimeType || 'audio/wav',
      },
      body: audioBuffer as any,
    });

    const responseText = await response.text();
    console.log(`[Azure] Response status: ${response.status}, body length: ${responseText.length}`);

    if (!response.ok) {
      console.error('[Azure] Error response:', responseText.substring(0, 500));
      return { success: false, error: `Azure API error: ${responseText.substring(0, 200)}` };
    }

    if (!responseText) {
      console.error('[Azure] Empty response');
      return { success: false, error: 'Azure returned empty response' };
    }

    const result = JSON.parse(responseText);
    const transcript = result.DisplayText || result.NBest?.[0]?.Display || '';
    
    console.log('[Azure] Transcript:', transcript);

    return { success: true, transcript };
  } catch (error: any) {
    console.error('[Azure] Transcription error:', error.message);
    return { success: false, error: `Azure error: ${error.message}` };
  }
}

// Fallback transcription using Groq API
async function transcribeWithGroq(audioBuffer: Buffer, mimeType?: string): Promise<{ success: boolean; transcript?: string; error?: string }> {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('[Groq] API key not configured');
      return { success: false, error: 'Groq API key not configured' };
    }

    console.log(`[Groq] Sending ${audioBuffer.length} bytes for transcription`);

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

    const responseText = await response.text();
    console.log(`[Groq] Response status: ${response.status}, body length: ${responseText.length}`);

    if (!response.ok) {
      console.error('[Groq] Error:', responseText.substring(0, 500));
      return { success: false, error: `Groq API error: ${responseText.substring(0, 200)}` };
    }

    if (!responseText) {
      console.error('[Groq] Empty response');
      return { success: false, error: 'Groq returned empty response' };
    }

    const result = JSON.parse(responseText);
    const transcript = result.text || '';
    
    console.log('[Groq] Transcript:', transcript);

    return { success: true, transcript };
  } catch (error: any) {
    console.error('[Groq] Transcription error:', error.message);
    return { success: false, error: `Groq error: ${error.message}` };
  }
}

