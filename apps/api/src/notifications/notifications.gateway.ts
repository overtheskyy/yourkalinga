import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSocketMap = new Map<string, string[]>();

  constructor(
    private notificationsService: NotificationsService,
    private jwtService: JwtService,
  ) {}

  afterInit() {
    this.notificationsService.setGateway(this);
    this.logger.log('Notifications WebSocket gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'yourkalinga-secret',
      });

      client.data.userId = payload.sub;

      const existing = this.userSocketMap.get(payload.sub) || [];
      this.userSocketMap.set(payload.sub, [...existing, client.id]);

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSocketMap.get(userId) || [];
      this.userSocketMap.set(
        userId,
        sockets.filter((id) => id !== client.id),
      );
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendToUser(userId: string, notification: any) {
    const socketIds = this.userSocketMap.get(userId) || [];
    for (const socketId of socketIds) {
      this.server.to(socketId).emit('notification', notification);
    }
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(client: Socket, notificationId: string) {
    const userId = client.data.userId;
    if (userId) {
      await this.notificationsService.markRead(notificationId, userId);
    }
  }
}
