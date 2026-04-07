import { NextRequest, NextResponse } from 'next/server';
import { createAudioTranscription, createChatCompletion } from '@/lib/azureOpenAI';

const activeStream: any = null;
let fullTranscription = '';

// Start live lecture transcription
export async function POST(req: NextRequest) {
  try {
    let action, audio, language, sessionId, question, transcription, notes;

    // Determine if it's multipart or JSON
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      action = formData.get('action') as string;
      audio = formData.get('audioFile') as Blob;
      language = (formData.get('language') as string) || 'en';
      sessionId = formData.get('sessionId') as string;
    } else {
      const body = await req.json();
      action = body.action;
      audio = body.audio;
      language = body.language || 'en';
      sessionId = body.sessionId;
      question = body.question;
      transcription = body.transcription;
      notes = body.notes;
    }

    console.log('[LIVE-LECTURE] API called with action:', action, 'sessionId:', sessionId);

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

      let audioFile: File;
      if (audio instanceof Blob) {
        audioFile = new File([audio], 'lecture_chunk.webm', { type: 'audio/webm' });
      } else {
        // Handle base64 audio data
        let audioBuffer: Buffer;
        try {
          // Remove data URL prefix if present
          const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
          const buffer = Buffer.from(base64Data, 'base64');
          const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
          audioFile = new File([arrayBuffer], 'audio.webm', { type: 'audio/webm' });
        } catch (error) {
          console.error('[LIVE-LECTURE] Audio buffer creation error:', error);
          return NextResponse.json(
            { error: 'Invalid audio data format' },
            { status: 400 }
          );
        }
      }

      console.log('[LIVE-LECTURE] Audio file created:', { 
        fileName: audioFile.name, 
        fileType: audioFile.type,
        fileSize: audioFile.size 
      });

      console.log('[LIVE-LECTURE] Calling createAudioTranscription...');
      let transcriptionResponse;
      try {
        transcriptionResponse = await createAudioTranscription({
          file: audioFile,
          language: language,
        });
        console.log('[LIVE-LECTURE] Transcription response received:', transcriptionResponse);
      } catch (transcriptionError: any) {
        console.error('[LIVE-LECTURE] Transcription error:', {
          message: transcriptionError.message,
          response: transcriptionError.response?.data,
          status: transcriptionError.response?.status,
        });
        throw transcriptionError;
      }
      
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
        console.log('[LIVE-LECTURE] Calling createChatCompletion for notes...');
        try {
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
          console.log('[LIVE-LECTURE] Notes response received');
          notes = notesResponse.choices[0]?.message?.content || '';
        } catch (notesError: any) {
          console.error('[LIVE-LECTURE] Notes generation error:', {
            message: notesError.message,
            response: notesError.response?.data,
            status: notesError.response?.status,
          });
          // Don't throw, just skip notes
          notes = '';
        }
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
      if (!transcription || transcription.trim().length === 0) {
        return NextResponse.json(
          { error: 'Transcription required to generate slides' },
          { status: 400 }
        );
      }

      // Calculate number of slides based on transcript length
      // Estimate: ~500 words per slide
      const wordCount = transcription.split(/\s+/).length;
      const suggestedSlides = Math.max(3, Math.ceil(wordCount / 500));

      // Generate slides structure using AI
      const slidesResponse = await createChatCompletion({
        messages: [
          {
            role: 'system',
            content: `You are creating presentation slides from a lecture. Return a JSON array of slides.

IMPORTANT: Extract and summarize KEY CONCEPTS AND IDEAS, NOT just recite what was said.

Format:
[
  {
    "title": "Slide Title",
    "content": ["Key point 1", "Key point 2", "Key point 3"],
    "keyPoints": ["Main takeaway 1", "Main takeaway 2"]
  }
]

Guidelines:
- Create 5-8 well-organized slides covering the main topics
- Each slide should focus on ONE main topic or concept
- Content should be concise bullet points (5-7 words max each)
- SUMMARIZE and EXTRACT key ideas - do NOT just repeat what was said
- Group related concepts together
- First slide: Title/Introduction
- Middle slides: Main topics and concepts (SUMMARIZED)
- Last slide: Summary and key takeaways
- Avoid verbose explanations - use short, impactful phrases
- Focus on what students need to understand, not transcription details`,
          },
          {
            role: 'user',
            content: `Lecture content:\n${transcription}\n\nCreate concise, concept-focused presentation slides that summarize the key ideas (NOT a transcription). Extract the main topics and key points.`,
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

    if (action === 'generateNotes') {
      // Generate notes from transcription
      if (!transcription || transcription.trim().length === 0) {
        return NextResponse.json(
          { error: 'Transcription required to generate notes' },
          { status: 400 }
        );
      }

      try {
        const notesResponse = await createChatCompletion({
          messages: [
            {
              role: 'system',
              content: 'Create comprehensive, well-organized notes from the lecture transcription. Include key concepts, important points, definitions, and summary. Format with clear sections and bullet points. Base ONLY on what is in the transcription provided.',
            },
            {
              role: 'user',
              content: transcription,
            },
          ],
          maxTokens: 1500,
        });

        const generatedNotes = notesResponse.choices[0]?.message?.content || '';

        if (!generatedNotes) {
          return NextResponse.json(
            { notes: 'Unable to generate notes. Please try again.' },
            { status: 200 }
          );
        }

        return NextResponse.json({
          notes: generatedNotes,
        });
      } catch (error: any) {
        console.error('[LIVE-LECTURE] Notes generation error:', error);
        return NextResponse.json(
          { notes: 'Unable to generate notes. Please try again.' },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[LIVE-LECTURE] CRITICAL ERROR:', {
      message: error.message,
      code: error.code,
      response_status: error.response?.status,
      response_data: error.response?.data,
      stack: error.stack,
    });
    
    // Check for environment variable issues
    const envVars = {
      has_azure_endpoint: !!process.env.AZURE_PROJECT_ENDPOINT,
      has_azure_key: !!process.env.AZURE_PROJECT_API_KEY,
      has_azure_deployment: !!process.env.AZURE_DEPLOYMENT_ID,
      has_speech_key: !!process.env.AZURE_SPEECH_KEY,
      has_speech_region: !!process.env.AZURE_SPEECH_REGION,
    };
    console.error('[LIVE-LECTURE] Environment variables status:', envVars);
    
    const errorResponse = {
      error: error.message || 'Failed to process live lecture',
      type: error.response?.status ? 'api_error' : 'unknown_error',
      details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined,
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
