import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TimeEvents } from './time.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class TimeGateway {
    @WebSocketServer() private server: Server;
    private interval: ReturnType<typeof setInterval> | null;
    private counter: number;
    private tickRate: number;

    @SubscribeMessage(TimeEvents.StartTimer)
    handleStartTimer(_: Socket, data: { initialTime: number; tickRate: number; roomId: string }) {
        if (this.interval) return;

        this.counter = data.initialTime;
        this.tickRate = data.tickRate;
        this.emitUpdatedTime(data.roomId);

        this.interval = setInterval(() => {
            if (this.counter >= 0) {
                this.emitUpdatedTime(data.roomId);
            } else {
                this.handleStopTimer();
            }
        }, this.tickRate);
    }

    @SubscribeMessage(TimeEvents.StopTimer)
    handleStopTimer() {
        clearInterval(this.interval);
        this.interval = null;
    }

    private emitUpdatedTime(roomId: string) {
        this.server.to(roomId).emit(TimeEvents.CurrentTimer, this.counter);
        this.counter--;
    }
}
