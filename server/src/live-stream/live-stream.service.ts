import { Injectable } from '@nestjs/common';
import { Room } from '../types/room';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class LiveStreamService {
  private rooms: Map<string, Room> = new Map();

  createRoom(hostId: string, roomId: string, title: string): Room {
    if (this.rooms.has(roomId)) {
      throw new Error('Room already exists');
    }

    const room: Room = {
      id: roomId,
      title,
      hostId,
      viewers: [],
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  async joinRoom(roomId: string, client: Socket): Promise<Room> {
    console.log('Join room request:', {
      roomId,
      clientId: client.id,
      availableRooms: Array.from(this.rooms.entries())
    });
    
    const room = this.rooms.get(roomId);
    if (!room) {
      console.error(`Room ${roomId} not found. Available rooms:`, 
        Array.from(this.rooms.keys()));
      throw new WsException({
        status: 'error',
        message: `Room ${roomId} not found. Please check if the broadcaster is still streaming.`
      });
    }
    
    if (!room.viewers.includes(client.id)) {
      room.viewers.push(client.id);
      console.log(`Added viewer ${client.id} to room ${roomId}`);
    }
    
    return room;
  }

  handleDisconnect(clientId: string): void {
    this.rooms.forEach((room, roomId) => {
      if (room.hostId === clientId) {
        this.rooms.delete(roomId);
      } else {
        room.viewers = room.viewers.filter(id => id !== clientId);
      }
    });
  }
} 