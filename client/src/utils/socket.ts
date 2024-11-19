import { io, Socket } from 'socket.io-client';

export class SocketConnection {
  private socket: Socket;

  constructor(url: string) {
    this.socket = io(url);
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket.on(event, callback);
  }

  emit(event: string, ...args: any[]) {
    this.socket.emit(event, ...args);
  }

  close() {
    this.socket.close();
  }
} 