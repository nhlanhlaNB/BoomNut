<<<<<<< Updated upstream
import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/azureOpenAI';

export async function POST(req: NextRequest) {
=======
import { NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/azureOpenAI';

export async function POST(req: Request) {
>>>>>>> Stashed changes
  try {
    const { essay, prompt, subject, gradeLevel } = await req.json();

    if (!essay) {
      return NextResponse.json(
        { error: 'Essay text is required' },
        { status: 400 }
      );
    }

<<<<<<< Updated upstream
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }
=======
    const response = await createChatCompletion({
      messages: [
        {
          role: 'system',
          content: `You are an expert ${subject} teacher grading a ${gradeLevel} level essay. Provide comprehensive, constructive feedback that helps students improve. Grade on a standard A-F scale with + and - modifiers.`
        },
        {
          role: 'user',
          content: `Please grade this essay and provide detailed feedback:
>>>>>>> Stashed changes

    const systemMessage = `You are an expert ${subject} teacher grading a ${gradeLevel || 'High School'} level essay. Provide comprehensive, constructive feedback that helps students improve. Grade on a standard A-F scale with + and - modifiers.

Always respond with valid JSON only in this exact format:
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
<<<<<<< Updated upstream
}`;

    const userMessage = `Please grade this essay and provide detailed feedback:

${prompt ? `Prompt: ${prompt}\n\n` : ''}Essay:
${essay}`;

    const completion = await createChatCompletion({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
=======
}`
        }
>>>>>>> Stashed changes
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

<<<<<<< Updated upstream
    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('Empty response from AI model');
    }

=======
    const content = response.choices[0]?.message?.content || '';
    
>>>>>>> Stashed changes
    // Parse JSON from response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to extract JSON from response:', responseContent);
      throw new Error('Failed to parse grading response - invalid JSON format');
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('=== Essay Grading Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    console.error('===========================');
    
    return NextResponse.json(
      { error: error.message || 'Failed to grade essay. Please try again.' },
      { status: 500 }
    );
  }
}
