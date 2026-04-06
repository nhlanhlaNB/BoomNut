import { NextRequest, NextResponse } from 'next/server';
import { createAudioTranscription, createChatCompletion } from '@/lib/azureOpenAI';

const activeStream: any = null;
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
      // End session and generate final notes ONLY if there's actual transcription
      
      // Check if there's actual audio content that was transcribed
      const cleanedTranscription = fullTranscription.trim();
      const wordCount = cleanedTranscription.split(/\s+/).filter(word => word.length > 0).length;
      
      // If nothing was heard (less than 5 words), return empty result with message
      if (wordCount < 5) {
        const emptyResult = {
          transcription: '',
          notes: '',
          summary: '❌ No content detected. Please ensure your microphone is working and speak clearly.',
          duration: 0,
          wordCount: 0,
          isEmpty: true,
        };
        
        // Reset
        fullTranscription = '';
        
        return NextResponse.json(emptyResult);
      }
      
      // Generate final notes ONLY from actual transcription
      const finalNotesResponse = await createChatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Create comprehensive, well-organized notes from the complete lecture transcription. Include summary, key concepts, important points, and any definitions. Base ONLY on what is in the transcription provided.',
          },
          {
            role: 'user',
            content: cleanedTranscription,
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
            content: 'Provide a brief 2-3 sentence summary of the lecture. Only use information that was explicitly mentioned in the transcription.',
          },
          {
            role: 'user',
            content: cleanedTranscription,
          },
        ],
        maxTokens: 150,
      });

      const summary = summaryResponse.choices[0]?.message?.content || '';

      const result = {
        transcription: cleanedTranscription,
        notes: finalNotes,
        summary,
        duration: wordCount / 150, // Estimated minutes
        wordCount: wordCount,
        isEmpty: false,
      };

      // Reset
      fullTranscription = '';

      return NextResponse.json(result);
    }

    if (action === 'generateSlides') {
      // Generate lecture slides from transcription and notes
      const { transcription: lectureTrans, notes: lectureNotes } = await req.json();
      
      if (!lectureTrans || lectureTrans.trim().length === 0) {
        return NextResponse.json(
          { error: 'Transcription required to generate slides' },
          { status: 400 }
        );
      }

      // Generate slides structure using AI
      const slidesResponse = await createChatCompletion({
        messages: [
          {
            role: 'system',
            content: `Generate presentation slides from the lecture content. Return a JSON array of slides with the following structure:
[
  {
    "title": "Slide Title",
    "content": ["Point 1", "Point 2", "Point 3"],
    "keyPoints": ["Key point 1", "Key point 2"]
  }
]

Guidelines:
- Create 5-8 slides covering the main topics
- Each slide should have a clear title
- Content should be bullet points
- Include ONLY information from the transcription provided
- Include key takeaways
- Make slides visual and easy to understand
- First slide should be an introduction
- Last slide should be a summary/conclusion`,
          },
          {
            role: 'user',
            content: `Lecture transcription:\n${lectureTrans}\n\nLecture notes:\n${lectureNotes || 'N/A'}\n\nGenerate professional presentation slides based ONLY on the transcription.`,
          },
        ],
        maxTokens: 3000,
      });

      const slidesContent = slidesResponse.choices[0]?.message?.content || '';

      // Parse the JSON response
      let slides = [];
      try {
        // Extract JSON from the response
        const jsonMatch = slidesContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          slides = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Error parsing slides JSON:', parseError);
        // If JSON parsing fails, create a default slide structure
        slides = [
          {
            title: 'Lecture Slides',
            content: ['Unable to parse automatic slide generation', 'Please review the transcription and notes above'],
            keyPoints: ['Check transcription quality', 'Manual slide creation may be needed']
          }
        ];
      }

      return NextResponse.json({
        slides,
        slideCount: slides.length,
        generatedAt: new Date().toISOString(),
      });
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
