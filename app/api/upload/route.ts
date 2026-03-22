import { NextRequest, NextResponse } from 'next/server';
import { extname } from 'path';

/**
 * Extract text content from uploaded files
 * Supports: .txt, .md, .json, .pdf (basic), and other text formats
 * Processes files in memory (no disk writes for production compatibility)
 */
async function extractTextFromFile(fileContent: Buffer, filename: string): Promise<string> {
  const ext = extname(filename).toLowerCase();
  
  try {
    if (ext === '.txt' || ext === '.md' || ext === '.json') {
      const text = fileContent.toString('utf-8');
      return text.slice(0, 50000); // Limit to 50KB
    } 
    else if (ext === '.pdf') {
      try {
        // Try to use pdf-parse if available
        const pdf = require('pdf-parse');
        const data = await pdf(fileContent);
        return (data.text || 'Unable to extract text from PDF').slice(0, 50000);
      } catch (e) {
        // Fallback: extract basic text from PDF binary
        const content = fileContent.toString('latin1');
        const text = content
          .replace(/[^\w\s.,!?:\-'"()]/g, ' ')
          .split(/\s+/)
          .filter((word: string) => word.length > 0)
          .join(' ')
          .slice(0, 10000);
        return text || 'PDF file uploaded (text extraction requires pdf-parse library)';
      }
    }
    else {
      // For other formats, try to read as UTF-8
      try {
        const content = fileContent.toString('utf-8');
        return content.slice(0, 50000);
      } catch (e) {
        return `File type ${ext} uploaded (binary or unsupported format for text extraction)`;
      }
    }
  } catch (error) {
    console.error('[Upload] Error extracting text:', error);
    return `Error extracting content: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload] Received upload request');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[Upload] No file in formData');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`[Upload] File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Read file into memory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`[Upload] Buffer created: ${buffer.length} bytes`);

    // Extract text content from the file (in memory)
    let fileContent = '';
    try {
      fileContent = await extractTextFromFile(buffer, file.name);
      console.log(`[Upload] Text extracted: ${fileContent.length} characters`);
    } catch (extractError) {
      console.error('[Upload] Error extracting file content:', extractError);
      fileContent = 'File uploaded successfully (unable to extract text preview)';
    }

    const response = {
      success: true,
      filename: file.name,
      size: file.size,
      type: file.type,
      content: fileContent,
      contentPreview: fileContent.slice(0, 500), // First 500 chars for preview
    };

    console.log('[Upload] Returning success response');
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
