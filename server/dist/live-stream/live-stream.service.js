"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamService = void 0;
const common_1 = require("@nestjs/common");
let LiveStreamService = class LiveStreamService {
    constructor() {
        this.rooms = new Map();
    }
    createRoom(hostId, roomId) {
        if (this.rooms.has(roomId)) {
            throw new Error('Room already exists');
        }
        const room = {
            id: roomId,
            hostId,
            viewers: [],
        };
        this.rooms.set(roomId, room);
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    joinRoom(viewerId, roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        if (!room.viewers.includes(viewerId)) {
            room.viewers.push(viewerId);
        }
        return room;
    }
    handleDisconnect(clientId) {
        this.rooms.forEach((room, roomId) => {
            if (room.hostId === clientId) {
                this.rooms.delete(roomId);
            }
            else {
                room.viewers = room.viewers.filter(id => id !== clientId);
            }
        });
    }
};
exports.LiveStreamService = LiveStreamService;
exports.LiveStreamService = LiveStreamService = __decorate([
    (0, common_1.Injectable)()
], LiveStreamService);
//# sourceMappingURL=live-stream.service.js.map