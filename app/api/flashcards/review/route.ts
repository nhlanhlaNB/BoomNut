import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI lazily to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Review flashcard and update spaced repetition
export async function POST(req: NextRequest) {
  try {
    const { flashcardId, quality } = await req.json();

    if (!flashcardId || quality === undefined) {
      return NextResponse.json(
        { error: 'Flashcard ID and quality rating required' },
        { status: 400 }
      );
    }

    // Calculate next review using SM-2 algorithm
    const { calculateNextReview } = await import('@/lib/spacedRepetition');
    
    // In a real app, fetch current flashcard data from database
    // For now, return calculated values
    const currentData = {
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      nextReview: new Date(),
    };

    const nextReview = calculateNextReview(quality, currentData);

    return NextResponse.json({
      success: true,
      nextReview,
    });
  } catch (error: any) {
    console.error('Review error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process review' },
      { status: 500 }
    );
  }
}

// Get due flashcards
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const userId = searchParams.get('userId');

    // In a real app, fetch from database
    // Mock response for now
    return NextResponse.json({
      dueCards: [],
      totalCards: 0,
      studyStreak: 0,
    });
  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch flashcards' },
      { status: 500 }
    );
  }
}
