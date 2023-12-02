import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GameEventOptions } from '@app/interfaces/game-even-options';
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
        if (!this.socketClientService.socketExists() && !options.isTestGame) {
            this.socketClientService.connect();

            if (this.socketClientService.socketExists()) {
                const playerEventData = { roomId: options.roomId, isInGame: options.isInGame };
                const hostEventData = { roomId: options.roomId, gameAborted: options.gameAborted };

                if (options.isHost) {
                    this.socketClientService.send(GameEvents.EndGame, hostEventData, () => {
                        this.socketClientService.disconnect();
                    });
                } else {
                    this.socketClientService.send(GameEvents.PlayerLeaveGame, playerEventData, () => {
                        this.socketClientService.disconnect();
                    });
                }
            }
            this.router.navigateByUrl('home/');
        } else {
            options.connectActions?.();
        }
    }
}
