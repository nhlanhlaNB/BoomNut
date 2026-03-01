import { NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/azureOpenAI';

export async function POST(req: Request) {
  try {
    const { topic, subject, complexity, includeVisuals, includeAnalogies } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const complexityMap: Record<string, string> = {
      simple: 'Explain like I\'m 5 years old - use very simple terms and everyday examples',
      medium: 'Explain at a high school level - use clear language with some technical terms',
      detailed: 'Explain at a college level - include technical details and nuances',
      expert: 'Explain at a graduate level - use advanced terminology and comprehensive analysis'
    };

    const completion = await createChatCompletion({
      messages: [
        {
          role: 'system',
          content: `You are an expert ${subject} educator who excels at making complex concepts accessible. ${complexityMap[complexity] || complexityMap.medium}. Your explanations are clear, engaging, and pedagogically sound. Always respond with valid JSON only.`
        },
        {
          role: 'user',
          content: `Explain this concept: "${topic}"

Provide a comprehensive explanation as JSON with this structure:
{
  "title": "Clear title for the concept",
  "simpleExplanation": "A 2-3 sentence summary anyone can understand",
  "detailedExplanation": "Comprehensive explanation (3-5 paragraphs) with markdown formatting",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4"],
  "examples": ["practical example 1", "practical example 2", "practical example 3"],
  ${includeAnalogies ? '"analogies": ["analogy 1", "analogy 2"],' : ''}
  ${includeVisuals ? '"visualSuggestions": ["diagram/chart type 1", "diagram type 2"],' : ''}
  "commonMistakes": ["mistake 1", "mistake 2", "mistake 3"],
  "relatedConcepts": ["concept 1", "concept 2", "concept 3"]
}`
        }
      ],
      maxTokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse explanation response');
    }

    const explanation = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ explanation });
  } catch (error: any) {
    console.error('=== Explainer API Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================');
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate explanation',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.stack,
          type: error.constructor.name 
        })
      },
      { status: 500 }
    );
  }
}
