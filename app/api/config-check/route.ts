import { NextRequest, NextResponse } from 'next/server';

/**
 * Configuration Verification Endpoint
 * Tests all configured AI services and returns their status
 */

interface ServiceStatus {
  service: string;
  configured: boolean;
  required: boolean;
  variables: Record<string, boolean>;
  message?: string;
}

export async function GET(request: NextRequest) {
  const statuses: ServiceStatus[] = [];

  // Check Azure OpenAI Chat
  statuses.push({
    service: 'Azure OpenAI Chat',
    required: true,
    configured: !!(
      process.env.AZURE_OPENAI_CHAT_ENDPOINT &&
      process.env.AZURE_OPENAI_CHAT_KEY &&
      process.env.AZURE_OPENAI_CHAT_DEPLOYMENT
    ),
    variables: {
      AZURE_OPENAI_CHAT_ENDPOINT: !!process.env.AZURE_OPENAI_CHAT_ENDPOINT,
      AZURE_OPENAI_CHAT_KEY: !!process.env.AZURE_OPENAI_CHAT_KEY,
      AZURE_OPENAI_CHAT_DEPLOYMENT: !!process.env.AZURE_OPENAI_CHAT_DEPLOYMENT,
      AZURE_OPENAI_CHAT_VERSION: !!process.env.AZURE_OPENAI_CHAT_VERSION,
    },
  });

  // Check Azure OpenAI Audio (for transcription/speech)
  statuses.push({
    service: 'Azure OpenAI Audio',
    required: true,
    configured: !!(
      process.env.AZURE_OPENAI_AUDIO_ENDPOINT &&
      process.env.AZURE_OPENAI_AUDIO_KEY &&
      process.env.AZURE_OPENAI_AUDIO_DEPLOYMENT
    ),
    variables: {
      AZURE_OPENAI_AUDIO_ENDPOINT: !!process.env.AZURE_OPENAI_AUDIO_ENDPOINT,
      AZURE_OPENAI_AUDIO_KEY: !!process.env.AZURE_OPENAI_AUDIO_KEY,
      AZURE_OPENAI_AUDIO_DEPLOYMENT: !!process.env.AZURE_OPENAI_AUDIO_DEPLOYMENT,
      AZURE_OPENAI_AUDIO_VERSION: !!process.env.AZURE_OPENAI_AUDIO_VERSION,
    },
  });

  // Check Azure Speech Services (for voice/TTS)
  statuses.push({
    service: 'Azure Speech Services',
    required: true,
    configured: !!(
      process.env.AZURE_SPEECH_KEY &&
      process.env.AZURE_SPEECH_REGION
    ),
    variables: {
      AZURE_SPEECH_KEY: !!process.env.AZURE_SPEECH_KEY,
      AZURE_SPEECH_REGION: !!process.env.AZURE_SPEECH_REGION,
    },
  });

  // Check Azure Project/Agent Configuration
  statuses.push({
    service: 'Azure AI Project',
    required: true,
    configured: !!(
      process.env.AZURE_PROJECT_ENDPOINT &&
      process.env.AZURE_PROJECT_API_KEY
    ),
    variables: {
      AZURE_PROJECT_ENDPOINT: !!process.env.AZURE_PROJECT_ENDPOINT,
      AZURE_PROJECT_API_KEY: !!process.env.AZURE_PROJECT_API_KEY,
      AZURE_PROJECT_REGION: !!process.env.AZURE_PROJECT_REGION,
    },
  });

  // Check Firebase
  statuses.push({
    service: 'Firebase',
    required: true,
    configured: !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ),
    variables: {
      NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
  });

  // Check Fallback APIs (optional)
  statuses.push({
    service: 'OpenAI (Fallback)',
    required: false,
    configured: !!process.env.OPENAI_API_KEY,
    variables: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    },
  });

  statuses.push({
    service: 'Groq (Fallback)',
    required: false,
    configured: !!process.env.GROQ_API_KEY,
    variables: {
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    },
  });

  statuses.push({
    service: 'OpenRouter (Fallback)',
    required: false,
    configured: !!process.env.OPENROUTER_API_KEY,
    variables: {
      OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    },
  });

  // Generate summary
  const required = statuses.filter(s => s.required);
  const optional = statuses.filter(s => !s.required);
  const configuredRequired = required.filter(s => s.configured).length;
  const configuredOptional = optional.filter(s => s.configured).length;

  return NextResponse.json({
    status: configuredRequired === required.length ? 'healthy' : 'incomplete',
    summary: {
      requiredServices: required.length,
      requiredConfigured: configuredRequired,
      optionalServices: optional.length,
      optionalConfigured: configuredOptional,
      allRequiredConfigured: configuredRequired === required.length,
    },
    services: statuses,
    missingRequired: required
      .filter(s => !s.configured)
      .map(s => s.service),
    recommendations: generateRecommendations(statuses),
  });
}

function generateRecommendations(statuses: ServiceStatus[]): string[] {
  const recommendations: string[] = [];

  const unconfigured = statuses.filter(s => s.required && !s.configured);
  
  if (unconfigured.length > 0) {
    recommendations.push(
      `❌ Missing required services: ${unconfigured.map(s => s.service).join(', ')}`
    );
  }

  const allConfigured = statuses.every(s => !s.required || s.configured);
  if (allConfigured) {
    recommendations.push('✅ All required services are configured');
  }

  const optional = statuses.filter(s => !s.required && !s.configured);
  if (optional.length > 0) {
    recommendations.push(
      `ℹ️ Optional fallback services not configured: ${optional.map(s => s.service).join(', ')} (application will work without these)`
    );
  }

  return recommendations;
}
