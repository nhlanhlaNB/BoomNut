import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const { content, questionTypes, count = 10, difficulty = 'medium', subject } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const types = questionTypes || ['multiple-choice', 'true-false', 'fill-in-blank', 'short-answer'];
    
    const prompt = `Create ${count} quiz questions from the following content. 
Include these question types: ${types.join(', ')}.
Difficulty level: ${difficulty}
Subject: ${subject || 'general'}

For each question, provide:
1. Question text
2. Question type
3. Options (for multiple choice)
4. Correct answer
5. Explanation
6. Points (1-5 based on difficulty)

Content:
${content}

Return as JSON in this format:
{
  "questions": [
    {
      "id": "1",
      "type": "multiple-choice",
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why A is correct",
      "points": 2
    }
  ],
  "totalPoints": 20,
  "timeLimit": 30
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator creating comprehensive assessments. Generate diverse, well-crafted quiz questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const quiz = JSON.parse(response.choices[0]?.message?.content || '{}');

    return NextResponse.json({
      quiz,
      success: true,
    });
  } catch (error: any) {
    console.error('Enhanced quiz generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

// Grade quiz attempt
export async function PUT(req: NextRequest) {
  try {
    const { quizId, answers, questions } = await req.json();

    if (!answers || !questions) {
      return NextResponse.json(
        { error: 'Answers and questions required' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    // Grade each answer
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = answers[i];
      
      totalPoints += question.points || 1;
      
      let isCorrect = false;
      let feedback = '';

      if (question.type === 'short-answer' && openai) {
        // Use AI to grade short answer
        try {
          const gradeResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are grading a student answer. Provide a score (0-1), feedback, and whether it should be marked correct.',
            },
            {
              role: 'user',
              content: `Question: ${question.question}
Correct Answer: ${question.correctAnswer}
Student Answer: ${userAnswer}
Points: ${question.points}

Return JSON: {"score": 0.8, "feedback": "Good answer but...", "isCorrect": true}`,
            },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        const grading = JSON.parse(gradeResponse.choices[0]?.message?.content || '{}');
        isCorrect = grading.isCorrect;
        feedback = grading.feedback;
        earnedPoints += (question.points || 1) * (grading.score || 0);
        } catch (error) {
          console.error('AI grading failed:', error);
          // Fallback to simple matching
          isCorrect = userAnswer?.toString().toLowerCase().includes(question.correctAnswer?.toString().toLowerCase());
          if (isCorrect) {
            earnedPoints += question.points || 1;
            feedback = 'Answer accepted';
          } else {
            feedback = `Expected: ${question.correctAnswer}`;
          }
        }
      } else {
        // Auto-grade objective questions
        isCorrect = userAnswer?.toString().toLowerCase() === question.correctAnswer?.toString().toLowerCase();
        if (isCorrect) {
          earnedPoints += question.points || 1;
          feedback = question.explanation || 'Correct!';
        } else {
          feedback = `Incorrect. ${question.explanation || ''}`;
        }
      }

      gradedAnswers.push({
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        feedback,
        pointsEarned: isCorrect ? (question.points || 1) : 0,
      });
    }

    const percentage = (earnedPoints / totalPoints) * 100;
    
    // Generate overall feedback
    let overallFeedback = '';
    if (openai) {
      try {
        const feedbackResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'Provide encouraging, constructive feedback for a student based on their quiz performance.',
            },
            {
              role: 'user',
              content: `Student scored ${percentage.toFixed(1)}% (${earnedPoints}/${totalPoints} points). 
Questions answered: ${gradedAnswers.length}
Correct: ${gradedAnswers.filter(a => a.isCorrect).length}

Provide brief, personalized feedback and study suggestions.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 200,
        });

        overallFeedback = feedbackResponse.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('Failed to generate feedback:', error);
      }
    }
    
    if (!overallFeedback) {
      overallFeedback = percentage >= 80 
        ? 'Great job! Keep up the excellent work.' 
        : percentage >= 60 
        ? 'Good effort! Review the topics you missed and try again.' 
        : 'Keep practicing! Focus on understanding the core concepts.';
    }

    return NextResponse.json({
      score: earnedPoints,
      totalPoints,
      percentage: Math.round(percentage * 10) / 10,
      gradedAnswers,
      overallFeedback,
      passed: percentage >= 70,
    });
  } catch (error: any) {
    console.error('Quiz grading error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to grade quiz' },
      { status: 500 }
    );
  }
}
