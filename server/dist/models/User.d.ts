import mongoose, { type Document } from 'mongoose';
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
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map