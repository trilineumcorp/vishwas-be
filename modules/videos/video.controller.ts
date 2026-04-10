import { Request, Response } from 'express';
import { Video } from './video.model';
import { logger } from '../../utils/logger';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class VideoController {
  async getAllVideos(req: Request, res: Response): Promise<void> {
    try {
      const { standard, subject } = req.query;
      const filter: any = { isActive: true };
      
      if (standard) {
        filter.standard = parseInt(standard as string);
      }
      if (subject) {
        filter.subject = subject;
      }

      const videos = await Video.find(filter)
        .sort({ createdAt: -1 })
        .select('-__v');

      res.status(200).json({
        success: true,
        data: videos,
      });
    } catch (error: any) {
      logger.error('Get videos error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch videos',
      });
    }
  }

  async getVideoById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const video = await Video.findById(id);

      if (!video || !video.isActive) {
        res.status(404).json({
          success: false,
          message: 'Video not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: video,
      });
    } catch (error: any) {
      logger.error('Get video error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch video',
      });
    }
  }

  async createVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, youtubeUrl, description, category, duration, thumbnail, standard, subject } = req.body;
      const userId = req.user?.id;

      const video = await Video.create({
        title,
        youtubeUrl,
        description,
        category,
        duration,
        thumbnail,
        standard,
        subject,
        createdBy: userId,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        data: video,
      });
    } catch (error: any) {
      logger.error('Create video error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create video',
      });
    }
  }

  async updateVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, youtubeUrl, description, category, duration, thumbnail, standard, subject, isActive } = req.body;

      const video = await Video.findByIdAndUpdate(
        id,
        {
          title,
          youtubeUrl,
          description,
          category,
          duration,
          thumbnail,
          standard,
          subject,
          isActive,
        },
        { new: true, runValidators: true }
      );

      if (!video) {
        res.status(404).json({
          success: false,
          message: 'Video not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: video,
      });
    } catch (error: any) {
      logger.error('Update video error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update video',
      });
    }
  }

  async deleteVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const video = await Video.findByIdAndUpdate(id, { isActive: false }, { new: true });

      if (!video) {
        res.status(404).json({
          success: false,
          message: 'Video not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Video deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete video error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete video',
      });
    }
  }
}

export const videoController = new VideoController();

