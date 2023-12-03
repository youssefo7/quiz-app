import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GameEventOptions } from '@app/interfaces/game-event-options';
import { GameEvents } from '@common/game.events';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class SocketDisconnectionService {
    constructor(
        private readonly socketClientService: SocketClientService,
        private readonly router: Router,
    ) {}

    handleDisconnectEvent(options: GameEventOptions) {
        if (this.socketClientService.socketExists() || options.isTestGame) {
            options.initialization?.();
            return;
        }

        this.tryToReconnectAndHandleEvent(options);
        this.router.navigateByUrl('home/');
    }

    private tryToReconnectAndHandleEvent(options: GameEventOptions) {
        this.socketClientService.connect();
        if (!this.socketClientService.socketExists()) return;

        const eventData = this.buildEventData(options);
        this.socketClientService.send(eventData.event, eventData.data, () => {
            this.socketClientService.disconnect();
        });
    }

    private buildEventData(options: GameEventOptions) {
        const commonData = { roomId: options.roomId };
        if (options.isHost) {
            return {
                event: GameEvents.EndGame,
                data: { ...commonData, gameAborted: options.gameAborted },
            };
        }
        return {
            event: GameEvents.PlayerLeaveGame,
            data: { ...commonData, isInGame: options.isInGame },
        };
    }
}
