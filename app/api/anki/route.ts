import { NextRequest, NextResponse } from 'next/server';

// Export flashcards to Anki format (.apkg or .txt)
export async function POST(req: NextRequest) {
  try {
    const { flashcards, format = 'txt', deckName } = await req.json();

    if (!flashcards || flashcards.length === 0) {
      return NextResponse.json(
        { error: 'Flashcards are required' },
        { status: 400 }
      );
    }

    let content = '';

    if (format === 'txt') {
      // Anki text format (front\tback)
      content = flashcards
        .map((card: any) => {
          const front = card.front.replace(/\n/g, '<br>');
          const back = card.back.replace(/\n/g, '<br>');
          return `${front}\t${back}`;
        })
        .join('\n');

      return NextResponse.json({
        content,
        filename: `${deckName || 'flashcards'}_anki.txt`,
        mimeType: 'text/plain',
      });
    } else if (format === 'csv') {
      // CSV format
      content = 'Front,Back\n' +
        flashcards
          .map((card: any) => {
            const front = `"${card.front.replace(/"/g, '""')}"`;
            const back = `"${card.back.replace(/"/g, '""')}"`;
            return `${front},${back}`;
          })
          .join('\n');

      return NextResponse.json({
        content,
        filename: `${deckName || 'flashcards'}_anki.csv`,
        mimeType: 'text/csv',
      });
    } else if (format === 'json') {
      // JSON format for advanced import
      const ankiDeck = {
        name: deckName || 'Exported Flashcards',
        description: 'Exported from AI Tutor Platform',
        cards: flashcards.map((card: any, index: number) => ({
          id: index + 1,
          front: card.front,
          back: card.back,
          tags: card.subject ? [card.subject] : [],
          created: new Date().toISOString(),
        })),
      };

      return NextResponse.json({
        content: JSON.stringify(ankiDeck, null, 2),
        filename: `${deckName || 'flashcards'}_anki.json`,
        mimeType: 'application/json',
      });
    }

    return NextResponse.json(
      { error: 'Invalid format' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Anki export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export to Anki' },
      { status: 500 }
    );
  }
}

// Import Anki deck
export async function PUT(req: NextRequest) {
  try {
    const { content, format = 'txt' } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    let flashcards = [];

    if (format === 'txt') {
      // Parse Anki text format
      const lines = content.split('\n').filter((line: string) => line.trim());
      
      flashcards = lines.map((line: string, index: number) => {
        const [front, back] = line.split('\t');
        return {
          id: `imported_${index}`,
          front: front?.replace(/<br>/g, '\n') || '',
          back: back?.replace(/<br>/g, '\n') || '',
          difficulty: 0,
          nextReview: new Date(),
          interval: 1,
          easeFactor: 2.5,
        };
      });
    } else if (format === 'csv') {
      // Parse CSV format
      const lines = content.split('\n').filter((line: string) => line.trim());
      const header = lines[0];
      
      flashcards = lines.slice(1).map((line: string, index: number) => {
        // Simple CSV parsing (handles quoted fields)
        const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
        if (matches && matches.length >= 2) {
          const front = matches[0].replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
          const back = matches[1].replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
          
          return {
            id: `imported_${index}`,
            front,
            back,
            difficulty: 0,
            nextReview: new Date(),
            interval: 1,
            easeFactor: 2.5,
          };
        }
        return null;
      }).filter(Boolean);
    }

    return NextResponse.json({
      flashcards,
      count: flashcards.length,
      success: true,
    });
  } catch (error: any) {
    console.error('Anki import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import Anki deck' },
      { status: 500 }
    );
  }
}
