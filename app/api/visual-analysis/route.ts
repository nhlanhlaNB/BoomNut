import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/azureOpenAI';

// Analyze image/diagram
export async function POST(req: NextRequest) {
  try {
    const { image, question, subject } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const messages: any[] = [
      {
        role: 'system',
        content: `You are Spark.E, an expert visual learning assistant. Analyze images, diagrams, charts, and visuals to help students understand ${subject || 'educational'} content. Provide clear, detailed explanations.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: question || 'Analyze this image and explain what it shows. Identify key concepts, labels, and educational content.',
          },
          {
            type: 'image_url',
            image_url: {
              url: image, // base64 or URL
              detail: 'high',
            },
          },
        ],
      },
    ];

    const response = await createChatCompletion({
      messages,
      maxTokens: 1000,
    });

    const explanation = response.choices[0]?.message?.content || '';

    // Generate follow-up questions
    const followUpResponse = await createChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'Generate 3 relevant follow-up questions based on the visual analysis to deepen understanding.',
        },
        {
          role: 'user',
          content: `Visual analysis: ${explanation}\n\nGenerate 3 follow-up questions. Return as JSON: {"questions": ["Q1", "Q2", "Q3"]}`,
        },
      ],

      maxTokens: 300,
    });

    let followUpQuestions = [];
    try {
      const parsed = JSON.parse(followUpResponse.choices[0]?.message?.content || '{}');
      followUpQuestions = parsed.questions || [];
    } catch (e) {
      followUpQuestions = [];
    }

    return NextResponse.json({
      explanation,
      followUpQuestions,
      success: true,
    });
  } catch (error: any) {
    console.error('Visual analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze visual' },
      { status: 500 }
    );
  }
}
