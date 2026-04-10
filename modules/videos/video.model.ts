import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  youtubeUrl: string;
  description?: string;
  category?: string;
  duration?: string;
  thumbnail?: string;
  standard?: number; // 6, 7, 8, 9, 10
  subject?: string; // Mathematics, Physics, Chemistry, Biology
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    youtubeUrl: {
      type: String,
      required: [true, 'YouTube URL is required'],
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
        },
        message: 'Please provide a valid YouTube URL',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    standard: {
      type: Number,
      enum: [6, 7, 8, 9, 10],
      trim: true,
    },
    subject: {
      type: String,
      enum: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

export const Video = mongoose.model<IVideo>('Video', videoSchema);

