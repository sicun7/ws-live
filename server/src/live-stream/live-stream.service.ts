import { Injectable } from '@nestjs/common';
import { Room } from '../types/room';

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

  joinRoom(viewerId: string, roomId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.viewers.includes(viewerId)) {
      room.viewers.push(viewerId);
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