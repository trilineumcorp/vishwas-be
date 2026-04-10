import * as fs from 'fs';
import { logger } from './logger';
import { cleanupTempFile, readTempFileAsBuffer } from './temp-file-storage';

/**
 * Document Processing Utility for Vercel Serverless
 *
 * Processes PDF and DOCX files to extract text for exam parsing.
 * Works with temporary files in /tmp directory.
 */

export interface DocumentProcessingResult {
  text: string;
  pageCount?: number;
  wordCount: number;
  processingTime: number;
  format: 'pdf' | 'docx' | 'text';
}

/**
 * Process a document file and extract text
 */
export const processDocument = async (filePath: string): Promise<DocumentProcessingResult> => {
  const startTime = Date.now();

  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Document file not found: ${filePath}`);
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error('Document file is empty');
    }

    logger.info(`Processing document: ${filePath} (${stats.size} bytes)`);

    // Read file as buffer
    const buffer = readTempFileAsBuffer(filePath);

    // Determine file type and process accordingly
    const fileName = filePath.toLowerCase();
    let result: DocumentProcessingResult;

    if (fileName.endsWith('.pdf') || buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      // PDF file
      result = await processPDF(buffer);
    } else if (fileName.endsWith('.docx') || isDOCX(buffer)) {
      // DOCX file
      result = await processDOCX(buffer);
    } else {
      // Plain text file
      result = processText(buffer);
    }

    result.processingTime = Date.now() - startTime;
    result.wordCount = countWords(result.text);

    logger.info(`Document processing completed in ${result.processingTime}ms. Extracted ${result.wordCount} words.`);

    return result;

  } catch (error: any) {
    logger.error('Document processing failed:', error);
    throw new Error(`Document processing failed: ${error.message}`);
  }
};

/**
 * Process PDF file using pdf-parse
 */
const processPDF = async (buffer: Buffer): Promise<DocumentProcessingResult> => {
  try {
    // Lazy require to avoid build issues if dependency is missing
    const pdfParse = require('pdf-parse');

    const data = await pdfParse(buffer);

    return {
      text: data.text || '',
      pageCount: data.numpages || 1,
      wordCount: 0, // Will be calculated later
      processingTime: 0, // Will be set later
      format: 'pdf',
    };
  } catch (error: any) {
    if (error.message.includes("Cannot find module 'pdf-parse'")) {
      throw new Error('PDF parser dependency is missing. Install `pdf-parse` package.');
    }
    throw error;
  }
};

/**
 * Process DOCX file using mammoth
 */
const processDOCX = async (buffer: Buffer): Promise<DocumentProcessingResult> => {
  try {
    // Lazy require to avoid build issues if dependency is missing
    const mammoth = require('mammoth');

    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value || '',
      wordCount: 0, // Will be calculated later
      processingTime: 0, // Will be set later
      format: 'docx',
    };
  } catch (error: any) {
    if (error.message.includes("Cannot find module 'mammoth'")) {
      throw new Error('DOCX parser dependency is missing. Install `mammoth` package.');
    }
    throw error;
  }
};

/**
 * Process plain text file
 */
const processText = (buffer: Buffer): DocumentProcessingResult => {
  const text = buffer.toString('utf-8');

  return {
    text,
    wordCount: 0, // Will be calculated later
    processingTime: 0, // Will be set later
    format: 'text',
  };
};

/**
 * Check if buffer contains DOCX file signature
 */
const isDOCX = (buffer: Buffer): boolean => {
  // DOCX files are ZIP archives, check for PK header
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
};

/**
 * Count words in text
 */
const countWords = (text: string): number => {
  if (!text) return 0;

  // Remove extra whitespace and count words
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 0;

  return cleaned.split(' ').length;
};

/**
 * Parse questions from extracted text (same logic as exam controller)
 */
export const parseQuestionsFromText = (rawText: string): any[] => {
  const normalized = rawText
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/[●◉⬤■▪•]/g, ' ')
    .replace(/[()]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

  const parseAnswerIndex = (text: string): number => {
    const answerLine = text.match(/ans(?:wer)?[:\-\s]*([A-Da-d0-3])/i);
    if (answerLine) {
      const token = answerLine[1];
      if (/^[A-D]$/i.test(token)) return token.toUpperCase().charCodeAt(0) - 65;
      const n = parseInt(token, 10);
      if (!Number.isNaN(n) && n >= 0 && n <= 3) return n;
    }

    // For scanned/OCR text where filled bubble appears before a choice: ● (B)
    const filledBubble = text.match(/[●◉⬤■▪•]\s*\(([A-Da-d])\)/);
    if (filledBubble) {
      return filledBubble[1].toUpperCase().charCodeAt(0) - 65;
    }
    return 0;
  };

  const parseQuestionBlocks = (input: string) => {
    const parsed: any[] = [];

    // Strong first pass for explicit format:
    // Q1. ...
    // A. ...
    // B. ...
    // C. ...
    // D. ...
    // Answer: B
    const explicitPattern = /(\d+)\.?\s*([^\n]+?)(?:\n\s*A\.?\s*([^\n]+?))?(?:\n\s*B\.?\s*([^\n]+?))?(?:\n\s*C\.?\s*([^\n]+?))?(?:\n\s*D\.?\s*([^\n]+?))?(?:\n\s*Answer:?\s*([A-Da-d]))?/gi;

    let match;
    while ((match = explicitPattern.exec(input)) !== null) {
      const [, num, question, a, b, c, d, answer] = match;
      if (question && a && b && c && d) {
        parsed.push({
          question: question.trim(),
          options: [a.trim(), b.trim(), c.trim(), d.trim()],
          correctAnswer: answer ? parseAnswerIndex(`Answer: ${answer}`) : 0,
          competitiveType: 'MCQ',
        });
      }
    }

    if (parsed.length > 0) return parsed;

    // Fallback: split by double newlines and parse each block
    const blocks = input.split(/\n\s*\n/).filter(block => block.trim());
    for (const block of blocks) {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length < 5) continue; // Need at least question + 4 options

      const question = lines[0];
      const options: string[] = [];
      let answerIndex = 0;

      // Extract options (usually A, B, C, D format)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^[A-Da-d][).\-]\s/.test(line)) {
          const optionText = line.replace(/^[A-Da-d][).\-]\s*/, '').trim();
          options.push(optionText);
        } else if (line.toLowerCase().includes('answer') || line.toLowerCase().includes('ans')) {
          answerIndex = parseAnswerIndex(line);
        }
      }

      if (options.length >= 2) {
        parsed.push({
          question: question.replace(/^\d+\.?\s*/, '').trim(),
          options,
          correctAnswer: answerIndex,
          competitiveType: 'MCQ',
        });
      }
    }

    return parsed;
  };

  const questions = parseQuestionBlocks(normalized);

  // Validate questions
  const validQuestions = questions.filter(q =>
    q.question &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    q.options.every((opt: any) => typeof opt === 'string' && opt.trim())
  );

  return validQuestions;
};

/**
 * Process document file and cleanup afterwards
 * This is the main function to use in controllers
 */
export const processDocumentFile = async (filePath: string): Promise<DocumentProcessingResult> => {
  let result: DocumentProcessingResult;

  try {
    result = await processDocument(filePath);
  } finally {
    // Always cleanup the temporary file
    cleanupTempFile(filePath);
  }

  return result;
};

/**
 * Process document and parse questions in one step
 */
export const processDocumentAndParseQuestions = async (filePath: string): Promise<{
  document: DocumentProcessingResult;
  questions: any[];
}> => {
  const document = await processDocumentFile(filePath);
  const questions = parseQuestionsFromText(document.text);

  return {
    document,
    questions,
  };
};
