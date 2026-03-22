import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/azureOpenAI';

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

    const completion = await createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      maxTokens: 1500,
    });

    const summary = completion.choices[0]?.message?.content || 'Failed to generate summary.';
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Summarization Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to summarize content' },
      { status: 500 }
    );
  }
}
