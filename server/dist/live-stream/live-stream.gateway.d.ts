import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveStreamService } from './live-stream.service';
export declare class LiveStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly liveStreamService;
    server: Server;
    constructor(liveStreamService: LiveStreamService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleCreateRoom(client: Socket, payload: {
        roomId: string;
        title: string;
    }): void;
    handleGetRooms(client: Socket): void;
    handleJoinRoom(client: Socket, roomId: string): void;
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
    private broadcastRoomsList;
}
