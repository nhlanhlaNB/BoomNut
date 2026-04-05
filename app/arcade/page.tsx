'use client';

// Updated: Word Race game fully implemented - April 5, 2026
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2, Trophy, Zap, Target, Clock, Star, Award, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getRandomQuestion, getRandomWordRaceAnswer, getMemoryMatchPairs } from '@/lib/quizQuestions';

type GameMode = 'speed-quiz' | 'memory-match' | 'word-race' | null;

interface LeaderboardEntry {
  name: string;
  score: number;
  time: number;
  game: string;
}

export default function ArcadePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  // Speed Quiz State
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{isCorrect: boolean; selectedAnswer: string; correctAnswer: string; explanation?: string}>({
    isCorrect: false,
    selectedAnswer: '',
    correctAnswer: '',
    explanation: ''
  });

  // Memory Match State
  const [cards, setCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);

  // Word Race State
  const [currentWordQuestion, setCurrentWordQuestion] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [wordQuestionIndex, setWordQuestionIndex] = useState(0);
  const [wordRaceCorrect, setWordRaceCorrect] = useState(0);
  const [showWordRaceFeedback, setShowWordRaceFeedback] = useState(false);
  const [wordRaceFeedbackData, setWordRaceFeedbackData] = useState<{isCorrect: boolean; userAnswer: string; correctAnswer: string}>({
    isCorrect: false,
    userAnswer: '',
    correctAnswer: ''
  });

  // Check authentication on mount
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    loadLeaderboard();
    loadUserPoints();
  }, []);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
  }, [isPlaying, timeLeft]);

  const loadLeaderboard = () => {
    const stored = localStorage.getItem('arcade-leaderboard');
    if (stored) {
      setLeaderboard(JSON.parse(stored));
    }
  };

  const loadUserPoints = () => {
    const stored = localStorage.getItem('arcade-total-points');
    if (stored) {
      setTotalPoints(parseInt(stored));
    }
  };

  const saveScore = (game: string, finalScore: number, time: number) => {
    const entry: LeaderboardEntry = {
      name: user?.displayName || 'Guest Player',
      score: finalScore,
      time,
      game
    };
    
    const newLeaderboard = [...leaderboard, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    localStorage.setItem('arcade-leaderboard', JSON.stringify(newLeaderboard));
    setLeaderboard(newLeaderboard);

    const newTotal = totalPoints + finalScore;
    localStorage.setItem('arcade-total-points', newTotal.toString());
    setTotalPoints(newTotal);
  };

  const startSpeedQuiz = () => {
    setGameMode('speed-quiz');
    setIsPlaying(true);
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setQuestionIndex(0);
    setLevel(1);
    loadQuestion();
  };

  const loadQuestion = () => {
    const question = getRandomQuestion(undefined, level === 1 ? 'easy' : level === 2 ? 'medium' : 'hard');
    setCurrentQuestion(question);
  };

  const answerQuestion = async (answer: string) => {
    if (!currentQuestion) return;

    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      const points = (10 + streak * 5) * level;
      setScore(score + points);
      setStreak(streak + 1);
      
      if (streak > 0 && streak % 5 === 0) {
        setLevel(level + 1);
      }
    } else {
      setStreak(0);
    }

    // Show feedback before moving to next question
    setFeedbackData({
      isCorrect,
      selectedAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation || 'Good learning opportunity!'
    });
    setShowFeedback(true);
  };

  const continuToNextQuestion = () => {
    setShowFeedback(false);
    setQuestionIndex(questionIndex + 1);
    loadQuestion();
  };

  const startMemoryMatch = () => {
    setGameMode('memory-match');
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(120);
    
    // Create pairs of memory match cards
    const pairs = getMemoryMatchPairs().map((pair, idx) => ({
      id: `pair-${idx}`,
      term: pair.term,
      definition: pair.definition,
      pairId: idx,
      isFlipped: false,
    }));
    
    const shuffled = [...pairs, ...pairs]
      .sort(() => Math.random() - 0.5)
      .map((card, i) => ({ ...card, index: i }));
    
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedCards([]);
  };

  const flipCard = (index: number) => {
    if (flippedCards.length === 2 || matchedCards.includes(index)) return;
    
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first]?.pairId === cards[second]?.pairId) {
        setMatchedCards([...matchedCards, first, second]);
        setScore(score + 20);
        setFlippedCards([]);
        
        if (matchedCards.length + 2 === cards.length) {
          endGame();
        }
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  const startWordRace = () => {
    setGameMode('word-race');
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(90);
    setWordQuestionIndex(0);
    setWordRaceCorrect(0);
    setUserAnswer('');
    setLevel(1);
    loadWordQuestion();
  };

  const loadWordQuestion = () => {
    const wordAnswer = getRandomWordRaceAnswer();
    setCurrentWordQuestion({
      question: wordAnswer.question,
      correctAnswer: wordAnswer.answer,
      difficulty: wordAnswer.difficulty
    });
    setUserAnswer('');
  };

  const submitWordRaceAnswer = () => {
    if (!currentWordQuestion) return;
    
    const normalizeAnswer = (str: string) => str.trim().toLowerCase();
    const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(currentWordQuestion.correctAnswer);
    
    if (isCorrect) {
      const points = (15 + wordRaceCorrect * 3) * level;
      setScore(score + points);
      setWordRaceCorrect(wordRaceCorrect + 1);
      
      if (wordRaceCorrect > 0 && wordRaceCorrect % 5 === 0) {
        setLevel(level + 1);
      }
    } else {
      setWordRaceCorrect(0);
    }
    
    // Show feedback before moving to next question
    setWordRaceFeedbackData({
      isCorrect,
      userAnswer,
      correctAnswer: currentWordQuestion.correctAnswer
    });
    setShowWordRaceFeedback(true);
  };

  const continueToNextWordRaceQuestion = () => {
    setShowWordRaceFeedback(false);
    setWordQuestionIndex(wordQuestionIndex + 1);
    setUserAnswer('');
    loadWordQuestion();
  };

  const handleWordRaceKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitWordRaceAnswer();
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    if (gameMode) {
      saveScore(gameMode, score, 60 - timeLeft);
    }
  };

  const resetGame = () => {
    setGameMode(null);
    setIsPlaying(false);
    setScore(0);
    setLevel(1);
    setStreak(0);
  };

  if (!gameMode) {
    return (
      <main className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-gray-900">{totalPoints.toLocaleString()} pts</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-700 mb-4">
              <Gamepad2 className="w-4 h-4" />
              <span>Learn While You Play!</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-4">
              Study <span className="text-gray-900 font-bold">Arcade</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Turn learning into an adventure! Compete, earn points, and climb the leaderboard.
            </p>
          </div>

          {/* Game Selection */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <GameCard
              icon={<Zap className="w-16 h-16 text-yellow-500" />}
              title="Speed Quiz"
              description="Answer as many questions as you can before time runs out!"
              gradient="from-yellow-400 to-orange-500"
              difficulty="⚡ Fast-Paced"
              onPlay={startSpeedQuiz}
            />
            <GameCard
              icon={<Target className="w-16 h-16 text-purple-500" />}
              title="Memory Match"
              description="Find matching pairs of study concepts and terms!"
              gradient="from-purple-400 to-pink-500"
              difficulty="🧠 Brain Training"
              onPlay={startMemoryMatch}
            />
            <GameCard
              icon={<Star className="w-16 h-16 text-blue-500" />}
              title="Word Race"
              description="Type the correct answers as fast as possible!"
              gradient="from-blue-400 to-cyan-500"
              difficulty="⌨️ Speed Typing"
              onPlay={startWordRace}
            />
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h2 className="text-3xl font-black text-gray-900">Leaderboard</h2>
            </div>
            
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{entry.name}</div>
                        <div className="text-sm text-gray-500">{entry.game}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-purple-600">{entry.score} pts</div>
                      <div className="text-sm text-gray-500">{entry.time}s</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No scores yet. Be the first to play!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Game Playing UI
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Exit Game
            </button>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{score}</span>
              </div>
              
              {gameMode === 'speed-quiz' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-lg">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <span className="font-bold text-orange-600">x{streak} Streak</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">{timeLeft}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Speed Quiz */}
        {gameMode === 'speed-quiz' && currentQuestion && !showFeedback && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-2">Question {questionIndex + 1} • Level {level}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentQuestion.question}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options?.map((option: string, i: number) => (
                <button
                  key={i}
                  onClick={() => answerQuestion(option)}
                  className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition text-left font-semibold text-gray-900"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Card */}
        {gameMode === 'speed-quiz' && showFeedback && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              {feedbackData.isCorrect ? (
                <div>
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-green-600 mb-2">Correct!</h2>
                  <p className="text-lg text-gray-600">Great job! You earned bonus points for your streak!</p>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">❌</div>
                  <h2 className="text-3xl font-bold text-red-600 mb-2">Not Quite!</h2>
                  <p className="text-lg text-gray-600">Don't worry, keep learning!</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              {!feedbackData.isCorrect && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Your answer:</p>
                  <p className="text-lg font-semibold text-red-600 mb-4">{feedbackData.selectedAnswer}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Correct answer:</p>
                <p className="text-lg font-semibold text-green-600 mb-4">{feedbackData.correctAnswer}</p>
              </div>

              {feedbackData.explanation && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Explanation:</p>
                  <p className="text-gray-800">{feedbackData.explanation}</p>
                </div>
              )}
            </div>

            <button
              onClick={continuToNextQuestion}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition"
            >
              Continue to Next Question
            </button>
          </div>
        )}

        {/* Memory Match */}
        {gameMode === 'memory-match' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Find the Matching Pairs!</h2>
            
            <div className="grid grid-cols-4 gap-4">
              {cards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => flipCard(i)}
                  className={`aspect-square rounded-xl text-sm flex items-center justify-center font-bold transition-all transform hover:scale-105 p-2 ${
                    flippedCards.includes(i) || matchedCards.includes(i)
                      ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white'
                      : 'bg-gradient-to-br from-gray-200 to-gray-300 text-transparent'
                  }`}
                >
                  {flippedCards.includes(i) || matchedCards.includes(i) 
                    ? (i % 2 === 0 ? card.term : card.definition)
                    : '?'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Word Race */}
        {gameMode === 'word-race' && currentWordQuestion && !showWordRaceFeedback && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Type the Answer!</h2>
            
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-3">Question {wordQuestionIndex + 1}</div>
              <p className="text-xl font-semibold text-gray-900 mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                {currentWordQuestion.question}
              </p>
            </div>

            <div className="flex gap-4">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleWordRaceKeyPress}
                placeholder="Type your answer..."
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={submitWordRaceAnswer}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:opacity-90 transition transform hover:scale-105"
              >
                Submit
              </button>
            </div>

            {wordRaceCorrect > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-700 font-semibold">Correct in a row: {wordRaceCorrect}</p>
              </div>
            )}
          </div>
        )}

        {/* Word Race Feedback */}
        {gameMode === 'word-race' && showWordRaceFeedback && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              {wordRaceFeedbackData.isCorrect ? (
                <div>
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-3xl font-bold text-green-600 mb-2">Excellent!</h2>
                  <p className="text-lg text-gray-600">Your speed is improving!</p>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">⏱️</div>
                  <h2 className="text-3xl font-bold text-orange-600 mb-2">Not Quite!</h2>
                  <p className="text-lg text-gray-600">Keep practicing - you'll get faster!</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Your answer:</p>
                <p className={`text-lg font-semibold ${wordRaceFeedbackData.isCorrect ? 'text-green-600' : 'text-orange-600'}`}>
                  {wordRaceFeedbackData.userAnswer || '(empty)'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Correct answer:</p>
                <p className="text-lg font-semibold text-green-600">{wordRaceFeedbackData.correctAnswer}</p>
              </div>
            </div>

            <button
              onClick={continueToNextWordRaceQuestion}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition"
            >
              Next Challenge
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function GameCard({ icon, title, description, gradient, difficulty, onPlay }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  difficulty: string;
  onPlay: () => void;
}) {
  return (
    <div className="relative group cursor-pointer" onClick={onPlay}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-300`} />
      <div className="relative p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 h-full flex flex-col">
        <div className="mb-4 transform group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="text-2xl font-black mb-3 text-gray-900">{title}</h3>
        <p className="text-gray-600 mb-4 flex-grow">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-purple-600">{difficulty}</span>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:opacity-90 transition">
            Play Now
          </button>
        </div>
      </div>
    </div>
  );
}
