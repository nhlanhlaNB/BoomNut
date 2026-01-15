import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

let activeStream: any = null;
let fullTranscription = '';

// Start live lecture transcription
export async function POST(req: NextRequest) {
  try {
    const { action, audio, language = 'en', sessionId } = await req.json();

    if (action === 'start') {
      // Start new session
      fullTranscription = '';
      
      return NextResponse.json({
        sessionId: `live_${Date.now()}`,
        status: 'started',
        message: 'Live lecture session started',
      });
    }

    // All other actions require OpenAI
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (action === 'transcribe') {
      // Transcribe audio chunk
      if (!audio) {
        return NextResponse.json(
          { error: 'Audio data required' },
          { status: 400 }
        );
      }

      const audioBuffer = Buffer.from(audio.split(',')[1], 'base64');
      const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: language,
        response_format: 'text',
      });

      fullTranscription += ' ' + transcription;

      // Generate real-time notes from accumulated transcription
      let notes = '';
      if (fullTranscription.split(' ').length > 50) {
        const notesResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'Create brief, organized notes from lecture transcription. Focus on key points, definitions, and important concepts. Use bullet points.',
            },
            {
              role: 'user',
              content: `Transcription so far:\n${fullTranscription}\n\nProvide updated notes.`,
            },
          ],
          temperature: 0.5,
          max_tokens: 500,
        });

        notes = notesResponse.choices[0]?.message?.content || '';
      }

      return NextResponse.json({
        transcription,
        notes,
        wordCount: fullTranscription.split(' ').length,
      });
    }
    
    if (action === 'question') {
      // Answer question about lecture
      const { question } = await req.json();

      if (!question) {
        return NextResponse.json(
          { error: 'Question required' },
          { status: 400 }
        );
      }

      const answerResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an AI tutor helping students during live lectures. Answer questions based on the lecture context.',
          },
          {
            role: 'user',
            content: `Lecture context:\n${fullTranscription}\n\nStudent question: ${question}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const answer = answerResponse.choices[0]?.message?.content || '';

      return NextResponse.json({
        question,
        answer,
      });
    }
    
    if (action === 'end') {
      // End session and generate final notes
      const finalNotesResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Create comprehensive, well-organized notes from the complete lecture transcription. Include summary, key concepts, important points, and any definitions.',
          },
          {
            role: 'user',
            content: fullTranscription,
          },
        ],
        temperature: 0.6,
        max_tokens: 2000,
      });

      const finalNotes = finalNotesResponse.choices[0]?.message?.content || '';

      // Generate summary
      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Provide a brief 2-3 sentence summary of the lecture.',
          },
          {
            role: 'user',
            content: fullTranscription,
          },
        ],
        temperature: 0.5,
        max_tokens: 150,
      });

      const summary = summaryResponse.choices[0]?.message?.content || '';

      const result = {
        transcription: fullTranscription,
        notes: finalNotes,
        summary,
        duration: fullTranscription.split(' ').length / 150, // Estimated minutes
        wordCount: fullTranscription.split(' ').length,
      };

      // Reset
      fullTranscription = '';

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Live lecture error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process live lecture' },
      { status: 500 }
    );
  }
}
