import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/azureOpenAI';

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

    const completion = await createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      maxTokens: 1800,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const flashcardsData = JSON.parse(responseText);
    
    const flashcards = Array.isArray(flashcardsData) 
      ? flashcardsData 
      : flashcardsData.flashcards || [];

    return NextResponse.json({ flashcards });
  } catch (error: any) {
    console.error('Flashcard Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}
