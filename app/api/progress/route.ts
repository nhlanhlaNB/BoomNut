import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get progress analytics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const timeframe = searchParams.get('timeframe') || '30'; // days

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // In a real app, fetch from database
    // Mock analytics for now
    const analytics = {
      overallProgress: {
        totalStudyTime: 1250, // minutes
        sessionsCompleted: 45,
        averageSessionLength: 28,
        currentStreak: 7, // days
        longestStreak: 14,
      },
      subjectProgress: [
        {
          subject: 'Mathematics',
          timeSpent: 450,
          accuracy: 85,
          improvement: 12,
          sessions: 15,
          strengths: ['Algebra', 'Geometry'],
          weaknesses: ['Calculus', 'Statistics'],
        },
        {
          subject: 'Physics',
          timeSpent: 380,
          accuracy: 78,
          improvement: 8,
          sessions: 12,
          strengths: ['Mechanics', 'Thermodynamics'],
          weaknesses: ['Quantum Physics', 'Relativity'],
        },
        {
          subject: 'Chemistry',
          timeSpent: 420,
          accuracy: 82,
          improvement: 15,
          sessions: 18,
          strengths: ['Organic Chemistry', 'Reactions'],
          weaknesses: ['Physical Chemistry'],
        },
      ],
      recentAchievements: [
        {
          id: '1',
          type: 'streak',
          title: '7-Day Streak',
          description: 'Studied for 7 consecutive days',
          unlockedAt: new Date().toISOString(),
          icon: '🔥',
        },
        {
          id: '2',
          type: 'quiz_master',
          title: 'Quiz Master',
          description: 'Scored 90%+ on 5 quizzes',
          unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          icon: '🏆',
        },
      ],
      weeklyActivity: [
        { day: 'Mon', minutes: 45 },
        { day: 'Tue', minutes: 60 },
        { day: 'Wed', minutes: 30 },
        { day: 'Thu', minutes: 55 },
        { day: 'Fri', minutes: 40 },
        { day: 'Sat', minutes: 70 },
        { day: 'Sun', minutes: 50 },
      ],
      recommendations: [] as string[],
    };

    // Generate AI recommendations
    const recommendationsPrompt = `Based on this student's progress data, provide 3-5 personalized study recommendations:

Study Time: ${analytics.overallProgress.totalStudyTime} minutes
Accuracy: Average 81.7%
Subjects: Mathematics (85% accuracy), Physics (78% accuracy), Chemistry (82% accuracy)
Strengths: Algebra, Geometry, Mechanics, Thermodynamics, Organic Chemistry
Weaknesses: Calculus, Statistics, Quantum Physics, Relativity, Physical Chemistry
Current Streak: ${analytics.overallProgress.currentStreak} days

Provide actionable, specific recommendations for improvement.
Return as JSON: {"recommendations": ["Recommendation 1", "Recommendation 2", ...]}`;

    const recResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an educational advisor providing personalized study recommendations based on student data.',
        },
        {
          role: 'user',
          content: recommendationsPrompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    try {
      const parsed = JSON.parse(recResponse.choices[0]?.message?.content || '{}');
      analytics.recommendations = parsed.recommendations || [];
    } catch (e) {
      analytics.recommendations = [
        'Focus on your weaker topics with targeted practice',
        'Maintain your study streak for consistent progress',
        'Review flashcards daily using spaced repetition',
      ];
    }

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Progress analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Track study session
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      subject,
      topic,
      duration, // minutes
      score,
      accuracy,
      activityType, // 'flashcard', 'quiz', 'reading', 'video'
    } = await req.json();

    if (!userId || !subject || !duration) {
      return NextResponse.json(
        { error: 'User ID, subject, and duration required' },
        { status: 400 }
      );
    }

    // In a real app, save to database
    // Check for achievements
    const achievements = [];

    // Example: Check for streak achievement
    // This would query the database in a real app
    const currentStreak = 7; // Mock value

    if (currentStreak === 7) {
      achievements.push({
        type: 'streak',
        title: '7-Day Streak!',
        description: 'You studied for 7 consecutive days!',
        icon: '🔥',
      });
    }

    if (score && score >= 90) {
      achievements.push({
        type: 'high_score',
        title: 'Excellence!',
        description: 'Scored 90% or higher!',
        icon: '⭐',
      });
    }

    return NextResponse.json({
      success: true,
      achievements,
      message: 'Progress tracked successfully',
    });
  } catch (error: any) {
    console.error('Track progress error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track progress' },
      { status: 500 }
    );
  }
}
