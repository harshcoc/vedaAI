import path from 'path';
import { downloadFromR2 } from './storageService';

// pdf-parse doesn't ship proper types, so we require it
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

/**
 * Extract text from a file buffer directly (used during upload)
 */
export async function extractTextFromBuffer(buffer: Buffer, ext: string): Promise<string> {
  console.log(`📄 Extracting text from buffer (${buffer.length} bytes, ext: ${ext})`);

  if (ext === '.pdf') {
    const data = await pdfParse(buffer);
    console.log(`📄 Extracted ${data.text?.length || 0} chars from PDF`);
    return data.text || '';
  }

  if (['.png', '.jpg', '.jpeg'].includes(ext)) {
    return `[Image file] - Content from uploaded image.`;
  }

  if (ext === '.docx') {
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

/**
 * Extract text from a file stored in R2 (used during generation if fileContent is empty)
 */
export async function extractTextFromR2(r2Key: string): Promise<string> {
  const ext = path.extname(r2Key).toLowerCase();
  console.log(`📄 Downloading from R2 for extraction: ${r2Key}`);

  const buffer = await downloadFromR2(r2Key);
  return extractTextFromBuffer(buffer, ext);
}
