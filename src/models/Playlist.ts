import mongoose, { Schema, type Document } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  tracks: Array<{
    videoId: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    duration: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tracks: [
      {
        videoId: { type: String, required: true },
        title: { type: String, required: true },
        thumbnail: { type: String, required: true },
        channelTitle: { type: String, required: true },
        duration: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

playlistSchema.index({ ownerId: 1 });

export const Playlist = mongoose.model<IPlaylist>('Playlist', playlistSchema);
