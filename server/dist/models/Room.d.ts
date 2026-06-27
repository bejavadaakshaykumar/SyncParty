import mongoose, { type Document, type Types } from 'mongoose';
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
export declare const Room: mongoose.Model<IRoom, {}, {}, {}, mongoose.Document<unknown, {}, IRoom, {}, {}> & IRoom & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Room.d.ts.map