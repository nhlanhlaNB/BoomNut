import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

/**
 * Extract text content from uploaded files
 * Supports: .txt, .md, .json, .pdf (basic), and other text formats
 */
async function extractTextFromFile(filepath: string, filename: string): Promise<string> {
  const ext = extname(filename).toLowerCase();
  
  try {
    if (ext === '.txt' || ext === '.md' || ext === '.json') {
      return await readFile(filepath, 'utf-8');
    } 
    else if (ext === '.pdf') {
      try {
        // Try to use pdf-parse if available
        const pdf = require('pdf-parse');
        const dataBuffer = await readFile(filepath);
        const data = await pdf(dataBuffer);
        return data.text || 'Unable to extract text from PDF';
      } catch (e) {
        // Fallback: return basic PDF info
        const content = await readFile(filepath, 'latin1');
        // Very basic text extraction - just get readable characters
        const text = content
          .replace(/[^\w\s.,!?:\-'"()]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 0)
          .join(' ')
          .slice(0, 5000);
        return text || 'PDF file uploaded (text extraction requires pdf-parse library)';
      }
    }
    else {
      // For other formats, try to read as UTF-8
      try {
        const content = await readFile(filepath, 'utf-8');
        return content.slice(0, 10000);
      } catch (e) {
        return `File type ${ext} uploaded (binary or unsupported format for text extraction)`;
      }
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    return `Error extracting content: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(uploadDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Extract text content from the file
    let fileContent = '';
    try {
      fileContent = await extractTextFromFile(filepath, filename);
    } catch (extractError) {
      console.error('Error extracting file content:', extractError);
      fileContent = 'File uploaded successfully (unable to extract text preview)';
    }

    return NextResponse.json({
      success: true,
      filename,
      size: file.size,
      type: file.type,
      content: fileContent,
      contentPreview: fileContent.slice(0, 500), // First 500 chars for preview
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
