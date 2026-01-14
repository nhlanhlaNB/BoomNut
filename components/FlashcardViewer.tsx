'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

type Flashcard = {
  question: string;
  answer: string;
  category?: string;
};

type FlashcardViewerProps = {
  flashcards: Flashcard[];
  onClose?: () => void;
};

export default function FlashcardViewer({ flashcards, onClose }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMastered = () => {
    setMasteredCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
  };

  const handleReset = () => {
    setMasteredCards(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const masteredCount = masteredCards.size;
  const progressPercentage = (masteredCount / flashcards.length) * 100;

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No flashcards available
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {masteredCount} / {flashcards.length} cards mastered
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Card Counter */}
      <div className="text-center mb-4 text-sm text-gray-600">
        Card {currentIndex + 1} of {flashcards.length}
        {currentCard.category && (
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
            {currentCard.category}
          </span>
        )}
      </div>

      {/* Flashcard */}
      <div
        className="relative h-96 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front of card */}
          <div className="absolute w-full h-full backface-hidden">
            <div className="w-full h-full bg-white border-2 border-gray-200 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
              <div className="text-sm text-gray-500 mb-4">Question</div>
              <p className="text-xl md:text-2xl font-medium text-center text-gray-800">
                {currentCard.question}
              </p>
              <div className="mt-8 text-sm text-gray-400">Click to flip</div>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center text-white">
              <div className="text-sm opacity-90 mb-4">Answer</div>
              <p className="text-xl md:text-2xl font-medium text-center">
                {currentCard.answer}
              </p>
              <div className="mt-8 text-sm opacity-75">Click to flip back</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handlePrevious}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <button
          onClick={handleMastered}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            masteredCards.has(currentIndex)
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {masteredCards.has(currentIndex) ? '✓ Mastered' : 'Mark as Mastered'}
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
        >
          Close Flashcards
        </button>
      )}

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
