import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinTable')
  handleJoinTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tableId?: number },
  ) {
    if (!body?.tableId) {
      return { ok: false };
    }

    client.join(`table-${body.tableId}`);

    return {
      ok: true,
      tableId: body.tableId,
    };
  }

  sendTableUpdate(tableId: number, payload: unknown) {
    this.server.to(`table-${tableId}`).emit(`table-${tableId}-updated`, payload);
    this.server.emit(`table-${tableId}-updated`, payload);
  }
}
