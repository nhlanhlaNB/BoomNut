/**
 * Azure OpenAI Client
 * Utility functions for interacting with Azure AI Project
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: any;
}

interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface AudioTranscriptionOptions {
  file: File | Blob;
  prompt?: string;
  language?: string;
}

/**
 * Get Azure AI Project configuration
 */
function getAzureConfig(deploymentType?: 'chat' | 'audio') {
  let endpoint = process.env.AZURE_PROJECT_ENDPOINT;
  let apiKey = process.env.AZURE_PROJECT_API_KEY;
  
  // Check for deployment-specific credentials
  if (deploymentType === 'chat' && process.env.AZURE_OPENAI_CHAT_ENDPOINT) {
    endpoint = process.env.AZURE_OPENAI_CHAT_ENDPOINT;
    apiKey = process.env.AZURE_OPENAI_CHAT_KEY || apiKey;
  } else if (deploymentType === 'audio' && process.env.AZURE_OPENAI_AUDIO_ENDPOINT) {
    endpoint = process.env.AZURE_OPENAI_AUDIO_ENDPOINT;
    apiKey = process.env.AZURE_OPENAI_AUDIO_KEY || apiKey;
  }
  
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';

  console.log('[Azure Config] Type:', deploymentType);
  console.log('[Azure Config] Has endpoint:', !!endpoint, 'URL:', endpoint?.substring(0, 50) + '...');
  console.log('[Azure Config] Has apiKey:', !!apiKey, 'Length:', apiKey?.length);
  console.log('[Azure Config] API Version:', apiVersion);

  if (!endpoint || !apiKey) {
    console.error('[Azure Config] Missing credentials:', {
      hasEndpoint: !!endpoint,
      hasApiKey: !!apiKey,
      deploymentType,
      availableEnvVars: {
        AZURE_PROJECT_ENDPOINT: !!process.env.AZURE_PROJECT_ENDPOINT,
        AZURE_PROJECT_API_KEY: !!process.env.AZURE_PROJECT_API_KEY,
        AZURE_OPENAI_CHAT_ENDPOINT: !!process.env.AZURE_OPENAI_CHAT_ENDPOINT,
        AZURE_OPENAI_CHAT_KEY: !!process.env.AZURE_OPENAI_CHAT_KEY,
        AZURE_OPENAI_AUDIO_ENDPOINT: !!process.env.AZURE_OPENAI_AUDIO_ENDPOINT,
        AZURE_OPENAI_AUDIO_KEY: !!process.env.AZURE_OPENAI_AUDIO_KEY,
      }
    });
    throw new Error(`Azure AI Project credentials not configured (type: ${deploymentType})`);
  }

  return { endpoint, apiKey, apiVersion };
}

/**
 * Send a chat completion request to Azure OpenAI
 */
export async function createChatCompletion(options: ChatCompletionOptions) {
  const {
    messages,
    temperature = 1,
    maxTokens = 2000,
    stream = false,
  } = options;

  const { endpoint, apiKey, apiVersion } = getAzureConfig('chat');
  const deployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-5.2-chat';

  // gpt-5.2 only supports temperature=1, so force it
  const finalTemperature = deployment.includes('gpt-5.2') ? 1 : temperature;

  // If endpoint already includes the deployment path (Azure AI Foundry Target URI), use it directly
  // Otherwise, construct the traditional Azure OpenAI URL
  let url: string;
  if (endpoint.includes('/deployments/') || endpoint.includes('/chat/completions')) {
    // Target URI already has the full path including api-version, use as-is
    url = endpoint;
  } else {
    // Traditional Azure OpenAI endpoint - construct the full path
    url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  }

  console.log('[azureOpenAI] Chat completion URL:', url.substring(0, 80) + '...');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages,
      temperature: finalTemperature,
      max_completion_tokens: maxTokens,
      stream,
    }),
  });

  console.log('[azureOpenAI] Chat completion response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error('[azureOpenAI] Chat completion error response:', {
      status: response.status,
      statusText: response.statusText,
      body: error.substring(0, 500)
    });
    throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Stream a chat completion response from Azure OpenAI
 */
export async function streamChatCompletion(options: ChatCompletionOptions) {
  const {
    messages,
    temperature = 1,
    maxTokens = 2000,
  } = options;

  const { endpoint, apiKey, apiVersion } = getAzureConfig('chat');
  const deployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-5.2-chat';

  // gpt-5.2 only supports temperature=1, so force it
  const finalTemperature = deployment.includes('gpt-5.2') ? 1 : temperature;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages,
      temperature: finalTemperature,
      max_completion_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
  }

  return response.body;
}

/**
 * Transcribe audio using Azure OpenAI Audio API
 */
export async function createAudioTranscription(options: AudioTranscriptionOptions) {
  const { file, prompt, language = 'en' } = options;

  const { endpoint, apiKey, apiVersion } = getAzureConfig('audio');
  const deployment = process.env.AZURE_OPENAI_AUDIO_DEPLOYMENT || 'gpt-audio';

  // Check if endpoint is a full Target URI for audio transcription
  let url: string;
  if (endpoint.includes('/audio/transcriptions')) {
    // Already a complete Target URI
    url = endpoint;
  } else {
    // Build the URL from base endpoint with correct API version for audio
    const audioApiVersion = process.env.AZURE_OPENAI_AUDIO_VERSION || apiVersion || '2024-05-01-preview';
    url = `${endpoint}/openai/deployments/${deployment}/audio/transcriptions?api-version=${audioApiVersion}`;
  }

  console.log('[azureOpenAI] Audio transcription URL:', url.substring(0, 80) + '...');
  
  const formData = new FormData();
  formData.append('file', file);
  if (prompt) formData.append('prompt', prompt);
  formData.append('language', language);

  console.log('[azureOpenAI] Sending audio for transcription:', {
    fileSize: file.size,
    fileType: file.type,
    language
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
    },
    body: formData,
  });

  console.log('[azureOpenAI] Transcription response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error('[azureOpenAI] Transcription error response:', {
      status: response.status,
      statusText: response.statusText,
      body: error.substring(0, 500)
    });
    throw new Error(`Azure OpenAI Audio API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Generate speech from text using Azure OpenAI Audio API
 */
export async function createAudioSpeech(text: string, voice: string = 'alloy') {
  const { endpoint, apiKey, apiVersion } = getAzureConfig('audio');
  const deployment = process.env.AZURE_OPENAI_AUDIO_DEPLOYMENT || 'gpt-audio';

  // Check if endpoint is a full Target URI for audio speech
  let url: string;
  if (endpoint.includes('/audio/speech')) {
    // Already a complete Target URI
    url = endpoint;
  } else {
    // Build the URL from base endpoint
    url = `${endpoint}/openai/deployments/${deployment}/audio/speech?api-version=${apiVersion}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      input: text,
      voice: voice,
      response_format: 'mp3',
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Azure OpenAI Audio API error: ${response.status} - ${error}`);
  }

  return response;
}

/**
 * Helper function to get Azure OpenAI configuration
 */
export function getAzureOpenAIConfig() {
  return {
    endpoint: process.env.AZURE_PROJECT_ENDPOINT,
    apiKey: process.env.AZURE_PROJECT_API_KEY,
    region: process.env.AZURE_PROJECT_REGION,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
    chatDeployment: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-5.2-chat',
    audioDeployment: process.env.AZURE_OPENAI_AUDIO_DEPLOYMENT || 'gpt-audio',
  };
}

/**
 * Check if Azure OpenAI is properly configured
 */
export function isAzureOpenAIConfigured(): boolean {
  return !!(
    process.env.AZURE_PROJECT_ENDPOINT &&
    process.env.AZURE_PROJECT_API_KEY
  );
}
