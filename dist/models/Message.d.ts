import mongoose, { type Document, type Types } from 'mongoose';
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
export declare const Message: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}, {}> & IMessage & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Message.d.ts.map