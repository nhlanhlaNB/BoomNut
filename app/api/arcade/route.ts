import { NextResponse } from 'next/server';

// Question database with fallback questions
const questionDatabase: Record<string, Record<number, any[]>> = {
  'Math': {
    1: [
      { question: 'What is 5 + 3?', options: ['7', '8', '9', '10'], correctAnswer: '8' },
      { question: 'What is 12 - 4?', options: ['6', '7', '8', '9'], correctAnswer: '8' },
      { question: 'What is 6 × 2?', options: ['10', '12', '14', '16'], correctAnswer: '12' },
      { question: 'What is 20 ÷ 5?', options: ['2', '3', '4', '5'], correctAnswer: '4' },
    ],
    2: [
      { question: 'What is 15% of 200?', options: ['20', '25', '30', '35'], correctAnswer: '30' },
      { question: 'What is the square root of 144?', options: ['10', '11', '12', '13'], correctAnswer: '12' },
      { question: 'What is 7 × 8?', options: ['54', '56', '58', '60'], correctAnswer: '56' },
      { question: 'What is 100 - 73?', options: ['25', '26', '27', '28'], correctAnswer: '27' },
    ],
    3: [
      { question: 'What is 25% of 480?', options: ['100', '110', '120', '130'], correctAnswer: '120' },
      { question: 'What is -5 × -8?', options: ['30', '40', '50', '60'], correctAnswer: '40' },
    ]
  },
  'Science': {
    1: [
      { question: 'What gas do plants need to grow?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'], correctAnswer: 'Carbon Dioxide' },
      { question: 'How many bones are in the human body?', options: ['186', '206', '226', '246'], correctAnswer: '206' },
      { question: 'What is the chemical symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswer: 'Au' },
    ],
    2: [
      { question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correctAnswer: '300,000 km/s' },
      { question: 'What is photosynthesis?', options: ['Plant respiration', 'Converting light to chemical energy', 'Water absorption', 'Mineral uptake'], correctAnswer: 'Converting light to chemical energy' },
    ],
    3: [
      { question: 'What is the Heisenberg Uncertainty Principle about?', options: ['Energy conservation', 'Cannot simultaneously know position and momentum', 'Wave-particle duality', 'Quantum entanglement'], correctAnswer: 'Cannot simultaneously know position and momentum' },
    ]
  },
  'History': {
    1: [
      { question: 'In what year did Columbus reach the Americas?', options: ['1490', '1491', '1492', '1493'], correctAnswer: '1492' },
      { question: 'Who was the first President of the USA?', options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin'], correctAnswer: 'George Washington' },
    ],
    2: [
      { question: 'In what year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctAnswer: '1945' },
      { question: 'Who wrote the Declaration of Independence?', options: ['Benjamin Franklin', 'Thomas Jefferson', 'John Adams', 'George Washington'], correctAnswer: 'Thomas Jefferson' },
    ],
    3: [
      { question: 'What year did the Berlin Wall fall?', options: ['1987', '1988', '1989', '1990'], correctAnswer: '1989' },
    ]
  },
  'Geography': {
    1: [
      { question: 'What is the capital of France?', options: ['Lyon', 'Marseille', 'Paris', 'Nice'], correctAnswer: 'Paris' },
      { question: 'Which is the largest continent?', options: ['Africa', 'Asia', 'Europe', 'North America'], correctAnswer: 'Asia' },
    ],
    2: [
      { question: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctAnswer: 'Nile' },
      { question: 'Which country has the most islands?', options: ['Indonesia', 'Finland', 'Sweden', 'Norway'], correctAnswer: 'Sweden' },
    ],
    3: [
      { question: 'What is the capital of Kazakhstan?', options: ['Almaty', 'Bishkek', 'Astana', 'Aktau'], correctAnswer: 'Astana' },
    ]
  },
  'Literature': {
    1: [
      { question: 'Who wrote Romeo and Juliet?', options: ['Jane Austen', 'William Shakespeare', 'Charles Dickens', 'Mark Twain'], correctAnswer: 'William Shakespeare' },
      { question: 'What year was Harry Potter first published?', options: ['1996', '1997', '1998', '1999'], correctAnswer: '1997' },
    ],
    2: [
      { question: 'Who wrote 1984?', options: ['George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'Kurt Vonnegut'], correctAnswer: 'George Orwell' },
      { question: 'What is the main theme of To Kill a Mockingbird?', options: ['Love', 'Revenge', 'Justice and prejudice', 'Adventure'], correctAnswer: 'Justice and prejudice' },
    ],
    3: [
      { question: 'Who wrote Ulysses?', options: ['F. Scott Fitzgerald', 'James Joyce', 'Virginia Woolf', 'T.S. Eliot'], correctAnswer: 'James Joyce' },
    ]
  }
};

export async function POST(req: Request) {
  try {
    const { action, topic, difficulty } = await req.json();

    if (action === 'generate-question') {
      const diffLevel = Math.min(3, Math.max(1, difficulty || 1));
      
      // Get questions from database
      const topicQuestions = questionDatabase[topic as keyof typeof questionDatabase];
      
      if (topicQuestions && topicQuestions[diffLevel]) {
        const questions = topicQuestions[diffLevel];
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        return NextResponse.json({ 
          question: randomQuestion,
          source: 'database'
        });
      }

      // Fallback to generic question
      return NextResponse.json({
        question: {
          question: `What is an important concept in ${topic}?`,
          options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
          correctAnswer: 'Concept A'
        },
        source: 'fallback'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[ARCADE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process arcade request', message: error.message },
      { status: 200 } // Return 200 to prevent client retry
    );
  }
}
