import 'dotenv/config';
import type { Request, Response } from 'express';
import createApp from '../src/app';
import { connectMongoDB } from '../config/mongo';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';

const app = createApp();

let initialized = false;
let initPromise: Promise<void> | null = null;

const initialize = async (): Promise<void> => {
  if (initialized) {
    return;
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        validateEnv();
      } catch (error) {
        logger.error('Env validation failed in Vercel runtime (continuing):', error);
      }

      try {
        await connectMongoDB();
      } catch (error) {
        logger.error('MongoDB init failed in Vercel runtime (continuing):', error);
      }

      initialized = true;
    })();
  }

  await initPromise;
};

export default async function handler(req: Request, res: Response) {
  await initialize();
  return app(req, res);
}
