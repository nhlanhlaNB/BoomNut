import { NextRequest, NextResponse } from 'next/server';

// Function to remove emojis, special characters, and dashes from text
function cleanTextForSpeech(text: string): string {
  return text
    // Remove emojis and non-ASCII special characters
    .replace(/[^\x00-\x7F]/g, (char) => {
      // Allow common accented letters, keep them if present
      const commonAccented = 'àáâäãåèéêëìíîïòóôöõùúûüýÿÀÁÂÄÃÅÈÉÊËÌÍÎÏÒÓÔÖÕÙÚÛÜÝŸ';
      return commonAccented.includes(char) ? char : '';
    })
    // Remove markdown symbols and special punctuation
    .replace(/[*_`~#@$%^&()\[\]{};:<>?/\\|]/g, '')
    // Remove common bullet points and dash variations
    .replace(/[•–—―]/g, '')
    // Clean up multiple spaces and trim
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'en-US-AriaNeural' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      throw new Error('Azure Speech Services credentials not configured');
    }

    // Use Azure Speech Services REST API for TTS (more compatible with Next.js)
    const endpoint = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
    
    // Clean the text to remove emojis, special characters, and dashes
    const cleanedText = cleanTextForSpeech(text);
    
    // Escape XML special characters in text
    const escapedText = cleanedText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    const ssml = `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='${voice}'>${escapedText}</voice></speak>`;

    console.log('TTS Request:', { endpoint, voice, textLength: text.length });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Speech API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      throw new Error(`Azure Speech API error: ${response.status} - ${errorText || response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(Buffer.from(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
