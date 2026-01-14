/**
 * Azure AI Agent Client
 * Handles communication with Azure AI Projects for agent-based interactions
 */

import { DefaultAzureCredential } from '@azure/identity';

interface AgentConfig {
  endpoint: string;
  agentName: string;
  modelDeployment: string;
  instructions: string;
}

interface AgentResponse {
  outputText: string;
  error?: string;
}

/**
 * Create or update an agent with the given configuration
 */
export async function createAgent(config: AgentConfig) {
  try {
    // Note: Azure AI Projects SDK needs to be installed via Python
    // This is a REST API wrapper for Next.js
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken('https://cognitiveservices.azure.com/.default');

    const response = await fetch(`${config.endpoint}/agents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.agentName,
        model: config.modelDeployment,
        instructions: config.instructions,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create agent: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
}

/**
 * Send a message to an agent and get a response
 */
export async function chatWithAgent(
  endpoint: string,
  agentName: string,
  messages: Array<{ role: string; content: string }>
): Promise<AgentResponse> {
  try {
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken('https://cognitiveservices.azure.com/.default');

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        agent: {
          name: agentName,
          type: 'agent_reference',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent chat failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      outputText: data.choices?.[0]?.message?.content || '',
    };
  } catch (error: any) {
    console.error('Error chatting with agent:', error);
    return {
      outputText: '',
      error: error.message,
    };
  }
}

/**
 * Predefined agent configurations for different learning modes
 */
export const AGENT_CONFIGS = {
  tutor: {
    agentName: 'spark-e-tutor',
    instructions: `You are Spark.E, an expert AI tutor. Your role is to:
- Explain concepts clearly and patiently
- Break down complex topics into understandable parts
- Provide examples and analogies
- Ask questions to check understanding
- Encourage critical thinking
- Adapt your teaching style to the student's level
- Be supportive and encouraging`,
  },
  
  flashcardGenerator: {
    agentName: 'flashcard-generator',
    instructions: `You are a flashcard generation specialist. Create effective flashcards that:
- Focus on key concepts and definitions
- Use clear, concise language
- Include memory aids when helpful
- Follow spaced repetition principles
- Format: Front (question/term) and Back (answer/definition)`,
  },
  
  quizMaster: {
    agentName: 'quiz-master',
    instructions: `You are a quiz generation expert. Create educational quizzes that:
- Test understanding, not just memorization
- Include multiple choice, true/false, and short answer questions
- Provide difficulty levels
- Give explanations for correct answers
- Make learning engaging and challenging`,
  },
  
  studyGuideCreator: {
    agentName: 'study-guide-creator',
    instructions: `You are a study guide specialist. Create comprehensive study guides that:
- Organize information hierarchically
- Highlight key concepts and definitions
- Include examples and applications
- Suggest learning strategies
- Structure content for maximum retention`,
  },
  
  summarizer: {
    agentName: 'content-summarizer',
    instructions: `You are a content summarization expert. Create summaries that:
- Capture main ideas and key points
- Maintain logical flow and structure
- Use clear, accessible language
- Preserve important details
- Scale to requested length`,
  },
};
