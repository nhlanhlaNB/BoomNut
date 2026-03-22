import { NextRequest, NextResponse } from 'next/server';
import { createAudioTranscription, createChatCompletion } from '@/lib/azureOpenAI';

let activeStream: any = null;
let fullTranscription = '';

// Start live lecture transcription
export async function POST(req: NextRequest) {
  try {
    const { action, audio, language = 'en', question } = await req.json();

    if (action === 'start') {
      // Start new session
      fullTranscription = '';
      
      return NextResponse.json({
        sessionId: `live_${Date.now()}`,
        status: 'started',
        message: 'Live lecture session started',
      });
    }

    if (action === 'transcribe') {
      // Transcribe audio chunk
      if (!audio) {
        return NextResponse.json(
          { error: 'Audio data required' },
          { status: 400 }
        );
      }

      // Handle base64 audio data
      let audioBuffer: Buffer;
      try {
        // Remove data URL prefix if present
        const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
        audioBuffer = Buffer.from(base64Data, 'base64');
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid audio data format' },
          { status: 400 }
        );
      }

      const audioFile = new File([new Uint8Array(audioBuffer)], 'audio.webm', { type: 'audio/webm' });

      const transcriptionResponse = await createAudioTranscription({
        file: audioFile,
        language: language,
      });
      const transcription = transcriptionResponse?.text || '';

      if (!transcription) {
        return NextResponse.json(
          { error: 'Transcription service returned empty output' },
          { status: 502 }
        );
      }

      fullTranscription += ' ' + transcription;

      // Generate real-time notes from accumulated transcription
      let notes = '';
      if (fullTranscription.split(' ').length > 50) {
        const notesResponse = await createChatCompletion({
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
          maxTokens: 500,
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
      if (!question) {
        return NextResponse.json(
          { error: 'Question required' },
          { status: 400 }
        );
      }

      const answerResponse = await createChatCompletion({
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
        maxTokens: 300,
      });

      const answer = answerResponse.choices[0]?.message?.content || '';

      return NextResponse.json({
        question,
        answer,
      });
    }
    
    if (action === 'end') {
      // End session and generate final notes
      const finalNotesResponse = await createChatCompletion({
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
        maxTokens: 2000,
      });

      const finalNotes = finalNotesResponse.choices[0]?.message?.content || '';

      // Generate summary
      const summaryResponse = await createChatCompletion({
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
        maxTokens: 150,
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
