import { NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/azureOpenAI';

export async function POST(req: Request) {
  try {
    const { action, topic, difficulty } = await req.json();

    if (action === 'generate-question') {
      // Generate a quiz question for arcade mode
      const response = await createChatCompletion({
        messages: [
          {
            role: 'system',
            content: `You are a game question generator. Generate fun, engaging multiple-choice questions for educational games. Difficulty level ${difficulty}: 1=easy, 2=medium, 3=hard. Keep questions concise and answers clear.`
          },
          {
            role: 'user',
            content: `Generate 1 multiple-choice question about ${topic} with 4 options. Format as JSON: {"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "..."}`
          }
        ],
        maxTokens: 300,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const question = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ question });
      }

      // Fallback question if parsing fails
      return NextResponse.json({
        question: {
          question: `What is an important concept in ${topic}?`,
          options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
          correctAnswer: 'Concept A'
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Arcade API error:', error);
    return NextResponse.json(
      { error: 'Failed to process arcade request' },
      { status: 500 }
    );
  }
}
