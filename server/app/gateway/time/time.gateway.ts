import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { Timer } from '@common/timer';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class TimeGateway {
    @WebSocketServer() private server: Server;
    constructor(private roomManagerService: RoomManagerService) {}

    @SubscribeMessage(TimeEvents.StartTimer)
    handleStartTimer(socket: Socket, timer: Timer) {
        let counter = timer.initialTime;
        const room = this.roomManagerService.findRoom(timer.roomId);
        const organizer = room.organizer.socketId;
        if (room.timer) {
            return;
        }
        this.server.to(timer.roomId).emit(TimeEvents.CurrentTimer, counter);
        counter--;

        room.timer = setInterval(() => {
            if (counter >= 0) {
                this.server.to(timer.roomId).emit(TimeEvents.CurrentTimer, counter);
                counter--;
            } else {
                this.handleStopTimer(socket, timer.roomId);
                this.server.to(timer.roomId).emit(TimeEvents.TimerFinished, timer.isTransitionTimer);
                const nbOfPlayers = room.players.length;
                if (nbOfPlayers === 0 && !timer.isTransitionTimer) {
                    this.server.to(organizer).emit(GameEvents.AllPlayersSubmitted);
                }
            }
        }, timer.tickRate);
    }

    @SubscribeMessage(TimeEvents.StopTimer)
    handleStopTimer(_: Socket, roomId: string) {
        const room = this.roomManagerService.findRoom(roomId);
        if (room) {
            clearInterval(room.timer);
            room.timer = null;
        }
    }

    @SubscribeMessage(TimeEvents.TimerInterrupted)
    handleTimerInterrupted(socket: Socket, roomId: string) {
        this.handleStopTimer(socket, roomId);
        this.server.to(roomId).emit(TimeEvents.TimerInterrupted);
    }

    @SubscribeMessage(TimeEvents.ToggleTimer)
    handleToggleTimer(socket: Socket, timer: Timer) {
        if (timer.isPaused) {
            this.handleStopTimer(socket, timer.roomId);
        } else {
            this.handleStartTimer(socket, timer);
        }
    }

    @SubscribeMessage(TimeEvents.PanicMode)
    handlePanicTimer(socket: Socket, timer: Timer) {
        this.handleStopTimer(socket, timer.roomId);
        this.handleStartTimer(socket, timer);
        this.server.to(timer.roomId).emit(TimeEvents.PanicMode);
    }
}
