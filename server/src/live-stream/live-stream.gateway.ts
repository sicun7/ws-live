import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveStreamService } from './live-stream.service';
import { Room } from '../types/room';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly liveStreamService: LiveStreamService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.liveStreamService.handleDisconnect(client.id);
    this.broadcastRoomsList();
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(client: Socket, payload: { roomId: string; title: string }): void {
    client.join(payload.roomId);
    const room = this.liveStreamService.createRoom(client.id, payload.roomId, payload.title);
    client.emit('roomCreated', room);
    this.broadcastRoomsList();
  }

  @SubscribeMessage('getRooms')
  handleGetRooms(client: Socket): void {
    const rooms = this.liveStreamService.getAllRooms();
    client.emit('rooms', rooms);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`Client ${client.id} attempting to join room ${data.roomId}`);
      const room = await this.liveStreamService.joinRoom(data.roomId, client);
      
      // 加入 Socket.IO 房间
      client.join(data.roomId);
      
      // 通知观众已成功加入房间
      client.emit('roomJoined', room);
      
      // 通知广播者有新观众加入，需要发起 offer
      this.server.to(room.hostId).emit('viewerJoined', {
        viewerId: client.id,
        roomId: data.roomId
      });
      
      return room;
    } catch (error) {
      console.error('Error joining room:', error);
      client.emit('error', {
        type: 'JOIN_ROOM_ERROR',
        message: error.message || 'Failed to join room'
      });
      throw error;
    }
  }

  @SubscribeMessage('streamOffer')
  handleStreamOffer(client: Socket, payload: { roomId: string; viewerId: string; offer: RTCSessionDescriptionInit }) {
    this.server.to(payload.viewerId).emit('streamOffer', {
      offer: payload.offer,
      roomId: payload.roomId
    });
  }

  @SubscribeMessage('streamAnswer')
  handleStreamAnswer(client: Socket, payload: { roomId: string; answer: RTCSessionDescriptionInit }) {
    const room = this.liveStreamService.getRoom(payload.roomId);
    if (room) {
      this.server.to(room.hostId).emit('streamAnswer', {
        answer: payload.answer,
        viewerId: client.id
      });
    }
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(client: Socket, payload: { roomId: string; viewerId: string; candidate: RTCIceCandidateInit }) {
    const room = this.liveStreamService.getRoom(payload.roomId);
    if (room) {
      if (client.id === room.hostId) {
        this.server.to(payload.viewerId).emit('iceCandidate', payload.candidate);
      } else {
        this.server.to(room.hostId).emit('iceCandidate', {
          candidate: payload.candidate,
          viewerId: client.id
        });
      }
    }
  }

  private broadcastRoomsList(): void {
    const rooms = this.liveStreamService.getAllRooms();
    this.server.emit('rooms', rooms);
  }
} 