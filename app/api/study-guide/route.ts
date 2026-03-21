import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/azureOpenAI';

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

    const completion = await createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    const studyGuide = completion.choices[0]?.message?.content || 'Failed to generate study guide.';
    return NextResponse.json({ studyGuide });
  } catch (error: any) {
    console.error('Study Guide Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate study guide' },
      { status: 500 }
    );
  }
}
