import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';
import { cleanupTempFile, readTempFileAsBuffer } from './temp-file-storage';

/**
 * OMR (Optical Mark Recognition) Processing Utility for Vercel Serverless
 *
 * This utility processes OMR sheet images to extract marked answers.
 * Works with temporary files in /tmp directory.
 */

export interface OMRBubble {
  questionNumber: number;
  option: string; // A, B, C, D, etc.
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number; // 0-1, how confident we are it's marked
  isMarked: boolean;
}

export interface OMRAnswer {
  questionNumber: number;
  selectedOption: string | null;
  confidence: number;
}

export interface OMRProcessingResult {
  answers: OMRAnswer[];
  totalQuestions: number;
  processedQuestions: number;
  confidence: number; // Overall confidence score
  processingTime: number;
  warnings: string[];
}

/**
 * Simple OMR processing for image files
 * This is a basic implementation - in production you'd use a proper OMR library
 */
export const processOMRImage = async (imagePath: string): Promise<OMRProcessingResult> => {
  const startTime = Date.now();

  try {
    // Validate file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`OMR image file not found: ${imagePath}`);
    }

    // Get file stats
    const stats = fs.statSync(imagePath);
    if (stats.size === 0) {
      throw new Error('OMR image file is empty');
    }

    logger.info(`Processing OMR image: ${imagePath} (${stats.size} bytes)`);

    // Read image as buffer for processing
    const imageBuffer = readTempFileAsBuffer(imagePath);

    // Basic image validation (check for common image signatures)
    const isValidImage = validateImageFormat(imageBuffer);
    if (!isValidImage) {
      throw new Error('Invalid image format. Supported formats: JPEG, PNG');
    }

    // Simulate OMR processing (replace with actual OMR library)
    const bubbles = await detectOMRBubbles(imageBuffer);
    const answers = analyzeOMRAnswers(bubbles);

    const processingTime = Date.now() - startTime;
    const processedQuestions = answers.filter(a => a.selectedOption !== null).length;
    const avgConfidence = answers.length > 0
      ? answers.reduce((sum, a) => sum + a.confidence, 0) / answers.length
      : 0;

    const result: OMRProcessingResult = {
      answers,
      totalQuestions: answers.length,
      processedQuestions,
      confidence: avgConfidence,
      processingTime,
      warnings: generateWarnings(answers, bubbles),
    };

    logger.info(`OMR processing completed in ${processingTime}ms. Found ${processedQuestions}/${answers.length} answers.`);

    return result;

  } catch (error: any) {
    logger.error('OMR processing failed:', error);
    throw new Error(`OMR processing failed: ${error.message}`);
  }
};

/**
 * Validate basic image format by checking file headers
 */
const validateImageFormat = (buffer: Buffer): boolean => {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;

  return false;
};

/**
 * Simulate bubble detection (replace with actual computer vision)
 * This is a placeholder - real implementation would use OpenCV or similar
 */
const detectOMRBubbles = async (imageBuffer: Buffer): Promise<OMRBubble[]> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const bubbles: OMRBubble[] = [];

  // Generate mock bubbles for demonstration
  // In real implementation, this would analyze the image
  const numQuestions = 30; // Assume 30 questions
  const options = ['A', 'B', 'C', 'D'];

  for (let q = 1; q <= numQuestions; q++) {
    for (const option of options) {
      // Simulate random marking with some pattern
      const isMarked = Math.random() > 0.7; // 30% chance of being marked
      const confidence = isMarked ? 0.8 + Math.random() * 0.2 : Math.random() * 0.3;

      bubbles.push({
        questionNumber: q,
        option,
        x: Math.floor(Math.random() * 800), // Mock coordinates
        y: Math.floor(Math.random() * 1000),
        width: 20,
        height: 20,
        confidence,
        isMarked,
      });
    }
  }

  logger.info(`Detected ${bubbles.length} bubbles in OMR image`);
  return bubbles;
};

/**
 * Analyze detected bubbles to determine answers
 */
const analyzeOMRAnswers = (bubbles: OMRBubble[]): OMRAnswer[] => {
  const answers: OMRAnswer[] = [];
  const questionGroups = new Map<number, OMRBubble[]>();

  // Group bubbles by question number
  bubbles.forEach(bubble => {
    if (!questionGroups.has(bubble.questionNumber)) {
      questionGroups.set(bubble.questionNumber, []);
    }
    questionGroups.get(bubble.questionNumber)!.push(bubble);
  });

  // Analyze each question
  questionGroups.forEach((questionBubbles, questionNumber) => {
    // Find the most confidently marked bubble
    const markedBubbles = questionBubbles.filter(b => b.isMarked);
    let selectedOption: string | null = null;
    let maxConfidence = 0;

    if (markedBubbles.length === 1) {
      // Single mark - clear answer
      selectedOption = markedBubbles[0].option;
      maxConfidence = markedBubbles[0].confidence;
    } else if (markedBubbles.length > 1) {
      // Multiple marks - ambiguous, take the most confident
      const sorted = markedBubbles.sort((a, b) => b.confidence - a.confidence);
      selectedOption = sorted[0].option;
      maxConfidence = sorted[0].confidence * 0.5; // Reduce confidence for ambiguity
    }

    answers.push({
      questionNumber,
      selectedOption,
      confidence: maxConfidence,
    });
  });

  // Sort by question number
  answers.sort((a, b) => a.questionNumber - b.questionNumber);

  return answers;
};

/**
 * Generate warnings based on processing results
 */
const generateWarnings = (answers: OMRAnswer[], bubbles: OMRBubble[]): string[] => {
  const warnings: string[] = [];

  // Check for unanswered questions
  const unanswered = answers.filter(a => a.selectedOption === null);
  if (unanswered.length > 0) {
    warnings.push(`${unanswered.length} questions appear unanswered`);
  }

  // Check for low confidence answers
  const lowConfidence = answers.filter(a => a.selectedOption && a.confidence < 0.6);
  if (lowConfidence.length > 0) {
    warnings.push(`${lowConfidence.length} answers have low confidence (<60%)`);
  }

  // Check for potential multiple markings per question
  const questionGroups = new Map<number, OMRBubble[]>();
  bubbles.forEach(bubble => {
    if (!questionGroups.has(bubble.questionNumber)) {
      questionGroups.set(bubble.questionNumber, []);
    }
    questionGroups.get(bubble.questionNumber)!.push(bubble);
  });

  let ambiguousQuestions = 0;
  questionGroups.forEach((questionBubbles) => {
    const markedCount = questionBubbles.filter(b => b.isMarked).length;
    if (markedCount > 1) {
      ambiguousQuestions++;
    }
  });

  if (ambiguousQuestions > 0) {
    warnings.push(`${ambiguousQuestions} questions have multiple markings`);
  }

  return warnings;
};

/**
 * Process OMR file and cleanup afterwards
 * This is the main function to use in controllers
 */
export const processOMRFile = async (filePath: string): Promise<OMRProcessingResult> => {
  let result: OMRProcessingResult;

  try {
    result = await processOMRImage(filePath);
  } finally {
    // Always cleanup the temporary file
    cleanupTempFile(filePath);
  }

  return result;
};
