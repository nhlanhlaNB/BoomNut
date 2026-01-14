// Spaced Repetition Algorithm (SuperMemo SM-2)

export interface FlashcardData {
  interval: number; // Days until next review
  repetitions: number;
  easeFactor: number;
  nextReview: Date;
}

export function calculateNextReview(
  quality: number, // 0-5 rating (0=complete blackout, 5=perfect response)
  currentData: FlashcardData
): FlashcardData {
  let { interval, repetitions, easeFactor } = currentData;

  // Quality must be 0-5
  quality = Math.max(0, Math.min(5, quality));

  // Update ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // If quality < 3, reset repetitions
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    interval,
    repetitions,
    easeFactor,
    nextReview,
  };
}

export function getDueFlashcards(flashcards: any[]): any[] {
  const now = new Date();
  return flashcards.filter(card => new Date(card.nextReview) <= now);
}

export function getStudyStatistics(reviews: any[]) {
  const total = reviews.length;
  if (total === 0) {
    return {
      total: 0,
      averageQuality: 0,
      retention: 0,
      streakDays: 0,
    };
  }

  const totalQuality = reviews.reduce((sum, r) => sum + r.quality, 0);
  const averageQuality = totalQuality / total;
  const passing = reviews.filter(r => r.quality >= 3).length;
  const retention = (passing / total) * 100;

  // Calculate streak
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  let streakDays = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const review of sortedReviews) {
    const reviewDate = new Date(review.createdAt);
    reviewDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor(
      (currentDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streakDays) {
      streakDays++;
    } else if (diffDays > streakDays) {
      break;
    }
  }

  return {
    total,
    averageQuality: Math.round(averageQuality * 100) / 100,
    retention: Math.round(retention),
    streakDays,
  };
}
