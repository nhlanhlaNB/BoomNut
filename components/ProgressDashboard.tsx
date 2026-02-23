'use client';

import { useState } from 'react';
import { BarChart, TrendingUp, Target, Award, Calendar } from 'lucide-react';

interface ProgressData {
  overallProgress: {
    totalStudyTime: number;
    sessionsCompleted: number;
    averageSessionLength: number;
    currentStreak: number;
    longestStreak: number;
  };
  subjectProgress: Array<{
    subject: string;
    timeSpent: number;
    accuracy: number;
    improvement: number;
    sessions: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  recentAchievements: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }>;
  weeklyActivity: Array<{
    day: string;
    minutes: number;
  }>;
  recommendations: string[];
}

export default function ProgressDashboard() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/progress?userId=demo_user');
      const progressData = await response.json();
      setData(progressData);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Progress & Insights</h1>
        <button
          onClick={loadProgress}
          disabled={loading}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-gray-700" />
                <span className="text-3xl font-bold">{data.overallProgress.currentStreak}</span>
              </div>
              <p className="text-gray-600">Day Streak 🔥</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <BarChart className="w-8 h-8 text-gray-700" />
                <span className="text-3xl font-bold">
                  {Math.floor(data.overallProgress.totalStudyTime / 60)}h
                </span>
              </div>
              <p className="text-gray-600">Total Study Time</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-gray-700" />
                <span className="text-3xl font-bold">{data.overallProgress.sessionsCompleted}</span>
              </div>
              <p className="text-gray-600">Sessions Completed</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-gray-700" />
                <span className="text-3xl font-bold">{data.overallProgress.averageSessionLength}m</span>
              </div>
              <p className="text-gray-600">Avg Session</p>
            </div>
          </div>

          {/* Subject Progress */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Subject Progress</h2>
            <div className="space-y-4">
              {data.subjectProgress.map((subject) => (
                <div key={subject.subject} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{subject.subject}</h3>
                    <span className="text-sm text-gray-600">
                      {Math.floor(subject.timeSpent / 60)}h {subject.timeSpent % 60}m
                    </span>
                  </div>
                  
                  <div className="flex gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Accuracy</span>
                        <span className="font-semibold">{subject.accuracy}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${subject.accuracy}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-semibold">+{subject.improvement}%</span>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Strengths: </span>
                      <span className="text-green-700">{subject.strengths.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Needs work: </span>
                      <span className="text-orange-700">{subject.weaknesses.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Weekly Activity</h2>
            <div className="flex items-end justify-between gap-2 h-48">
              {data.weeklyActivity.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full bg-gray-700 rounded-t hover:bg-gray-800 transition-colors"
                      style={{ height: `${(day.minutes / 80) * 100}%` }}
                      title={`${day.minutes} minutes`}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{day.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-gray-700" />
              Recent Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="text-4xl">{achievement.icon}</div>
                  <div>
                    <h3 className="font-semibold">{achievement.title}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Personalized Recommendations</h2>
            <ul className="space-y-3">
              {data.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-12">
          <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No progress data yet</p>
          <button
            onClick={loadProgress}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Load Demo Data
          </button>
        </div>
      )}
    </div>
  );
}
