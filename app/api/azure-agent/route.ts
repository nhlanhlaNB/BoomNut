import { NextRequest, NextResponse } from 'next/server';
import { DefaultAzureCredential } from '@azure/identity';

// Azure AI Projects configuration
const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT || 'https://redcow-resource.services.ai.azure.com/api/projects/redcow';
const AGENT_NAME = process.env.AZURE_AGENT_NAME || 'spark-e-tutor';
const MODEL_DEPLOYMENT = process.env.AZURE_MODEL_DEPLOYMENT || 'gpt-4o';

export async function POST(request: NextRequest) {
  try {
    const { messages, subject, uploadedFiles, image, language = 'en', mode = 'tutor' } = await request.json();

    // Build system instructions based on mode and subject
    let instructions = getInstructions(mode, subject, language, uploadedFiles);

    // Get Azure credential
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken('https://cognitiveservices.azure.com/.default');

    // Format messages for Azure AI
    const formattedMessages = [
      { role: 'system', content: instructions },
      ...messages,
    ];

    // Add image if provided
    if (image) {
      const lastMessage = formattedMessages[formattedMessages.length - 1];
      formattedMessages[formattedMessages.length - 1] = {
        role: lastMessage.role,
        content: [
          { type: 'text', text: lastMessage.content },
          { type: 'image_url', image_url: { url: image } },
        ],
      };
    }

    // Call Azure AI Agent
    const response = await fetch(`${AZURE_AI_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: formattedMessages,
        agent: {
          name: AGENT_NAME,
          type: 'agent_reference',
        },
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure AI API error: ${error}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({
      message: assistantMessage,
      usage: data.usage,
    });

  } catch (error: any) {
    console.error('Azure AI Agent error:', error);
    
    // Fallback to Groq if Azure fails
    try {
      const { Groq } = await import('groq-sdk');
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });

      const { messages, subject } = await request.json();
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are Spark.E, an expert AI tutor specializing in ${subject}. Explain concepts clearly and encourage learning.`,
          },
          ...messages,
        ],
        max_tokens: 2000,
      });

      return NextResponse.json({
        message: completion.choices[0]?.message?.content || 'Error generating response',
        fallback: true,
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Both Azure AI and fallback provider failed' },
        { status: 500 }
      );
    }
  }
}

function getInstructions(
  mode: string,
  subject: string,
  language: string,
  uploadedFiles?: string[]
): string {
  const baseInstructions = {
    tutor: `You are Spark.E, an expert AI tutor specializing in ${subject}. Your role is to:
- Explain concepts clearly and patiently
- Break down complex topics into understandable parts
- Provide examples and analogies
- Ask questions to check understanding
- Encourage critical thinking
- Adapt your teaching style to the student's level
- Be supportive and encouraging
- Grade essays and assignments with constructive feedback
${language !== 'en' ? `- Respond in ${language} language` : ''}`,

    flashcard: `You are a flashcard generation specialist for ${subject}. Create effective flashcards that:
- Focus on key concepts and definitions
- Use clear, concise language
- Include memory aids when helpful
- Follow spaced repetition principles
- Format as JSON: [{"front": "question", "back": "answer"}]`,

    quiz: `You are a quiz generation expert for ${subject}. Create educational quizzes that:
- Test understanding, not just memorization
- Include multiple choice questions
- Provide difficulty levels
- Give explanations for correct answers
- Format as JSON with questions, options, and correct answers`,

    guide: `You are a study guide specialist for ${subject}. Create comprehensive study guides that:
- Organize information hierarchically
- Highlight key concepts and definitions
- Include examples and applications
- Suggest learning strategies
- Structure content for maximum retention`,

    summarize: `You are a content summarization expert for ${subject}. Create summaries that:
- Capture main ideas and key points
- Maintain logical flow and structure
- Use clear, accessible language
- Preserve important details`,
  };

  let instructions = baseInstructions[mode as keyof typeof baseInstructions] || baseInstructions.tutor;

  if (uploadedFiles && uploadedFiles.length > 0) {
    instructions += `\n\nThe student has uploaded study materials: ${uploadedFiles.join(', ')}. Reference these materials when answering questions.`;
  }

  return instructions;
}
