import { Request, Response } from 'express';
import { FlipBook } from './flipbook.model';
import { logger } from '../../utils/logger';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class FlipBookController {
  async getAllFlipBooks(req: Request, res: Response): Promise<void> {
    try {
      const { standard, subject } = req.query;
      const filter: any = { isActive: true };
      
      if (standard) {
        filter.standard = parseInt(standard as string);
      }
      if (subject) {
        filter.subject = subject;
      }

      const flipbooks = await FlipBook.find(filter)
        .sort({ createdAt: -1 })
        .select('-__v');

      res.status(200).json({
        success: true,
        data: flipbooks,
      });
    } catch (error: any) {
      logger.error('Get flipbooks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch flipbooks',
      });
    }
  }

  async getFlipBookById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const flipbook = await FlipBook.findById(id);

      if (!flipbook || !flipbook.isActive) {
        res.status(404).json({
          success: false,
          message: 'Flipbook not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: flipbook,
      });
    } catch (error: any) {
      logger.error('Get flipbook error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch flipbook',
      });
    }
  }

  async createFlipBook(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, pdfUrl, thumbnail, description, standard, subject } = req.body;
      const userId = req.user?.id;

      const flipbook = await FlipBook.create({
        title,
        pdfUrl,
        thumbnail,
        description,
        standard,
        subject,
        createdBy: userId,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        data: flipbook,
      });
    } catch (error: any) {
      logger.error('Create flipbook error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create flipbook',
      });
    }
  }

  async updateFlipBook(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, pdfUrl, thumbnail, description, standard, subject, isActive } = req.body;

      const flipbook = await FlipBook.findByIdAndUpdate(
        id,
        {
          title,
          pdfUrl,
          thumbnail,
          description,
          standard,
          subject,
          isActive,
        },
        { new: true, runValidators: true }
      );

      if (!flipbook) {
        res.status(404).json({
          success: false,
          message: 'Flipbook not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: flipbook,
      });
    } catch (error: any) {
      logger.error('Update flipbook error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update flipbook',
      });
    }
  }

  async deleteFlipBook(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const flipbook = await FlipBook.findByIdAndUpdate(id, { isActive: false }, { new: true });

      if (!flipbook) {
        res.status(404).json({
          success: false,
          message: 'Flipbook not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Flipbook deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete flipbook error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete flipbook',
      });
    }
  }
}

export const flipBookController = new FlipBookController();

