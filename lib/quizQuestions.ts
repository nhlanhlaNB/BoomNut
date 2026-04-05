// Quiz Questions Database for Study Arcade Games

export interface QuizQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  options?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  explanation?: string;
}

export const quizQuestions: QuizQuestion[] = [
  // MATH
  {
    id: 'math-1',
    topic: 'Math',
    difficulty: 'easy',
    question: 'What is 15 + 27?',
    correctAnswer: '42',
    options: ['35', '42', '50', '48'],
    explanation: '15 + 27 = 42'
  },
  {
    id: 'math-2',
    topic: 'Math',
    difficulty: 'easy',
    question: 'What is 8 × 6?',
    correctAnswer: '48',
    options: ['42', '48', '54', '56'],
    explanation: '8 × 6 = 48'
  },
  {
    id: 'math-3',
    topic: 'Math',
    difficulty: 'medium',
    question: 'What is 144 ÷ 12?',
    correctAnswer: '12',
    options: ['10', '12', '14', '16'],
    explanation: '144 ÷ 12 = 12'
  },
  {
    id: 'math-4',
    topic: 'Math',
    difficulty: 'medium',
    question: 'What is 20% of 80?',
    correctAnswer: '16',
    options: ['12', '16', '20', '24'],
    explanation: '20% of 80 = 0.20 × 80 = 16'
  },
  {
    id: 'math-5',
    topic: 'Math',
    difficulty: 'hard',
    question: 'If x + 5 = 12, what is x?',
    correctAnswer: '7',
    options: ['5', '7', '12', '17'],
    explanation: 'x + 5 = 12, so x = 12 - 5 = 7'
  },

  // SCIENCE
  {
    id: 'science-1',
    topic: 'Science',
    difficulty: 'easy',
    question: 'What is the chemical symbol for oxygen?',
    correctAnswer: 'O',
    options: ['O', 'Os', 'Ox', 'Og'],
    explanation: 'The chemical symbol for oxygen is O.'
  },
  {
    id: 'science-2',
    topic: 'Science',
    difficulty: 'easy',
    question: 'How many planets are in our solar system?',
    correctAnswer: '8',
    options: ['7', '8', '9', '10'],
    explanation: 'There are 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.'
  },
  {
    id: 'science-3',
    topic: 'Science',
    difficulty: 'medium',
    question: 'What is the speed of light?',
    correctAnswer: '300000',
    options: ['150000', '300000', '500000', '1000000'],
    explanation: 'The speed of light is approximately 300,000 km/s.'
  },
  {
    id: 'science-4',
    topic: 'Science',
    difficulty: 'medium',
    question: 'What element has the atomic number 6?',
    correctAnswer: 'Carbon',
    options: ['Nitrogen', 'Boron', 'Carbon', 'Oxygen'],
    explanation: 'Carbon has atomic number 6.'
  },
  {
    id: 'science-5',
    topic: 'Science',
    difficulty: 'hard',
    question: 'What is the powerhouse of the cell?',
    correctAnswer: 'Mitochondria',
    options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Chloroplast'],
    explanation: 'Mitochondria is known as the powerhouse of the cell as it produces ATP energy.'
  },

  // HISTORY
  {
    id: 'history-1',
    topic: 'History',
    difficulty: 'easy',
    question: 'In what year did World War 2 end?',
    correctAnswer: '1945',
    options: ['1943', '1944', '1945', '1946'],
    explanation: 'World War 2 ended in 1945.'
  },
  {
    id: 'history-2',
    topic: 'History',
    difficulty: 'easy',
    question: 'Who was the first US President?',
    correctAnswer: 'George Washington',
    options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin'],
    explanation: 'George Washington was the first US President.'
  },
  {
    id: 'history-3',
    topic: 'History',
    difficulty: 'medium',
    question: 'In what year did the American Revolution start?',
    correctAnswer: '1776',
    options: ['1770', '1775', '1776', '1777'],
    explanation: 'The American Revolution started in 1776 with the Declaration of Independence.'
  },
  {
    id: 'history-4',
    topic: 'History',
    difficulty: 'medium',
    question: 'What empire built Machu Picchu?',
    correctAnswer: 'Inca',
    options: ['Aztec', 'Inca', 'Maya', 'Olmec'],
    explanation: 'The Inca empire built Machu Picchu in Peru.'
  },
  {
    id: 'history-5',
    topic: 'History',
    difficulty: 'hard',
    question: 'What year did the Berlin Wall fall?',
    correctAnswer: '1989',
    options: ['1987', '1988', '1989', '1990'],
    explanation: 'The Berlin Wall fell in 1989, symbolizing the end of the Cold War.'
  },

  // GEOGRAPHY
  {
    id: 'geography-1',
    topic: 'Geography',
    difficulty: 'easy',
    question: 'What is the capital of France?',
    correctAnswer: 'Paris',
    options: ['Lyon', 'Paris', 'Marseille', 'Nice'],
    explanation: 'Paris is the capital of France.'
  },
  {
    id: 'geography-2',
    topic: 'Geography',
    difficulty: 'easy',
    question: 'What is the largest country by area?',
    correctAnswer: 'Russia',
    options: ['Canada', 'China', 'Russia', 'USA'],
    explanation: 'Russia is the largest country by area in the world.'
  },
  {
    id: 'geography-3',
    topic: 'Geography',
    difficulty: 'medium',
    question: 'What is the capital of Australia?',
    correctAnswer: 'Canberra',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    explanation: 'Canberra is the capital of Australia, not Sydney.'
  },
  {
    id: 'geography-4',
    topic: 'Geography',
    difficulty: 'medium',
    question: 'How many continents are there?',
    correctAnswer: '7',
    options: ['5', '6', '7', '8'],
    explanation: 'There are 7 continents: Africa, Antarctica, Asia, Europe, North America, Oceania, South America.'
  },
  {
    id: 'geography-5',
    topic: 'Geography',
    difficulty: 'hard',
    question: 'What is the longest river in the world?',
    correctAnswer: 'Nile',
    options: ['Amazon', 'Yangtze', 'Nile', 'Mississippi'],
    explanation: 'The Nile River is the longest river in the world at about 6,650 km.'
  },

  // LITERATURE
  {
    id: 'literature-1',
    topic: 'Literature',
    difficulty: 'easy',
    question: 'Who wrote "Romeo and Juliet"?',
    correctAnswer: 'Shakespeare',
    options: ['Cervantes', 'Marlowe', 'Shakespeare', 'Jonson'],
    explanation: 'William Shakespeare wrote "Romeo and Juliet".'
  },
  {
    id: 'literature-2',
    topic: 'Literature',
    difficulty: 'easy',
    question: 'Who wrote "1984"?',
    correctAnswer: 'Orwell',
    options: ['Huxley', 'Orwell', 'Bradbury', 'Gibson'],
    explanation: 'George Orwell wrote "1984".'
  },
  {
    id: 'literature-3',
    topic: 'Literature',
    difficulty: 'medium',
    question: 'Who wrote "Pride and Prejudice"?',
    correctAnswer: 'Austen',
    options: ['Bronte', 'Austen', 'Shelley', 'Eliot'],
    explanation: 'Jane Austen wrote "Pride and Prejudice".'
  },
  {
    id: 'literature-4',
    topic: 'Literature',
    difficulty: 'medium',
    question: 'Who wrote "The Great Gatsby"?',
    correctAnswer: 'Fitzgerald',
    options: ['Hemingway', 'Fitzgerald', 'Faulkner', 'Steinbeck'],
    explanation: 'F. Scott Fitzgerald wrote "The Great Gatsby".'
  },
  {
    id: 'literature-5',
    topic: 'Literature',
    difficulty: 'hard',
    question: 'Who wrote "One Hundred Years of Solitude"?',
    correctAnswer: 'Garcia Marquez',
    options: ['Vargas Llosa', 'Garcia Marquez', 'Fuentes', 'Cortazar'],
    explanation: 'Gabriel García Márquez wrote "One Hundred Years of Solitude".'
  }
];

export const wordRaceAnswers = [
  { question: 'Capital of Japan', answer: 'Tokyo', difficulty: 'easy' },
  { question: 'Largest planet in our solar system', answer: 'Jupiter', difficulty: 'easy' },
  { question: 'What does DNA stand for?', answer: 'DeoxyribonucleicAcid', difficulty: 'medium' },
  { question: 'Father of modern physics', answer: 'Einstein', difficulty: 'medium' },
  { question: 'The smallest prime number', answer: '2', difficulty: 'easy' },
  { question: 'Number of sides in a hexagon', answer: '6', difficulty: 'easy' },
  { question: 'Opposite of light', answer: 'Dark', difficulty: 'easy' },
  { question: 'Symbol for Gold on periodic table', answer: 'Au', difficulty: 'medium' },
  { question: 'First planet from the sun', answer: 'Mercury', difficulty: 'easy' },
  { question: 'What year did internet become public?', answer: '1991', difficulty: 'hard' }
];

export const memoryMatchPairs = [
  { id: '1', term: 'Mitochondria', definition: 'Powerhouse of cell' },
  { id: '2', term: 'Photosynthesis', definition: 'Plants make food from sun' },
  { id: '3', term: 'Gravity', definition: 'Force pulling objects down' },
  { id: '4', term: 'DNA', definition: 'Genetic material' },
  { id: '5', term: 'Ecosystem', definition: 'Community of living things' },
  { id: '6', term: 'Erosion', definition: 'Wearing away of land' },
  { id: '7', term: 'Enzyme', definition: 'Protein that speeds reactions' },
  { id: '8', term: 'Habitat', definition: 'Home of an organism' }
];

export function getRandomQuestion(topic?: string, difficulty?: string): QuizQuestion {
  let filtered = quizQuestions;
  
  if (topic) {
    filtered = filtered.filter(q => q.topic === topic);
  }
  
  if (difficulty) {
    filtered = filtered.filter(q => q.difficulty === difficulty as any);
  }
  
  if (filtered.length === 0) {
    return quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
  }
  
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getRandomWordRaceAnswer() {
  return wordRaceAnswers[Math.floor(Math.random() * wordRaceAnswers.length)];
}

export function getMemoryMatchPairs() {
  return memoryMatchPairs;
}
