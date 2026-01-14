import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Azure Voice Tutor API Route
 * Handles WebSocket connection to Azure Voice Live API for real-time voice tutoring
 */

const AZURE_ENDPOINT = process.env.AZURE_VOICELIVE_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_VOICELIVE_API_KEY;
const AZURE_MODEL = process.env.AZURE_VOICELIVE_MODEL || 'gpt-4o';

export async function POST(request: NextRequest) {
  try {
    if (!AZURE_ENDPOINT || !AZURE_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Azure Voice Live API credentials not configured. Please add AZURE_VOICELIVE_ENDPOINT and AZURE_VOICELIVE_API_KEY to .env.local' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { audio, sessionConfig } = await request.json();

    // Configure the AI tutor session
    const config = {
      model: AZURE_MODEL,
      modalities: ['text', 'audio'],
      instructions: sessionConfig?.instructions || `You are a patient, encouraging, and expert AI tutor for students. 
Your teaching style follows the Socratic method: guide learners to discover answers through thoughtful questions and hints. 
Never simply give direct answers. Break down complex topics into manageable steps. 
Be concise but thorough. Celebrate student progress. 
If a student is stuck, provide increasingly specific hints. 
Adapt your explanations to the student's level of understanding. 
Make learning engaging and build confidence.`,
      voice: sessionConfig?.voice || 'alloy',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
    };

    // For now, return configuration to client
    // Full WebSocket implementation would go here
    return new Response(
      JSON.stringify({ 
        success: true, 
        config,
        message: 'Voice tutor configuration ready' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Voice tutor error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process voice request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  const isConfigured = !!(AZURE_ENDPOINT && AZURE_API_KEY);
  
  return new Response(
    JSON.stringify({ 
      status: isConfigured ? 'ready' : 'not_configured',
      model: AZURE_MODEL,
      endpoint: AZURE_ENDPOINT ? 'configured' : 'missing',
      apiKey: AZURE_API_KEY ? 'configured' : 'missing',
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
