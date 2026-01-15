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
    const { content, length = 'medium' } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const lengthGuidelines = {
      short: '2-3 paragraphs',
      medium: '1 page',
      long: '2-3 pages with detailed explanations'
    };

    const systemPrompt = `You are an expert at summarizing educational content. Create a ${length} summary (${lengthGuidelines[length as keyof typeof lengthGuidelines] || lengthGuidelines.medium}).

Your summary should:
- Capture all key concepts and main ideas
- Use clear, concise language
- Organize information logically
- Highlight important terms and definitions
- Be easy to review and understand
- Include bullet points for key takeaways

Format in markdown with appropriate headings and emphasis.`;

    const userPrompt = `Summarize this content:\n\n${content}`;

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
        temperature: 0.5,
        max_tokens: 1500,
      });

      const summary = completion.choices[0]?.message?.content || 'Failed to generate summary.';
      return NextResponse.json({ summary });
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
        temperature: 0.5,
        max_tokens: 1500,
      });

      const summary = completion.choices[0]?.message?.content || 'Failed to generate summary.';
      return NextResponse.json({ summary });
    }
  } catch (error: any) {
    console.error('Summarization Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to summarize content' },
      { status: 500 }
    );
  }
}
