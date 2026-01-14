# BoomNut - AI Study Platform 🎓

Your smart AI study buddy that helps you ace exams with flashcards, quizzes, and personalized tutoring.

An advanced Next.js 14 application featuring all StudyFetch capabilities and more. Upload documents, record lectures, analyze visuals, and access 15+ AI-powered study tools for comprehensive learning.

## 🎓 Complete Feature Set

### 1. 📝 AI-Powered Note-Taking
- **Real-time transcription** using Whisper AI
- **Automatic note generation** from lectures and recordings
- **Key concept extraction**
- **Timestamped segments**
- **Multi-language support** (90+ languages)
- **One-tap recording**

### 2. 🎴 Flashcards with Spaced Repetition
- **AI-generated flashcards** from any content
- **SuperMemo SM-2 algorithm** for optimal retention
- **Due card scheduling**
- **Progress tracking** and study streaks
- **Anki export/import** (TXT, CSV, JSON formats)
- **Cross-device sync ready**

### 3. 📊 Enhanced Quiz System
- **Multiple question types:**
  - Multiple choice
  - True/False
  - Fill-in-the-blank
  - Short answer
- **AI-powered grading** with detailed feedback
- **Essay grading** with constructive criticism
- **Immediate explanations**
- **Adaptive difficulty**
- **Performance analytics**

### 4. 🤖 Spark.E AI Tutor
- **GPT-4 powered** conversational tutor
- **Context-aware** responses based on your materials
- **Multi-subject expertise**
- **Essay and assignment grading** (A-F ratings)
- **Progress tracking** and insights
- **Visual analysis** support
- **Multilingual** conversations
- **Real-time Q&A**

### 4.5. 🎤 Web-Based Voice Tutor (NEW!)
- **Real-time browser voice conversations** - No Python setup required!
- **Web Speech API** - Built-in browser speech recognition
- **OpenAI TTS** - Natural voice responses
- **Socratic teaching method** - Guides with questions, not answers
- **Live transcript** - See conversation in real-time
- **Works in Chrome/Edge/Safari** - No installation needed
- **Fully integrated** - Part of the web platform
- See [WEB_VOICE_TUTOR_GUIDE.md](WEB_VOICE_TUTOR_GUIDE.md) for details

### 5. 👁️ Spark.E Visuals
- **Image and diagram interpretation**
- **Visual learning support** for:
  - Scientific diagrams
  - Anatomy illustrations
  - Chemistry structures
  - Mathematical graphs
  - Physics diagrams
- **Questions about visuals**
- **Follow-up question generation**
- **High-detail analysis**

### 6. 📈 Progress Tracking & Insights
- **Comprehensive analytics dashboard**
- **Study time tracking**
- **Accuracy metrics** by subject
- **Strengths and weaknesses** identification
- **Weekly activity charts**
- **Achievement system** (streaks, milestones)
- **AI-powered recommendations**
- **Performance trends**

### 7. 📅 Study Scheduler AI
- **Personalized study plans**
- **Deadline-based scheduling**
- **Learning pace adaptation**
- **Weekly/daily schedules**
- **Milestone tracking**
- **Goal setting and monitoring**
- **Break time recommendations**
- **Progress updates**

### 8. 👥 Group Study Facilitator
- **Create study rooms** (public/private)
- **Share flashcards and quizzes**
- **Collaborative workspace**
- **Member management**
- **Resource sharing**
- **Activity tracking**
- **Synchronized study sessions**

### 9. 🔄 Anki Integration
- **Export flashcards** to Anki (TXT, CSV, JSON)
- **Import Anki decks**
- **Maintains spaced repetition data**
- **Cross-device sync** support

### 10. 🎙️ Podcast/Lecture Generation
- **6-45 minute AI podcasts**
- **Multiple styles:**
  - Educational
  - Conversational
  - Podcast format
- **High-quality TTS**
- **Multiple voice options**
- **Script generation**

### 11. 🎬 Educational Video Generation
- **Video script creation**
- **Scene-by-scene breakdown**
- **Visual descriptions**
- **Animation suggestions**
- **Voiceover generation**
- **Multiple styles:**
  - Animated
  - Lecture
  - Whiteboard

### 12. 📡 Live Lecture Support
- **Real-time transcription**
- **Automatic note-taking**
- **Live Q&A** during lectures
- **No manual input required**
- **Continuous recording**
- **Final summary generation**

### 13. 🔄 Material Transformation
- **PDFs** → Flashcards, Quizzes, Notes
- **PowerPoints** → Study guides
- **Lecture videos** → Transcripts, Notes
- **Images** → Analysis, Flashcards
- **Text** → All formats

### 14. 🌍 Multilingual Support
- **90+ languages** supported
- **Transcription** in any language
- **AI responses** in your language
- **Global accessibility**

### 15. 📱 Platform Availability
- **Web-based** (Next.js 14)
- **Mobile-responsive**
- **Tablet-optimized**
- **Desktop-friendly**

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4 Turbo + Vision
- **Voice**: Whisper (STT) + TTS-1-HD
- **Database**: Prisma + SQLite (upgradable to PostgreSQL)
- **Auth**: Firebase (optional)
- **State**: React Hooks + Zustand
- **File Processing**: pdf-parse, multipart forms

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd TutApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   DATABASE_URL=file:./dev.db
   NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key (optional)
   # Add other Firebase credentials if using auth
   ```
   
   Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Voice Tutor Setup (Optional)

The voice tutor is now **fully web-based** and works directly in your browser!

1. **Ensure OpenAI API key is set** (same key as main app)
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```

2. **Start the dev server** (if not already running)
   ```bash
   npm run dev
   ```

3. **Open voice tutor page**
   Navigate to: http://localhost:3000/voice-tutor

4. **Allow microphone access** when prompted

5. **Start talking!** - The tutor will guide you with questions

📖 **Full guide:** See [WEB_VOICE_TUTOR_GUIDE.md](WEB_VOICE_TUTOR_GUIDE.md)

## 🚀 How to Use

### 1. Study Dashboard (`/study`)
- Upload study materials (PDF, DOC, TXT, images)
- Choose from multiple study modes:
  - **Flashcards**: AI-generated with spaced repetition
  - **Quiz**: Multiple question types with instant feedback
  - **Study Guide**: Comprehensive notes and summaries
  - **Summarize**: Quick content summaries

### 2. AI Tutor Chat (`/tutor`)
- Ask questions about any subject
- Get step-by-step explanations
- Upload images for visual analysis
- Grade essays and assignments
- Track conversation history

### 3. Live Lecture Recording (`/live-lecture`)
- Tap to start recording
- Real-time transcription appears
- AI generates notes automatically
- Ask questions during lecture
- Download complete notes when done

### 4. Visual Analysis (`/visual-analysis`)
- Upload diagrams, charts, or images
- Ask specific questions about the visual
- Get detailed explanations

### 5. Web-Based Voice Tutor (`/voice-tutor`)
- **Click "Start Voice Tutor"** to begin
- **Speak your question** naturally
- **Listen to the tutor's response**
- **See live transcript** of conversation
- **Uses Socratic method** - guides with hints
- Works best in **Chrome or Edge** browser
- See [WEB_VOICE_TUTOR_GUIDE.md](WEB_VOICE_TUTOR_GUIDE.md) for tips
- Receive follow-up questions

### 5. Progress Tracking (`/progress`)
- View study time and session stats
- See subject-wise accuracy
- Track your study streak
- Get AI recommendations
- Unlock achievements

### 6. Study Planner (`/study-plan`)
- Enter subjects and goals
- Set deadlines and available time
- Choose learning pace
- Get personalized weekly schedule
- Track milestone completion

### 7. Study Rooms (`/study-rooms`)
- Create or join study rooms
- Share flashcards and quizzes
- Collaborate with classmates
- Track group activity

### 8. Anki Export
- Generate flashcards
- Export to Anki format (TXT/CSV/JSON)
- Import into Anki app
- Sync across devices
   - **Summary**: Create concise summaries of your materials

### AI Tutor Chat

1. **Go to AI Tutor**: Navigate to `/tutor`
2. **Select Subject**: Choose your subject from the dropdown
3. **Upload Files** (Optional): Upload relevant study materials
4. **Ask Questions**: Type or use voice to ask questions
5. **Get Explanations**: Receive personalized AI-powered explanations

### Voice Features

- Click the microphone icon to record your question
- Speak naturally and the AI will transcribe and respond
- Perfect for hands-free learning
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Starting a Tutoring Session

1. Click "Start Learning" on the homepage
2. Select your subject from the dropdown
3. Start asking questions or upload study materials

### Using Voice Input

1. Click the microphone icon
2. Speak your question
3. Click again to stop recording
4. The AI will transcribe and respond

### Uploading Study Materials

1. Click the upload icon
2. Select your file (PDF, DOC, TXT, or image)
3. Once uploaded, ask questions about the material
4. The AI will reference your documents in responses

## 📁 Project Structure

```
TutApp/
├── app/
│   ├── api/                  # API routes
│   │   ├── chat/            # AI tutor chat endpoint
│   │   ├── flashcards/      # Flashcard generation
│   │   ├── quiz/            # Quiz generation
│   │   ├── study-guide/     # Study guide generation
│   │   ├── summarize/       # Content summarization
│   │   ├── upload/          # File upload endpoint
│   │   ├── transcribe/      # Speech-to-text
│   │   └── tts/             # Text-to-speech
│   ├── study/               # Study dashboard with all modes
│   ├── tutor/               # AI tutor chat interface
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── components/
│   ├── ChatMessage.tsx      # Message display component
│   ├── FlashcardViewer.tsx  # Interactive flashcard viewer
│   ├── QuizViewer.tsx       # Quiz interface with scoring
│   ├── FileUpload.tsx       # File upload component
│   ├── VoiceRecorder.tsx    # Voice recording component
│   └── SubjectSelector.tsx  # Subject selection component
├── public/
│   └── uploads/             # Uploaded files storage
└── package.json
```

## 🔌 API Endpoints

### POST `/api/chat`
Chat with AI tutor and get personalized explanations.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Explain photosynthesis" }
  ],
  "subject": "Biology",
  "uploadedFiles": ["lecture-notes.pdf"]
}
```

**Response:**
```json
{
  "message": "Photosynthesis is the process..."
}
```

### POST `/api/flashcards`
Generate AI flashcards from study content.

**Request:**
```json
{
  "content": "Your study material text...",
  "count": 15
}
```

**Response:**
```json
{
  "flashcards": [
    {
      "question": "What is photosynthesis?",
      "answer": "The process by which plants...",
      "category": "Biology"
    }
  ]
}
```

### POST `/api/quiz`
Generate interactive quizzes with multiple choice questions.

**Request:**
```json
{
  "content": "Your study material text...",
  "questionCount": 10,
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "quiz": {
    "title": "Biology Quiz",
    "difficulty": "medium",
    "questions": [
      {
        "id": 1,
        "question": "What is the powerhouse of the cell?",
        "options": ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
        "correctAnswer": 1,
        "explanation": "Mitochondria produce ATP..."
      }
    ]
  }
}
```

### POST `/api/study-guide`
Generate comprehensive study guides.

**Request:**
```json
{
  "content": "Your study material text...",
  "format": "comprehensive"
}
```

**Response:**
```json
{
  "studyGuide": "# Study Guide\n\n## Key Concepts..."
}
```

### POST `/api/summarize`
Create concise summaries of study materials.

**Request:**
```json
{
  "content": "Your study material text...",
  "length": "medium"
}
```

**Response:**
```json
{
  "summary": "## Summary\n\nMain points..."
}
```

### POST `/api/upload`
Upload study materials for processing.
```

**Response:**
```json
{
  "message": "Photosynthesis is the process..."
}
```

### POST `/api/upload`
Upload study materials.

**Request:** FormData with 'file' field

**Response:**
```json
{
  "success": true,
  "filename": "document.pdf",
  "content": "Extracted text content..."
}
```

### POST `/api/transcribe`
Convert speech to text using Whisper AI.

**Request:** FormData with 'audio' field

**Response:**
```json
{
  "transcript": "What is photosynthesis?"
}
```

### POST `/api/tts`
Convert text to speech.

**Request:**
```json
{
  "text": "Hello, how can I help you today?"
}
```

**Response:** Audio/MP3 stream

## 🎨 Customization

### Adding New Subjects

Edit [components/SubjectSelector.tsx](components/SubjectSelector.tsx):

```typescript
const subjects = [
  'General',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Your New Subject',
];
```

### Changing AI Model

Edit API routes to use different models:

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo', 'gpt-4'
  // ...
});
```

### Customizing Study Modes

Add new study modes by creating new API endpoints in `app/api/` and corresponding components in `components/`.

## 🚧 Future Enhancements

- [ ] User authentication with Firebase
- [ ] Progress tracking and analytics dashboard
- [ ] Spaced repetition algorithm for flashcards
- [ ] Video content extraction and summarization
- [ ] Multi-language support
- [ ] Mobile app version
- [ ] Collaborative study sessions
- [ ] Integration with popular note-taking apps
- [ ] Advanced OCR for handwritten notes
- [ ] Offline mode support

## 🐛 Troubleshooting

### "Failed to get response" Error
- ✅ Verify your OpenAI API key in `.env.local`
- ✅ Check OpenAI account has sufficient credits
- ✅ Review browser console for detailed errors

### File Upload Issues
- ✅ Ensure `public/uploads` directory exists and has write permissions
- ✅ Check file size (default limit: 10MB)
- ✅ Verify supported formats: PDF, DOC, DOCX, TXT

### Voice Recording Not Working
- ✅ Grant microphone permissions in browser
- ✅ Use HTTPS or localhost (required for microphone API)
- ✅ Test with Chrome/Edge (best compatibility)

### TypeScript Errors
- ✅ Run `npm install` to ensure all dependencies are installed
- ✅ Restart VS Code or dev server
- ✅ Check for missing type definitions

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - free to use for learning or commercial purposes.

## 🙏 Credits

- **Framework**: [Next.js](https://nextjs.org/)
- **AI**: [OpenAI GPT-4](https://openai.com/)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 💬 Support

For questions or issues, please:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the API documentation

---

**⚠️ Important**: This is an educational application. For production deployment:
- Implement proper user authentication
- Add rate limiting for API endpoints
- Set up error logging and monitoring
- Configure CORS and security headers
- Use environment-specific configurations
- Implement file scanning for security

**Made with ❤️ using Next.js and OpenAI**
#   B o o m N u t  
 