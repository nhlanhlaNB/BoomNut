import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Generate study plan
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      subjects,
      goals,
      deadline,
      availableTime, // hours per week
      learningPace, // slow, medium, fast
      preferences,
    } = await req.json();

    if (!subjects || subjects.length === 0) {
      return NextResponse.json(
        { error: 'At least one subject is required' },
        { status: 400 }
      );
    }

    const prompt = `Create a personalized study plan with the following details:

Subjects: ${subjects.join(', ')}
Goals: ${goals || 'General mastery'}
Deadline: ${deadline || 'No specific deadline'}
Available Time: ${availableTime || 10} hours per week
Learning Pace: ${learningPace || 'medium'}
Preferences: ${preferences || 'Balanced mix of activities'}

Generate a comprehensive study plan including:
1. Weekly schedule with specific time blocks
2. Daily tasks and goals
3. Recommended study techniques for each subject
4. Milestone checkpoints
5. Break times and self-care reminders
6. Progress tracking methods

Return as JSON in this format:
{
  "title": "Study Plan Title",
  "overview": "Brief overview",
  "totalWeeks": 4,
  "weeklySchedule": [
    {
      "week": 1,
      "focus": "Foundation Building",
      "days": [
        {
          "day": "Monday",
          "sessions": [
            {
              "time": "9:00 AM - 10:30 AM",
              "subject": "Mathematics",
              "activity": "Review Algebra basics",
              "resources": ["Textbook Ch. 1-2", "Practice problems"]
            }
          ]
        }
      ],
      "goals": ["Goal 1", "Goal 2"],
      "milestones": ["Milestone 1"]
    }
  ],
  "studyTips": ["Tip 1", "Tip 2"],
  "resources": ["Resource 1", "Resource 2"]
}`;

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert study planner and educational strategist. Create detailed, realistic, and effective study plans.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
      max_tokens: 3000,
    });

    const studyPlan = JSON.parse(response.choices[0]?.message?.content || '{}');

    return NextResponse.json({
      studyPlan,
      success: true,
    });
  } catch (error: any) {
    console.error('Study plan generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate study plan' },
      { status: 500 }
    );
  }
}

// Get existing study plans
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // In a real app, fetch from database
    return NextResponse.json({
      plans: [],
    });
  } catch (error: any) {
    console.error('Fetch study plans error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch study plans' },
      { status: 500 }
    );
  }
}

// Update study plan progress
export async function PUT(req: NextRequest) {
  try {
    const { planId, weekNumber, dayNumber, sessionCompleted } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID required' },
        { status: 400 }
      );
    }

    // In a real app, update database
    return NextResponse.json({
      success: true,
      message: 'Progress updated',
    });
  } catch (error: any) {
    console.error('Update study plan error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update plan' },
      { status: 500 }
    );
  }
}
