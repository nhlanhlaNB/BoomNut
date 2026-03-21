import { NextRequest, NextResponse } from 'next/server';
import { createAudioSpeech, createChatCompletion } from '@/lib/azureOpenAI';

// Generate podcast/lecture from study materials
export async function POST(req: NextRequest) {
  try {
    const {
      content,
      duration = 10, // minutes (6-45)
      voice = 'alloy',
      style = 'educational', // educational, conversational, podcast
      includeQuestions = false,
    } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Generate script for podcast/lecture
    const scriptPrompt = `Create a ${duration}-minute ${style} podcast/lecture script from the following content.

${style === 'podcast' ? 'Format as an engaging podcast with an intro, main content, and outro.' : ''}
${style === 'conversational' ? 'Use a friendly, conversational tone as if teaching a friend.' : ''}
${style === 'educational' ? 'Use a clear, structured educational format with explanations.' : ''}
${includeQuestions ? 'Include thought-provoking questions throughout to engage listeners.' : ''}

Target duration: ${duration} minutes (approximately ${duration * 150} words)

Content:
${content}

Create an engaging, well-paced script that effectively communicates the key concepts.`;

    const scriptResponse = await createChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator specializing in audio learning experiences.',
        },
        {
          role: 'user',
          content: scriptPrompt,
        },
      ],
      temperature: 0.8,
      maxTokens: duration * 200, // Roughly 150 words per minute
    });

    const script = scriptResponse.choices[0]?.message?.content || '';

    // Split script into chunks for TTS (max 4096 chars per request)
    const chunks = [];
    let currentChunk = '';
    const sentences = script.split(/(?<=[.!?])\s+/);

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > 4000) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    // Generate audio for each chunk
    const audioSegments = [];
    
    for (const chunk of chunks) {
      const audioResponse = await createAudioSpeech(chunk, voice);
      const buffer = Buffer.from(await audioResponse.arrayBuffer());
      audioSegments.push(buffer.toString('base64'));
    }

    // Return metadata and audio segments
    // In production, you'd combine these into a single audio file
    // and upload to storage, returning a URL

    return NextResponse.json({
      script,
      audioSegments, // Base64 encoded audio segments
      duration: Math.ceil(script.split(' ').length / 150), // Estimated duration
      wordCount: script.split(' ').length,
      success: true,
      message: 'Podcast generated successfully. Combine audio segments for playback.',
    });
  } catch (error: any) {
    console.error('Podcast generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate podcast' },
      { status: 500 }
    );
  }
}
