/**
 * Azure OpenAI Client
 * Utility functions for interacting with Azure AI Project
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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

  if (!endpoint || !apiKey) {
    throw new Error('Azure AI Project credentials not configured');
  }

  return { endpoint, apiKey, apiVersion };
}

/**
 * Send a chat completion request to Azure OpenAI
 */
export async function createChatCompletion(options: ChatCompletionOptions) {
  const {
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    stream = false,
  } = options;

  const { endpoint, apiKey, apiVersion } = getAzureConfig('chat');
  const deployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-5.2-chat';

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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages,
      max_completion_tokens: maxTokens,
      stream,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
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
    temperature = 0.7,
    maxTokens = 2000,
  } = options;

  const { endpoint, apiKey, apiVersion } = getAzureConfig('chat');
  const deployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-5.2-chat';

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages,
      temperature,
      max_tokens: maxTokens,
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
    // Build the URL from base endpoint
    url = `${endpoint}/openai/deployments/${deployment}/audio/transcriptions?api-version=${apiVersion}`;
  }

  const formData = new FormData();
  formData.append('file', file);
  if (prompt) formData.append('prompt', prompt);
  formData.append('language', language);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
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
