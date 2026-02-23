import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  try {
    const { essay, prompt, subject, gradeLevel } = await req.json();

    if (!essay) {
      return NextResponse.json(
        { error: 'Essay text is required' },
        { status: 400 }
      );
    }

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
            content: `You are an expert ${subject} teacher grading a ${gradeLevel} level essay. Provide comprehensive, constructive feedback that helps students improve. Grade on a standard A-F scale with + and - modifiers.`
          },
          {
            role: 'user',
            content: `Please grade this essay and provide detailed feedback:

${prompt ? `Prompt: ${prompt}\n\n` : ''}Essay:
${essay}

Provide your response as JSON with this structure:
{
  "grade": "A/B+/B/C/etc",
  "score": 85,
  "totalPoints": 100,
  "clarity": 90,
  "coherence": 85,
  "evidence": 80,
  "grammarIssues": 2,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "detailedFeedback": "Comprehensive paragraph explaining the grade...",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
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
      throw new Error('Failed to parse grading response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Essay grading error:', error);
    return NextResponse.json(
      { error: 'Failed to grade essay' },
      { status: 500 }
    );
  }
}
