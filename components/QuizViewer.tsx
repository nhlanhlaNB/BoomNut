'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type QuizViewerProps = {
  quiz: {
    title: string;
    difficulty: string;
    questions: QuizQuestion[];
  };
  onClose?: () => void;
};

export default function QuizViewer({ quiz, onClose }: QuizViewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
    setShowExplanation(false);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: selectedAnswer
    }));
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setShowResults(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    Object.entries(answers).forEach(([index, answer]) => {
      if (quiz.questions[Number(index)].correctAnswer === answer) {
        correct++;
      }
    });
    return { correct, total: quiz.questions.length };
  };

  if (showResults) {
    const { correct, total } = calculateScore();
    const percentage = ((correct / total) * 100).toFixed(0);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Quiz Complete! 🎉</h2>
          <div className="text-6xl font-bold text-blue-600 my-6">
            {percentage}%
          </div>
          <p className="text-xl text-gray-600 mb-8">
            You got {correct} out of {total} questions correct!
          </p>

          {/* Review answers */}
          <div className="space-y-4 text-left mb-6">
            {quiz.questions.map((q, idx) => {
              const userAnswer = answers[idx];
              const isCorrect = userAnswer === q.correctAnswer;

              return (
                <div key={q.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-2">{q.question}</p>
                      <p className="text-sm text-gray-600">
                        Your answer: {q.options[userAnswer]}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600 mt-1">
                          Correct answer: {q.options[q.correctAnswer]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setCurrentQuestionIndex(0);
                setSelectedAnswer(null);
                setAnswers({});
                setShowResults(false);
                setShowExplanation(false);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retake Quiz
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{quiz.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full capitalize">
            {quiz.difficulty}
          </span>
          <span>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showCorrectness = showExplanation;

            let buttonClass = 'w-full text-left p-4 rounded-lg border-2 transition-colors ';
            
            if (showCorrectness) {
              if (isCorrect) {
                buttonClass += 'border-green-500 bg-green-50 text-green-900';
              } else if (isSelected) {
                buttonClass += 'border-red-500 bg-red-50 text-red-900';
              } else {
                buttonClass += 'border-gray-200 bg-gray-50 text-gray-600';
              }
            } else {
              buttonClass += isSelected
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
            }

            return (
              <button
                key={index}
                onClick={() => !showExplanation && handleAnswerSelect(index)}
                disabled={showExplanation}
                className={buttonClass}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showCorrectness && isCorrect && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                  {showCorrectness && isSelected && !isCorrect && (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
            <p className="text-sm text-blue-800">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {Object.keys(answers).length} / {quiz.questions.length} answered
        </div>
        
        {!showExplanation ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLastQuestion ? 'View Results' : 'Next Question'}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Exit Quiz
        </button>
      )}
    </div>
  );
}
