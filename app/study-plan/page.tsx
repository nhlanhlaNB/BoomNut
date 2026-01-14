'use client';

import { useState } from 'react';
import { Calendar, Target, TrendingUp, Clock, Download } from 'lucide-react';

export default function StudyPlanPage() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    subjects: [''],
    goals: '',
    deadline: '',
    availableTime: 10,
    learningPace: 'medium',
    preferences: '',
  });

  const addSubject = () => {
    setFormData({
      ...formData,
      subjects: [...formData.subjects, ''],
    });
  };

  const updateSubject = (index: number, value: string) => {
    const newSubjects = [...formData.subjects];
    newSubjects[index] = value;
    setFormData({ ...formData, subjects: newSubjects });
  };

  const removeSubject = (index: number) => {
    const newSubjects = formData.subjects.filter((_, i) => i !== index);
    setFormData({ ...formData, subjects: newSubjects });
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: 'demo_user',
          subjects: formData.subjects.filter(s => s.trim()),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPlan(data.studyPlan);
      }
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('Failed to generate study plan');
    } finally {
      setLoading(false);
    }
  };

  const downloadPlan = () => {
    if (!plan) return;

    const content = `
STUDY PLAN: ${plan.title}

${plan.overview}

Total Duration: ${plan.totalWeeks} weeks

${plan.weeklySchedule?.map((week: any) => `
WEEK ${week.week}: ${week.focus}

Goals:
${week.goals?.map((g: string) => `- ${g}`).join('\n')}

Schedule:
${week.days?.map((day: any) => `
${day.day}:
${day.sessions?.map((s: any) => `
  ${s.time}
  Subject: ${s.subject}
  Activity: ${s.activity}
  Resources: ${s.resources?.join(', ')}
`).join('\n')}
`).join('\n')}

Milestones:
${week.milestones?.map((m: string) => `- ${m}`).join('\n')}
`).join('\n\n')}

STUDY TIPS:
${plan.studyTips?.map((tip: string) => `- ${tip}`).join('\n')}

RECOMMENDED RESOURCES:
${plan.resources?.map((res: string) => `- ${res}`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_plan_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Study Planner</h1>
          <p className="text-gray-600">Get a personalized study schedule based on your goals and availability</p>
        </div>

        {!plan ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6">Create Your Study Plan</h2>

            <div className="space-y-6">
              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium mb-2">Subjects to Study</label>
                {formData.subjects.map((subject, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => updateSubject(index, e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Mathematics, Physics"
                    />
                    {formData.subjects.length > 1 && (
                      <button
                        onClick={() => removeSubject(index)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addSubject}
                  className="mt-2 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                >
                  + Add Subject
                </button>
              </div>

              {/* Goals */}
              <div>
                <label className="block text-sm font-medium mb-2">Learning Goals</label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="What do you want to achieve? (e.g., Master calculus, Ace physics exam)"
                />
              </div>

              {/* Deadline */}
              <div>
                <label htmlFor="deadline-input" className="block text-sm font-medium mb-2">Target Deadline (Optional)</label>
                <input
                  id="deadline-input"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Available Time */}
              <div>
                <label htmlFor="available-time-input" className="block text-sm font-medium mb-2">
                  Available Study Time (hours per week): {formData.availableTime}
                </label>
                <input
                  id="available-time-input"
                  type="range"
                  min="1"
                  max="40"
                  value={formData.availableTime}
                  onChange={(e) => setFormData({ ...formData, availableTime: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Learning Pace */}
              <div>
                <label htmlFor="learning-pace-select" className="block text-sm font-medium mb-2">Learning Pace</label>
                <select
                  id="learning-pace-select"
                  value={formData.learningPace}
                  onChange={(e) => setFormData({ ...formData, learningPace: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="slow">Slow & Steady</option>
                  <option value="medium">Moderate</option>
                  <option value="fast">Intensive</option>
                </select>
              </div>

              {/* Preferences */}
              <div>
                <label className="block text-sm font-medium mb-2">Study Preferences (Optional)</label>
                <textarea
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="E.g., Morning study sessions, visual learner, prefer practice problems"
                />
              </div>

              <button
                onClick={generatePlan}
                disabled={loading || !formData.subjects.some(s => s.trim())}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    Generating Your Plan...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5" />
                    Generate Study Plan
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plan Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{plan.title}</h2>
                  <p className="text-gray-600">{plan.overview}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={downloadPlan}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => setPlan(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Create New
                  </button>
                </div>
              </div>

              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>{plan.totalWeeks} weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>{formData.availableTime}h/week</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>{formData.learningPace} pace</span>
                </div>
              </div>
            </div>

            {/* Weekly Schedule */}
            {plan.weeklySchedule?.map((week: any) => (
              <div key={week.week} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-2">Week {week.week}: {week.focus}</h3>
                
                {/* Week Goals */}
                {week.goals && week.goals.length > 0 && (
                  <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Goals:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {week.goals.map((goal: string, i: number) => (
                        <li key={i} className="text-gray-700">{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Daily Schedule */}
                <div className="space-y-4">
                  {week.days?.map((day: any) => (
                    <div key={day.day} className="border-l-4 border-indigo-600 pl-4">
                      <h4 className="font-semibold mb-2">{day.day}</h4>
                      <div className="space-y-3">
                        {day.sessions?.map((session: any, i: number) => (
                          <div key={i} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-indigo-600">{session.subject}</span>
                              <span className="text-sm text-gray-600">{session.time}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{session.activity}</p>
                            {session.resources && session.resources.length > 0 && (
                              <div className="text-xs text-gray-600">
                                📚 {session.resources.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Milestones */}
                {week.milestones && week.milestones.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2">📍 Milestones:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {week.milestones.map((milestone: string, i: number) => (
                        <li key={i} className="text-gray-700">{milestone}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {/* Study Tips & Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plan.studyTips && plan.studyTips.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4">💡 Study Tips</h3>
                  <ul className="space-y-2">
                    {plan.studyTips.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.resources && plan.resources.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4">📚 Recommended Resources</h3>
                  <ul className="space-y-2">
                    {plan.resources.map((resource: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span className="text-gray-700">{resource}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
