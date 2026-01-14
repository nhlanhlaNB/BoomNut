# 🎓 Azure AI Voice Tutor

A real-time voice-enabled AI tutor powered by Microsoft Azure's Voice Live API. This tutor uses the Socratic method to guide students through learning with hints and questions rather than direct answers.

## ✨ Features

- **Real-time Voice Interaction**: Natural conversation with low latency
- **Socratic Teaching Method**: Guides students with questions and hints
- **Interruption Handling**: Students can interrupt naturally
- **Noise Suppression**: Azure's deep noise suppression for clear audio
- **Echo Cancellation**: Prevents audio feedback
- **Patient & Encouraging**: Adapts to student's level

## 🛠️ Prerequisites

- Python 3.10 or later
- Azure account with Microsoft Foundry resource
- Microphone and speakers
- PyAudio compatible system

### Windows Setup
For PyAudio on Windows, you may need to install it via:
```bash
pip install pipwin
pipwin install pyaudio
```

### macOS Setup
```bash
brew install portaudio
pip install pyaudio
```

### Linux Setup
```bash
sudo apt-get install portaudio19-dev python3-pyaudio
pip install pyaudio
```

## 📋 Setup Instructions

### 1. Azure Resource Setup (Already Complete)
✅ You already have your Microsoft Foundry resource created in Azure

### 2. Install Dependencies

Navigate to the voice-tutor directory:
```bash
cd voice-tutor
```

Create a virtual environment (recommended):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install required packages:
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env   # Windows
   cp .env.example .env     # macOS/Linux
   ```

2. Edit `.env` and add your Azure credentials:
   ```env
   AZURE_VOICELIVE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
   AZURE_VOICELIVE_MODEL=gpt-4o
   AZURE_VOICELIVE_API_VERSION=2025-10-01
   AZURE_VOICELIVE_API_KEY=your_api_key_here
   ```

   **To find your credentials:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to your Microsoft Foundry resource
   - Click "Keys and Endpoint" in the left menu
   - Copy the Endpoint and one of the API Keys

## 🚀 Usage

### Start the Voice Tutor

Make sure you're in the voice-tutor directory with your virtual environment activated:

```bash
python voice_tutor.py
```

You should see:
```
🚀 Initializing Azure AI Voice Tutor...
📡 Using model: gpt-4o
🌐 Endpoint: https://...
✅ Connected to Azure Voice Live API

============================================================
🎓 AI TUTOR SESSION STARTED
============================================================
💡 Tips:
   - Speak naturally and ask questions
   - The tutor will guide you with hints
   - Press Ctrl+C to end the session
============================================================

🎤 Microphone activated - Start speaking!
```

### Example Conversation

**You:** "Can you help me understand photosynthesis?"

**Tutor:** "Of course! I'd love to guide you through photosynthesis. Let's start with a question: What do plants need to survive and grow? Think about what you might give to a plant at home."

**You:** "Water and sunlight?"

**Tutor:** "Excellent start! Yes, water and sunlight are crucial. Can you think of one more thing plants might need from the air around them?"

### End the Session

Press `Ctrl+C` to gracefully end the tutoring session.

## 🎛️ Configuration Options

### AI Model Selection

In your `.env` file, you can change the model based on your needs:

| Use Case | Model | Benefits |
|----------|-------|----------|
| Best balanced tutor | `gpt-4o` or `gpt-4.1` | Strong reasoning for complex explanations |
| Faster, cost-effective | `gpt-4o-mini` or `gpt-5-mini` | Good for simpler Q&A |
| Maximum speed/low cost | `gpt-5-nano` | Lightweight, quick responses |

### Voice Options

Edit `voice_tutor.py` line 172 to change the voice:

```python
voice="en-US-JennyNeural",  # Default: Clear, friendly female voice
```

**Other voice options:**
- `alloy` - Neutral, versatile
- `en-US-AvaNeural` - Professional female
- `en-US-AndrewNeural` - Professional male
- `en-US-GuyNeural` - Casual male

### Adjust Tutor Personality

Edit the `instructions` parameter in `voice_tutor.py` (lines 161-171) to customize the teaching style.

## 🐛 Troubleshooting

### "Missing Azure credentials" Error
- Verify `.env` file exists in the voice-tutor directory
- Check that all values are filled in (no placeholders like `your_api_key_here`)

### PyAudio Installation Issues
- **Windows**: Use `pipwin install pyaudio`
- **macOS**: Install portaudio first with Homebrew
- **Linux**: Install system audio libraries first

### No Audio Input/Output
- Check microphone/speaker permissions
- Test audio devices in system settings
- Try running with administrator privileges

### Connection Errors
- Verify your Azure endpoint URL is correct
- Check that your API key is valid
- Ensure your Azure resource is in a supported region (e.g., East US 2)

## 📝 How It Works

1. **Audio Capture**: PyAudio captures real-time audio from your microphone
2. **Streaming**: Audio is sent to Azure Voice Live API in chunks
3. **AI Processing**: GPT model processes your speech and generates responses
4. **Voice Synthesis**: Azure converts text responses to natural speech
5. **Playback**: Audio plays through your speakers with minimal latency

The system uses:
- **Server-side VAD** (Voice Activity Detection) for natural turn-taking
- **Deep noise suppression** to filter background sounds
- **Echo cancellation** to prevent feedback loops

## 🔗 Integration with Main App

This voice tutor can be integrated into the main Next.js app:

1. Create a Python backend service
2. Use WebSocket communication for real-time audio
3. Add a voice tutor page in the Next.js app
4. Stream audio between browser and Python service

(See upcoming integration documentation)

## 📚 Additional Resources

- [Azure AI Voice Live API Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/realtime-audio-quickstart)
- [Microsoft Foundry](https://learn.microsoft.com/en-us/azure/ai-studio/)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Azure service health status
3. Verify all dependencies are correctly installed
4. Check Python version (must be 3.10+)

---

**Happy Learning! 🎓✨**
