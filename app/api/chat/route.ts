import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/azureOpenAI';

export async function POST(request: NextRequest) {
  try {
    const { messages, subject, uploadedFiles, image, language = 'en' } = await request.json();

    // Validate messages
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages must be an array' }, { status: 400 });
    }

    // Build system message based on subject and context
    let systemMessage = `You are Spark.E, an expert AI tutor specializing in ${subject}. Your role is to:
- Explain concepts clearly and patiently
- Break down complex topics into understandable parts
- Provide examples and analogies
- Ask questions to check understanding
- Encourage critical thinking
- Adapt your teaching style to the student's level
- Be supportive and encouraging
- Grade essays and assignments with constructive feedback
- Track learning progress and provide insights
- Support visual learning when images are provided
${language !== 'en' ? `- Respond in ${language} language` : ''}

When grading:
1. Provide overall grade (A-F or percentage)
2. Highlight strengths
3. Point out areas for improvement
4. Give specific, actionable suggestions`;

    if (uploadedFiles && uploadedFiles.length > 0) {
      systemMessage += `\n\nThe student has uploaded study materials: ${uploadedFiles.join(', ')}. Reference these materials when answering questions.`;
    }

    // Handle image input for visual analysis
    let chatMessages = [
      { role: 'system', content: systemMessage },
      ...messages,
    ];

    if (image) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      chatMessages[chatMessages.length - 1] = {
        role: lastMessage.role,
        content: [
          {
            type: 'text',
            text: lastMessage.content,
          },
          {
            type: 'image_url',
            image_url: {
              url: image,
              detail: 'high',
            },
          },
        ],
      };
    }

    // Use Azure OpenAI gpt-5.2-chat
    const completion = await createChatCompletion({
      messages: chatMessages as any,
      maxTokens: 2000,
    });

    const responseMessage = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    return NextResponse.json({ response: responseMessage, message: responseMessage });
  } catch (error: any) {
    console.error('=== Chat API Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('======================');
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process chat request',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.stack,
          type: error.constructor.name 
        })
      },
      { status: 500 }
    );
  }
}

