#!/usr/bin/env node

/**
 * Azure AI Agent Setup Script
 * Initializes agents for different learning modes
 */

const { DefaultAzureCredential } = require('@azure/identity');

const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT || 'https://redcow-resource.services.ai.azure.com/api/projects/redcow';
const MODEL_DEPLOYMENT = process.env.AZURE_MODEL_DEPLOYMENT || 'gpt-4o';

const AGENTS = [
  {
    name: 'spark-e-tutor',
    instructions: `You are Spark.E, an expert AI tutor. Your role is to:
- Explain concepts clearly and patiently
- Break down complex topics into understandable parts
- Provide examples and analogies
- Ask questions to check understanding
- Encourage critical thinking
- Adapt your teaching style to the student's level
- Be supportive and encouraging
- Grade essays and assignments with constructive feedback`,
  },
  {
    name: 'flashcard-generator',
    instructions: `You are a flashcard generation specialist. Create effective flashcards that:
- Focus on key concepts and definitions
- Use clear, concise language
- Include memory aids when helpful
- Follow spaced repetition principles
- Format as JSON: [{"front": "question", "back": "answer"}]`,
  },
  {
    name: 'quiz-master',
    instructions: `You are a quiz generation expert. Create educational quizzes that:
- Test understanding, not just memorization
- Include multiple choice, true/false, and short answer questions
- Provide difficulty levels
- Give explanations for correct answers
- Format as JSON with structured quiz data`,
  },
  {
    name: 'study-guide-creator',
    instructions: `You are a study guide specialist. Create comprehensive study guides that:
- Organize information hierarchically
- Highlight key concepts and definitions
- Include examples and applications
- Suggest learning strategies
- Structure content for maximum retention`,
  },
  {
    name: 'content-summarizer',
    instructions: `You are a content summarization expert. Create summaries that:
- Capture main ideas and key points
- Maintain logical flow and structure
- Use clear, accessible language
- Preserve important details
- Scale to requested length`,
  },
];

async function createAgent(agentConfig) {
  try {
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken('https://cognitiveservices.azure.com/.default');

    const response = await fetch(`${AZURE_AI_ENDPOINT}/agents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: agentConfig.name,
        model: MODEL_DEPLOYMENT,
        instructions: agentConfig.instructions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create agent ${agentConfig.name}: ${error}`);
    }

    const data = await response.json();
    console.log(`✅ Created agent: ${agentConfig.name}`);
    return data;
  } catch (error) {
    console.error(`❌ Error creating agent ${agentConfig.name}:`, error.message);
    throw error;
  }
}

async function initializeAgents() {
  console.log('🚀 Initializing Azure AI Agents...\n');
  console.log(`Endpoint: ${AZURE_AI_ENDPOINT}`);
  console.log(`Model: ${MODEL_DEPLOYMENT}\n`);

  for (const agent of AGENTS) {
    try {
      await createAgent(agent);
    } catch (error) {
      console.error(`Failed to create agent: ${agent.name}`);
    }
  }

  console.log('\n✅ Agent initialization complete!');
}

// Run if called directly
if (require.main === module) {
  initializeAgents().catch(console.error);
}

module.exports = { initializeAgents, createAgent };
