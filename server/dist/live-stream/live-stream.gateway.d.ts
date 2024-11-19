import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveStreamService } from './live-stream.service';
import { Room } from '../types/room';
export declare class LiveStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly liveStreamService;
    server: Server;
    constructor(liveStreamService: LiveStreamService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleCreateRoom(client: Socket, roomId: string): Room;
    handleJoinRoom(client: Socket, roomId: string): Room;
    handleStreamOffer(client: Socket, payload: {
        roomId: string;
        viewerId: string;
        offer: RTCSessionDescriptionInit;
    }): void;
    handleStreamAnswer(client: Socket, payload: {
        roomId: string;
        answer: RTCSessionDescriptionInit;
    }): void;
    handleIceCandidate(client: Socket, payload: {
        roomId: string;
        viewerId: string;
        candidate: RTCIceCandidateInit;
    }): void;
}
