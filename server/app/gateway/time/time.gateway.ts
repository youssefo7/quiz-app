import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TimeEvents } from './time.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class TimeGateway {
    @WebSocketServer() private server: Server;
    constructor(private roomManagerService: RoomManagerService) {}

    @SubscribeMessage(TimeEvents.StartTimer)
    handleStartTimer(socket: Socket, data: { initialTime: number; tickRate: number; roomId: string }) {
        let counter = data.initialTime;
        const room = this.roomManagerService.findRoom(data.roomId);
        if (room.timer) return;

        this.server.to(data.roomId).emit(TimeEvents.CurrentTimer, counter);
        counter--;

        room.timer = setInterval(() => {
            if (counter >= 0) {
                this.server.to(data.roomId).emit(TimeEvents.CurrentTimer, counter);
                counter--;
            } else {
                this.handleStopTimer(socket, data.roomId);
                this.server.to(data.roomId).emit(TimeEvents.TimerFinished);
            }
        }, data.tickRate);
    }

    @SubscribeMessage(TimeEvents.StopTimer)
    handleStopTimer(_: Socket, roomId: string) {
        const room = this.roomManagerService.findRoom(roomId);
        if (room) {
            clearInterval(room.timer);
            room.timer = null;
        }
    }

    @SubscribeMessage(TimeEvents.TransitionClockFinished)
    handleTransitionClockFinished(_: Socket, roomId: string) {
        this.server.to(roomId).emit(TimeEvents.TransitionClockFinished);
    }

    @SubscribeMessage(TimeEvents.TimerInterrupted)
    handleTimerInterrupted(socket: Socket, roomId: string) {
        this.handleStopTimer(socket, roomId);
        this.server.to(roomId).emit(TimeEvents.TimerInterrupted);
    }

    @SubscribeMessage(TimeEvents.PauseTimer)
    handlePauseStartTimer(socket: Socket, data) {
        if (data.isPaused) {
            this.handleStopTimer(socket, data.roomId);
        } else {
            this.handleStartTimer(socket, { initialTime: data.currentTime, tickRate: 1000, roomId: data.roomId });
        }
    }

    @SubscribeMessage(TimeEvents.PanicMode)
    handlePanicTimer(socket: Socket, data) {
        this.handleStopTimer(socket, data.roomId);
        this.handleStartTimer(socket, { initialTime: data.currentTime, tickRate: 250, roomId: data.roomId });
    }
}
