import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ITrack {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: number;
}

export interface IQueueItem extends ITrack {
  addedBy: Types.ObjectId;
  addedByUsername: string;
  votes: number;
  skipVotes: Types.ObjectId[];
}

export interface ICurrentTrack extends ITrack {
  startedAt: number;
  pausedAt?: number;
  isPlaying: boolean;
}

export interface IRoom extends Document {
  roomCode: string;
  name: string;
  hostId: Types.ObjectId;
  participants: Array<{
    userId: Types.ObjectId;
    username: string;
    avatarColor: string;
    joinedAt: Date;
    isOnline: boolean;
  }>;
  currentTrack: ICurrentTrack | null;
  queue: IQueueItem[];
  history: Array<{
    videoId: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    playedAt: Date;
  }>;
  settings: {
    allowGuestQueue: boolean;
    allowGuestControl: boolean;
    voteToSkipThreshold: number;
    maxQueueSize: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 6,
      maxlength: 6,
    },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        username: String,
        avatarColor: String,
        joinedAt: { type: Date, default: Date.now },
        isOnline: { type: Boolean, default: true },
      },
    ],
    currentTrack: {
      type: {
        videoId: String,
        title: String,
        thumbnail: String,
        channelTitle: String,
        duration: Number,
        startedAt: Number,
        pausedAt: Number,
        isPlaying: { type: Boolean, default: false },
      },
      default: null,
    },
    queue: [
      {
        videoId: String,
        title: String,
        thumbnail: String,
        channelTitle: String,
        duration: Number,
        addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        addedByUsername: String,
        votes: { type: Number, default: 0 },
        skipVotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    history: [
      {
        videoId: String,
        title: String,
        thumbnail: String,
        channelTitle: String,
        playedAt: { type: Date, default: Date.now },
      },
    ],
    settings: {
      allowGuestQueue: { type: Boolean, default: true },
      allowGuestControl: { type: Boolean, default: false },
      voteToSkipThreshold: { type: Number, default: 0.5 },
      maxQueueSize: { type: Number, default: 50 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ roomCode: 1 }, { unique: true });
roomSchema.index({ isActive: 1 });

export const Room = mongoose.model<IRoom>('Room', roomSchema);
