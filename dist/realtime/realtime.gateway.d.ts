import { Server, Socket } from 'socket.io';
export declare class RealtimeGateway {
    server: Server;
    handleJoinTable(client: Socket, body: {
        tableId?: number;
    }): {
        ok: boolean;
        tableId?: undefined;
    } | {
        ok: boolean;
        tableId: number;
    };
    sendTableUpdate(tableId: number, payload: unknown): void;
}
