'use client';

import { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Zap, Target, Clock, Star, Award, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

type GameMode = 'speed-quiz' | 'memory-match' | 'word-race' | null;

interface LeaderboardEntry {
  name: string;
  score: number;
  time: number;
  game: string;
}

export default function ArcadePage() {
  const { user } = useAuth();
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

  // Memory Match State
  const [cards, setCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);

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

  const startSpeedQuiz = async () => {
    setGameMode('speed-quiz');
    setIsPlaying(true);
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setQuestionIndex(0);
    await loadQuestion();
  };

  const loadQuestion = async () => {
    // Generate a random question
    const topics = ['Math', 'Science', 'History', 'Geography', 'Literature'];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    try {
      const response = await fetch('/api/arcade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate-question',
          topic,
          difficulty: level 
        })
      });
      const data = await response.json();
      setCurrentQuestion(data.question);
    } catch (error) {
      console.error('Error loading question:', error);
    }
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

    setQuestionIndex(questionIndex + 1);
    await loadQuestion();
  };

  const startMemoryMatch = () => {
    setGameMode('memory-match');
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(120);
    
    // Create pairs of cards
    const pairs = ['🧠', '📚', '🎓', '📝', '✨', '🚀', '💡', '🏆'];
    const shuffled = [...pairs, ...pairs]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false }));
    
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
      if (cards[first].emoji === cards[second].emoji) {
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

  const startWordRace = async () => {
    setGameMode('word-race');
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(90);
    // Word race implementation
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
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4 md:p-8">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-sm font-bold text-purple-700 mb-4">
              <Gamepad2 className="w-4 h-4" />
              <span>Learn While You Play!</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-4">
              Study <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Arcade</span> 🎮
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
        {gameMode === 'speed-quiz' && currentQuestion && (
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

        {/* Memory Match */}
        {gameMode === 'memory-match' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Find the Matching Pairs!</h2>
            
            <div className="grid grid-cols-4 gap-4">
              {cards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => flipCard(i)}
                  className={`aspect-square rounded-xl text-4xl flex items-center justify-center font-bold transition-all transform hover:scale-105 ${
                    flippedCards.includes(i) || matchedCards.includes(i)
                      ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white'
                      : 'bg-gradient-to-br from-gray-200 to-gray-300 text-transparent'
                  }`}
                >
                  {flippedCards.includes(i) || matchedCards.includes(i) ? card.emoji : '?'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Word Race */}
        {gameMode === 'word-race' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Type the Answer!</h2>
            <p className="text-lg text-center text-gray-600 mb-6">Coming soon...</p>
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
