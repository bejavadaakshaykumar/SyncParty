import type { Server } from 'socket.io';
export declare const socketUserMap: Map<string, {
    userId: string;
    username: string;
    roomCode: string | null;
}>;
export declare function setupSocketIO(io: Server): void;
//# sourceMappingURL=index.d.ts.map