import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';

dotenv.config();

import { CommentEntity } from '../orm/entities/comment.entity';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class WSGateway {
  @WebSocketServer()
  server: Server;

  emitEventToClients(eventName: string, data: CommentEntity) {
    this.server.emit(eventName, data);
  }
}
