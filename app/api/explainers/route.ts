import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
            content: `You are an expert ${subject} educator who excels at making complex concepts accessible. ${complexityMap[complexity] || complexityMap.medium}. Your explanations are clear, engaging, and pedagogically sound.`
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
        temperature: 0.7,
        max_tokens: 3000
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse explanation response');
    }

    const explanation = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Explainer error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
