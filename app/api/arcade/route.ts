import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  try {
    const { action, topic, difficulty } = await req.json();

    if (action === 'generate-question') {
      // Generate a quiz question for arcade mode
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
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
          temperature: 0.8,
          max_tokens: 300
        }),
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
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
