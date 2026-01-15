import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Generate educational video script and assets
export async function POST(req: NextRequest) {
  try {
    const {
      content,
      duration = 5, // minutes
      style = 'animated', // animated, lecture, whiteboard
      includeVisuals = true,
      subject,
    } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Generate video script with scene descriptions
    const scriptPrompt = `Create a ${duration}-minute educational video script in ${style} style about the following content.

Subject: ${subject || 'General'}
Content: ${content}

For each scene, provide:
1. Narration text (what the voiceover says)
2. Visual description (what appears on screen)
3. Duration (in seconds)
4. Key points to highlight
5. Animations or transitions

Format as JSON:
{
  "title": "Video Title",
  "description": "Brief description",
  "totalDuration": ${duration * 60},
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": 15,
      "narration": "Welcome to...",
      "visuals": "Title card with animated text",
      "keyPoints": ["Point 1"],
      "animations": ["Fade in", "Text highlight"],
      "notes": "Engaging opening"
    }
  ],
  "voiceoverScript": "Full script...",
  "visualAssets": ["Asset 1", "Asset 2"]
}`;

    const scriptResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational video producer. Create detailed, engaging video scripts with clear visual instructions.',
        },
        {
          role: 'user',
          content: scriptPrompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const videoScript = JSON.parse(scriptResponse.choices[0]?.message?.content || '{}');

    // Generate voiceover audio
    const fullNarration = videoScript.voiceoverScript || 
      videoScript.scenes?.map((s: any) => s.narration).join(' ') || '';

    let audioUrl = null;

    if (fullNarration) {
      // Split into chunks if needed
      const chunks = [];
      let currentChunk = '';
      const sentences = fullNarration.split(/(?<=[.!?])\s+/);

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

      // Generate first chunk as sample
      // In production, you'd combine all chunks
      if (chunks.length > 0) {
        try {
          const mp3 = await openai.audio.speech.create({
            model: 'tts-1-hd',
            voice: 'onyx',
            input: chunks[0],
            speed: 0.95,
          });

          const buffer = Buffer.from(await mp3.arrayBuffer());
          audioUrl = `data:audio/mp3;base64,${buffer.toString('base64')}`;
        } catch (error) {
          console.error('Audio generation error:', error);
        }
      }
    }

    // Generate visual suggestions for key concepts
    const visualSuggestions = [];
    if (includeVisuals && videoScript.scenes) {
      for (const scene of videoScript.scenes.slice(0, 5)) { // First 5 scenes
        if (scene.keyPoints && scene.keyPoints.length > 0) {
          visualSuggestions.push({
            scene: scene.sceneNumber,
            concept: scene.keyPoints[0],
            suggestion: scene.visuals,
            imagePrompt: `Educational illustration: ${scene.visuals}. Clean, simple, pedagogical style.`,
          });
        }
      }
    }

    return NextResponse.json({
      videoScript,
      audioUrl, // Sample audio (first chunk)
      visualSuggestions,
      metadata: {
        totalScenes: videoScript.scenes?.length || 0,
        estimatedDuration: duration,
        style,
        subject,
      },
      success: true,
      message: 'Video script generated. Use video editing software to produce the final video.',
    });
  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video script' },
      { status: 500 }
    );
  }
}
