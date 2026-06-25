import mongoose, { Schema, type Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  avatarUrl: string;
  avatarColor: string;
  isGuest: boolean;
  googleId?: string;
  email?: string;
  favorites: string[];
  recentlyPlayed: Array<{
    videoId: string;
    title: string;
    thumbnail: string;
    playedAt: Date;
  }>;
  createdAt: Date;
  lastActiveAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, minlength: 1, maxlength: 30 },
    avatarUrl: { type: String, default: '' },
    avatarColor: {
      type: String,
      default: () => {
        const colors = [
          '#8B5CF6', '#06B6D4', '#EC4899', '#F59E0B',
          '#10B981', '#6366F1', '#EF4444', '#3B82F6',
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    },
    isGuest: { type: Boolean, default: true },
    googleId: { type: String, sparse: true },
    email: { type: String, sparse: true },
    favorites: [{ type: String }],
    recentlyPlayed: [
      {
        videoId: String,
        title: String,
        thumbnail: String,
        playedAt: { type: Date, default: Date.now },
      },
    ],
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ googleId: 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', userSchema);
