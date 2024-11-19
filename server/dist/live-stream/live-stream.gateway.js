"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const live_stream_service_1 = require("./live-stream.service");
let LiveStreamGateway = class LiveStreamGateway {
    constructor(liveStreamService) {
        this.liveStreamService = liveStreamService;
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.liveStreamService.handleDisconnect(client.id);
        this.broadcastRoomsList();
    }
    handleCreateRoom(client, payload) {
        client.join(payload.roomId);
        const room = this.liveStreamService.createRoom(client.id, payload.roomId, payload.title);
        client.emit('roomCreated', room);
        this.broadcastRoomsList();
    }
    handleGetRooms(client) {
        const rooms = this.liveStreamService.getAllRooms();
        client.emit('rooms', rooms);
    }
    handleJoinRoom(client, roomId) {
        const room = this.liveStreamService.joinRoom(client.id, roomId);
        client.join(roomId);
        client.emit('roomJoined', room);
        this.server.to(room.hostId).emit('viewerJoined', {
            viewerId: client.id,
            roomId: roomId
        });
        this.broadcastRoomsList();
    }
    handleStreamOffer(client, payload) {
        this.server.to(payload.viewerId).emit('streamOffer', {
            offer: payload.offer,
            roomId: payload.roomId
        });
    }
    handleStreamAnswer(client, payload) {
        const room = this.liveStreamService.getRoom(payload.roomId);
        if (room) {
            this.server.to(room.hostId).emit('streamAnswer', {
                answer: payload.answer,
                viewerId: client.id
            });
        }
    }
    handleIceCandidate(client, payload) {
        const room = this.liveStreamService.getRoom(payload.roomId);
        if (room) {
            if (client.id === room.hostId) {
                this.server.to(payload.viewerId).emit('iceCandidate', payload.candidate);
            }
            else {
                this.server.to(room.hostId).emit('iceCandidate', {
                    candidate: payload.candidate,
                    viewerId: client.id
                });
            }
        }
    }
    broadcastRoomsList() {
        const rooms = this.liveStreamService.getAllRooms();
        this.server.emit('rooms', rooms);
    }
};
exports.LiveStreamGateway = LiveStreamGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LiveStreamGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('createRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveStreamGateway.prototype, "handleCreateRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getRooms'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], LiveStreamGateway.prototype, "handleGetRooms", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], LiveStreamGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('streamOffer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveStreamGateway.prototype, "handleStreamOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('streamAnswer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveStreamGateway.prototype, "handleStreamAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('iceCandidate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveStreamGateway.prototype, "handleIceCandidate", null);
exports.LiveStreamGateway = LiveStreamGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [live_stream_service_1.LiveStreamService])
], LiveStreamGateway);
//# sourceMappingURL=live-stream.gateway.js.map