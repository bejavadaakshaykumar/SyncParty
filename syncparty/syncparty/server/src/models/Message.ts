import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IMessage extends Document {
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
  username: string;
  avatarColor: string;
  content: string;
  type: 'text' | 'emoji' | 'system';
  mentions: string[];
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    avatarColor: { type: String, default: '#8B5CF6' },
    content: { type: String, required: true, maxlength: 1000 },
    type: { type: String, enum: ['text', 'emoji', 'system'], default: 'text' },
    mentions: [{ type: String }],
  },
  { timestamps: true }
);

messageSchema.index({ roomId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
