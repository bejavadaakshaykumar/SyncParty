import mongoose, { type Document } from 'mongoose';
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
export declare const Playlist: mongoose.Model<IPlaylist, {}, {}, {}, mongoose.Document<unknown, {}, IPlaylist, {}, {}> & IPlaylist & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Playlist.d.ts.map