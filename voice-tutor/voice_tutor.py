"""
Azure AI Voice Live Tutor
A real-time voice AI tutor using Microsoft Azure's Voice Live API
"""

import asyncio
import os
import sys
from typing import Optional
from azure.core.credentials import AzureKeyCredential
from azure.ai.voicelive.aio import connect
from azure.ai.voicelive.models import (
    RequestSession,
    Modality,
    InputAudioFormat,
    OutputAudioFormat,
    ServerVad
)
from dotenv import load_dotenv
import pyaudio
import numpy as np

# Load environment variables
load_dotenv()


class AudioProcessor:
    """
    Handles real-time audio capture from microphone and playback of AI responses.
    Based on Microsoft's official quickstart implementation.
    """
    
    def __init__(self, sample_rate: int = 24000, chunk_size: int = 1024):
        self.sample_rate = sample_rate
        self.chunk_size = chunk_size
        self.audio = pyaudio.PyAudio()
        self.input_stream: Optional[pyaudio.Stream] = None
        self.output_stream: Optional[pyaudio.Stream] = None
        
    def start_input_stream(self):
        """Start capturing audio from the microphone."""
        self.input_stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=self.chunk_size
        )
        print("🎤 Microphone activated - Start speaking!")
        
    def start_output_stream(self):
        """Start audio playback for AI responses."""
        self.output_stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self.sample_rate,
            output=True,
            frames_per_buffer=self.chunk_size
        )
        
    def read_audio_chunk(self) -> bytes:
        """Read a chunk of audio from the microphone."""
        if self.input_stream:
            return self.input_stream.read(self.chunk_size, exception_on_overflow=False)
        return b''
        
    def play_audio_chunk(self, audio_data: bytes):
        """Play a chunk of audio through speakers."""
        if self.output_stream:
            self.output_stream.write(audio_data)
            
    def stop(self):
        """Stop all audio streams and cleanup."""
        if self.input_stream:
            self.input_stream.stop_stream()
            self.input_stream.close()
        if self.output_stream:
            self.output_stream.stop_stream()
            self.output_stream.close()
        self.audio.terminate()
        print("\n🔇 Audio streams closed")


async def handle_voice_session(connection, audio_processor: AudioProcessor):
    """
    Manage the bidirectional audio streaming between user and AI tutor.
    """
    # Create tasks for sending and receiving audio
    send_task = asyncio.create_task(send_audio(connection, audio_processor))
    receive_task = asyncio.create_task(receive_audio(connection, audio_processor))
    
    try:
        # Run both tasks concurrently
        await asyncio.gather(send_task, receive_task)
    except KeyboardInterrupt:
        print("\n⚠️ Session interrupted by user")
    finally:
        send_task.cancel()
        receive_task.cancel()


async def send_audio(connection, audio_processor: AudioProcessor):
    """
    Continuously capture audio from microphone and send to Azure.
    """
    audio_processor.start_input_stream()
    
    try:
        while True:
            audio_chunk = audio_processor.read_audio_chunk()
            if audio_chunk:
                # Send audio to Azure Voice Live API
                await connection.send_audio(audio_chunk)
            await asyncio.sleep(0.01)  # Small delay to prevent CPU overload
    except asyncio.CancelledError:
        pass


async def receive_audio(connection, audio_processor: AudioProcessor):
    """
    Receive AI tutor's audio responses and play them through speakers.
    Also handle text responses and events.
    """
    audio_processor.start_output_stream()
    
    try:
        async for event in connection:
            # Handle audio response
            if event.type == "response.audio.delta":
                audio_processor.play_audio_chunk(event.delta)
            
            # Handle text response (for logging/debugging)
            elif event.type == "response.text.delta":
                print(f"🤖 Tutor: {event.delta}", end="", flush=True)
            
            # Handle response completion
            elif event.type == "response.done":
                print("\n")  # New line after response
            
            # Handle conversation item creation
            elif event.type == "conversation.item.created":
                if hasattr(event, 'item') and hasattr(event.item, 'content'):
                    for content in event.item.content:
                        if hasattr(content, 'transcript'):
                            print(f"👤 You: {content.transcript}")
            
            # Handle errors
            elif event.type == "error":
                print(f"❌ Error: {event.error.message if hasattr(event, 'error') else 'Unknown error'}")
                
    except asyncio.CancelledError:
        pass


async def main():
    """
    Main function to initialize and run the AI voice tutor.
    """
    # Validate environment variables
    endpoint = os.getenv("AZURE_VOICELIVE_ENDPOINT")
    api_key = os.getenv("AZURE_VOICELIVE_API_KEY")
    model = os.getenv("AZURE_VOICELIVE_MODEL", "gpt-4o")
    
    if not endpoint or not api_key:
        print("❌ Error: Missing Azure credentials!")
        print("Please create a .env file with AZURE_VOICELIVE_ENDPOINT and AZURE_VOICELIVE_API_KEY")
        print("See .env.example for reference")
        sys.exit(1)
    
    print("🚀 Initializing Azure AI Voice Tutor...")
    print(f"📡 Using model: {model}")
    print(f"🌐 Endpoint: {endpoint[:30]}...")
    
    # Initialize audio processor
    audio_processor = AudioProcessor()
    
    try:
        # Connect to Azure Voice Live API
        async with connect(
            endpoint=endpoint,
            credential=AzureKeyCredential(api_key),
            model=model,
        ) as connection:
            
            print("✅ Connected to Azure Voice Live API")
            
            # Configure the AI tutor's personality and behavior
            session_config = RequestSession(
                modalities=[Modality.TEXT, Modality.AUDIO],
                instructions=(
                    "You are a patient, encouraging, and expert AI tutor for students. "
                    "Your teaching style follows the Socratic method: guide learners to discover "
                    "answers through thoughtful questions and hints. Never simply give direct answers. "
                    "Break down complex topics into manageable steps. "
                    "Be concise but thorough. Celebrate student progress. "
                    "If a student is stuck, provide increasingly specific hints. "
                    "Adapt your explanations to the student's level of understanding. "
                    "Make learning engaging and build confidence."
                ),
                input_audio_format=InputAudioFormat.PCM16,
                output_audio_format=OutputAudioFormat.PCM16,
                turn_detection=ServerVad(
                    type="azure_semantic_vad",
                    silence_duration_ms=500,
                ),
                input_audio_noise_reduction={"type": "azure_deep_noise_suppression"},
                input_audio_echo_cancellation={"type": "server_echo_cancellation"},
                voice="en-US-JennyNeural",  # Clear, friendly voice
            )
            
            # Apply session configuration
            await connection.session.update(session=session_config)
            
            print("\n" + "="*60)
            print("🎓 AI TUTOR SESSION STARTED")
            print("="*60)
            print("💡 Tips:")
            print("   - Speak naturally and ask questions")
            print("   - The tutor will guide you with hints")
            print("   - Press Ctrl+C to end the session")
            print("="*60 + "\n")
            
            # Start the voice session
            await handle_voice_session(connection, audio_processor)
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        audio_processor.stop()
        print("👋 Tutor session ended. Keep learning!")


if __name__ == "__main__":
    # Run the async main function
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
