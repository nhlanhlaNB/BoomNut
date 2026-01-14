import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export async function POST(request: NextRequest) {
  try {
    const { content, format = 'comprehensive' } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert at creating comprehensive study guides. Create a ${format} study guide from the provided content.

The study guide should include:
- Key concepts and definitions
- Important topics breakdown
- Summary of main ideas
- Practice questions
- Memory aids and mnemonics
- Visual organization with sections

Format your response in clear, well-structured markdown with headings, bullet points, and emphasis where appropriate.`;

    const userPrompt = `Create a ${format} study guide from this content:\n\n${content}`;

    try {
      // Try Groq first
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const studyGuide = completion.choices[0]?.message?.content || 'Failed to generate study guide.';
      return NextResponse.json({ studyGuide });
    } catch (groqError) {
      console.log('Groq failed, trying OpenRouter fallback:', groqError);
      
      // Fallback to OpenRouter
      const completion = await openrouter.chat.completions.create({
        model: 'deepseek/deepseek-v3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const studyGuide = completion.choices[0]?.message?.content || 'Failed to generate study guide.';
      return NextResponse.json({ studyGuide });
    }
  } catch (error: any) {
    console.error('Study Guide Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate study guide' },
      { status: 500 }
    );
  }
}
