import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { audio, language = 'en' } = await req.json();

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio.split(',')[1], 'base64');
    
    // Create a File object
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // Generate AI notes from transcription
    const notesResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert note-taker. Create comprehensive, organized notes from the lecture transcription.
Format the notes with:
- Main topics as headers
- Key points as bullet points
- Important definitions highlighted
- Summary at the end
Make the notes clear, concise, and easy to study from.`,
        },
        {
          role: 'user',
          content: `Create study notes from this lecture:\n\n${transcription.text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const notes = notesResponse.choices[0]?.message?.content || '';

    // Extract key concepts
    const conceptsResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Extract 5-10 key concepts or terms from the lecture. Return as JSON array of strings.',
        },
        {
          role: 'user',
          content: transcription.text,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    let keyConcepts = [];
    try {
      const parsed = JSON.parse(conceptsResponse.choices[0]?.message?.content || '{}');
      keyConcepts = parsed.concepts || [];
    } catch (e) {
      keyConcepts = [];
    }

    return NextResponse.json({
      transcription: transcription.text,
      segments: transcription.segments,
      notes,
      keyConcepts,
      duration: transcription.duration,
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
