'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';

export default function SubjectSelector({
  subject,
  onSubjectChange,
}: {
  subject: string;
  onSubjectChange: (subject: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const subjects = [
    { name: 'General', icon: '🎓' },
    { name: 'Mathematics', icon: '🔢' },
    { name: 'Physics', icon: '⚛️' },
    { name: 'Chemistry', icon: '🧪' },
    { name: 'Biology', icon: '🧬' },
    { name: 'Computer Science', icon: '💻' },
    { name: 'English', icon: '📚' },
    { name: 'History', icon: '🏛️' },
    { name: 'Geography', icon: '🌍' },
    { name: 'Languages', icon: '🗣️' },
    { name: 'Economics', icon: '💰' },
    { name: 'Psychology', icon: '🧠' },
  ];

  const currentSubject = subjects.find(s => s.name === subject) || subjects[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white transition-all shadow-sm min-w-[200px] justify-between group"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{currentSubject.icon}</span>
          <span className="font-medium text-gray-800">{currentSubject.name}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
          {subjects.map((subj) => (
            <button
              key={subj.name}
              onClick={() => {
                onSubjectChange(subj.name);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                subject === subj.name ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <span className="text-2xl">{subj.icon}</span>
              <span className="font-medium">{subj.name}</span>
              {subject === subj.name && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
