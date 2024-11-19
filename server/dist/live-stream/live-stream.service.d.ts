import { Room } from '../types/room';
export declare class LiveStreamService {
    private rooms;
    createRoom(hostId: string, roomId: string): Room;
    getRoom(roomId: string): Room | undefined;
    joinRoom(viewerId: string, roomId: string): Room;
    handleDisconnect(clientId: string): void;
}
