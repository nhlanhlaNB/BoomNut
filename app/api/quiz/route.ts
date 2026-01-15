import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) return null;
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function getOpenRouterClient() {
  if (!process.env.OPENROUTER_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });
}

export async function POST(request: NextRequest) {
  try {
    const { content, questionCount = 10, difficulty = 'medium' } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert at creating educational quizzes. Generate a ${difficulty} difficulty quiz with ${questionCount} multiple-choice questions from the provided content.

Format your response as a JSON object with this structure:
{
  "quiz": {
    "title": "Quiz Title",
    "difficulty": "${difficulty}",
    "questions": [
      {
        "id": 1,
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Why this answer is correct"
      }
    ]
  }
}

Make questions that:
- Test understanding, not just memorization
- Have 4 plausible options
- Include clear explanations
- Cover different aspects of the topic
- Are appropriately challenging for ${difficulty} level`;

    const userPrompt = `Generate a ${difficulty} quiz with ${questionCount} questions from this content:\n\n${content}`;

    const groq = getGroqClient();
    
    try {
      // Try Groq first
      if (!groq) throw new Error('Groq not configured');
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const quizData = JSON.parse(responseText);
      return NextResponse.json(quizData);
    } catch (groqError) {
      console.log('Groq failed, trying OpenRouter fallback:', groqError);
      
      const openrouter = getOpenRouterClient();
      if (!openrouter) {
        throw new Error('No AI provider configured. Please set GROQ_API_KEY or OPENROUTER_API_KEY.');
      }
      
      // Fallback to OpenRouter
      const completion = await openrouter.chat.completions.create({
        model: 'deepseek/deepseek-v3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const quizData = JSON.parse(responseText);
      return NextResponse.json(quizData);
    }
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
