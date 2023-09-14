import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Socket } from 'socket.io';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private readonly logger;
    private server;
    private readonly room;
    constructor(logger: Logger);
    validate(socket: Socket, word: string): void;
    validateWithAck(_: Socket, word: string): {
        isValid: boolean;
    };
    broadcastAll(socket: Socket, message: string): void;
    joinRoom(socket: Socket): void;
    roomMessage(socket: Socket, message: string): void;
    afterInit(): void;
    handleConnection(socket: Socket): void;
    handleDisconnect(socket: Socket): void;
    private emitTime;
}
