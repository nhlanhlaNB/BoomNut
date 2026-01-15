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
    const { content, count = 10 } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert at creating educational flashcards. Generate ${count} flashcards from the provided content. 
          
Format your response as a JSON array with this structure:
[
  {
    "question": "Question or concept to test",
    "answer": "Clear, concise answer",
    "category": "Subject category"
  }
]

Make flashcards that:
- Test key concepts and important details
- Are clear and unambiguous
- Cover different aspects of the topic
- Use varied question styles (what, why, how, define, explain)
- Are appropriate for active recall study`;

    const userPrompt = `Generate ${count} flashcards from this content:\n\n${content}`;

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
      const flashcardsData = JSON.parse(responseText);
      
      const flashcards = Array.isArray(flashcardsData) 
        ? flashcardsData 
        : flashcardsData.flashcards || [];

      return NextResponse.json({ flashcards });
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
      const flashcardsData = JSON.parse(responseText);
      
      const flashcards = Array.isArray(flashcardsData) 
        ? flashcardsData 
        : flashcardsData.flashcards || [];

      return NextResponse.json({ flashcards });
    }
  } catch (error: any) {
    console.error('Flashcard Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}
