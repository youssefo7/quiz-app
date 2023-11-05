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
                this.server.to(data.roomId).emit(TimeEvents.TimerFinished);
            }
        }, this.tickRate);
    }

    @SubscribeMessage(TimeEvents.StopTimer)
    handleStopTimer() {
        clearInterval(this.interval);
        this.interval = null;
    }

    @SubscribeMessage(TimeEvents.TransitionClockFinished)
    handleTransitionClockFinished(_: Socket, roomId: string) {
        this.server.to(roomId).emit(TimeEvents.TransitionClockFinished);
    }

    @SubscribeMessage(TimeEvents.TimerInterrupted)
    handleTimerInterrupted(_: Socket, roomId: string) {
        this.handleStopTimer();
        this.server.to(roomId).emit(TimeEvents.TimerInterrupted);
    }

    private emitUpdatedTime(roomId: string) {
        this.server.to(roomId).emit(TimeEvents.CurrentTimer, this.counter);
        this.counter--;
    }
}
