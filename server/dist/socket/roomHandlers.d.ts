import type { Server, Socket } from 'socket.io';
export declare function handleUserLeftRoom(io: Server, socket: Socket, roomCode: string, userId: string, username: string): Promise<void>;
export declare function setupRoomHandlers(io: Server, socket: Socket): void;
//# sourceMappingURL=roomHandlers.d.ts.map