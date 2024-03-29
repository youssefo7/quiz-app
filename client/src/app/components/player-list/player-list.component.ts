import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { JoinEvents } from '@common/join.events';
import { TimeEvents } from '@common/time.events';
import { WaitingEvents } from '@common/waiting.events';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss'],
})
export class PlayerListComponent implements OnInit {
    players: string[];
    bannedPlayers: string[];
    startGameMessage: string;
    isHost: boolean;
    isLocked: boolean;
    transitionCounter: number;
    showCountdown: boolean;
    private roomId: string | null;

    // Raison: J'injecte les services nécessaires dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private popUp: MatDialog,
        private socketClientService: SocketClientService,
        private roomCommunicationService: RoomCommunicationService,
    ) {
        this.players = [];
        this.bannedPlayers = [];
        this.isLocked = false;
        this.isHost = this.route.snapshot.url.some((segment) => segment.path === 'host');
        this.roomId = this.route.snapshot.paramMap.get('roomId');
        this.showCountdown = false;
        this.transitionCounter = 0;
    }

    async ngOnInit() {
        if (!this.socketClientService.socketExists()) {
            return;
        }
        this.listenToSocketEvents();
        this.players = await firstValueFrom(this.roomCommunicationService.getRoomPlayers(this.roomId as string));
        this.updateStartGameMessage();
    }

    toggleGameLock() {
        this.isLocked = !this.isLocked;
        this.socketClientService.send(this.isLocked ? WaitingEvents.LockRoom : WaitingEvents.UnlockRoom, this.roomId);
        this.updateStartGameMessage();
    }

    banPlayer(name: string) {
        this.socketClientService.send(WaitingEvents.BanName, { roomId: this.roomId, name });
    }

    startGame() {
        this.socketClientService.send(TimeEvents.StartTimer, { initialTime: 5, tickRate: 1000, roomId: this.roomId });
    }

    private updateStartGameMessage() {
        this.startGameMessage =
            this.players.length === 0
                ? 'Il doit y avoir au moins un joueur dans la salle pour commencer une partie.'
                : !this.isLocked
                ? 'La salle doit être verrouillée avant de commencer la partie.'
                : '';
    }

    private removePlayer(name: string) {
        this.players = this.players.filter((player) => player !== name);
    }

    private gameBeginsRedirection() {
        const quizId = this.route.snapshot.paramMap.get('quizId');
        if (!this.isHost) {
            this.router.navigateByUrl(`game/${quizId}/room/${this.roomId}`);
        } else {
            this.socketClientService.send(GameEvents.StartGame, this.roomId);
            this.router.navigateByUrl(`game/${quizId}/room/${this.roomId}/host`);
        }
    }

    private countdown(time: number) {
        this.transitionCounter = time;
    }

    private banPopup() {
        const config: PopupMessageConfig = {
            message: 'Vous avez été banni de la partie.',
            hasCancelButton: false,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.router.navigateByUrl('home/');
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    private listenToSocketEvents() {
        this.socketClientService.on(JoinEvents.PlayerHasJoined, (name: string) => {
            this.players.push(name);
            this.updateStartGameMessage();
        });

        this.socketClientService.on(WaitingEvents.BanName, (name: string) => {
            this.bannedPlayers.push(name);
            this.removePlayer(name);
            this.updateStartGameMessage();
        });

        this.socketClientService.on(GameEvents.PlayerAbandonedGame, (name: string) => {
            this.removePlayer(name);
            this.updateStartGameMessage();
        });

        this.socketClientService.on(WaitingEvents.BanNotification, () => {
            this.banPopup();
        });

        this.socketClientService.on(TimeEvents.CurrentTimer, (time: number) => {
            this.showCountdown = true;
            this.countdown(time);
        });

        this.socketClientService.on(TimeEvents.TimerFinished, () => {
            this.gameBeginsRedirection();
        });
    }
}
