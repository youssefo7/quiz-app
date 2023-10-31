import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { GameEvents } from '@app/events/game.events';
import { JoinEvents } from '@app/events/join.events';
import { WaitingEvents } from '@app/events/waiting.events';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss'],
})
export class PlayerListComponent implements OnInit {
    players: string[] = [];

    bannedPlayers: string[] = [];

    isHost: boolean;
    isLocked: boolean;
    roomId: string | null;

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private popUp: MatDialog,
        private socketClientService: SocketClientService,
    ) {
        this.isHost = this.route.snapshot.url.some((segment) => segment.path === 'host');
        this.roomId = this.route.snapshot.paramMap.get('roomId');
    }

    // TODO: flèche de retour
    /* @HostListener('window:popstate')
    onPopState() {
        this.quitPopUp();
    } */

    ngOnInit(): void {
        this.socketClientService.connect();
        this.listenToSocketEvents();
    }

    listenToSocketEvents() {
        this.socketClientService.on(JoinEvents.PlayerHasJoined, (name: string) => {
            this.players.push(name);
        });

        this.socketClientService.on(WaitingEvents.BanName, (name: string) => {
            this.bannedPlayers.push(name);
            this.removePlayer(name);
        });

        this.socketClientService.on(GameEvents.PlayerAbandonedGame, (name: string) => {
            this.removePlayer(name);
        });

        this.socketClientService.on(GameEvents.StartGame, () => {
            this.startGame();
        });

        this.socketClientService.on(GameEvents.GameAborted, () => {
            this.gameEndPopup();
        });
    }

    lockGame() {
        this.socketClientService.send(WaitingEvents.LockRoom);
        this.isLocked = true;
    }

    unlockGame() {
        this.socketClientService.send(WaitingEvents.UnlockRoom);
        this.isLocked = false;
    }

    removePlayer(name: string) {
        const index = this.players.findIndex((player) => player === name);
        this.players.splice(index, 1);
    }

    startGame(): void {
        const quizId = this.route.snapshot.paramMap.get('quizId');
        if (!this.isHost) {
            this.router.navigate(['game/', quizId, 'room/', this.roomId]);
        } else {
            this.router.navigate(['game/', quizId, 'room/', this.roomId, 'host/']);
            this.socketClientService.send(GameEvents.StartGame);
        }
    }

    quitPopUp(): void {
        if (!this.isHost) {
            this.playerQuitPopup();
        } else {
            this.hostQuitPopup();
        }
    }

    hostQuitPopup(): void {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sur de vouloir quitter? Tous les joueurs seront exclus de la partie.',
            hasCancelButton: true,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.socketClientService.send(GameEvents.GameAborted, { roomId: this.roomId, gameAborted: true });
                this.router.navigate(['home/']);
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    playerQuitPopup(): void {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sur de vouloir abandonner la partie?',
            hasCancelButton: true,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.socketClientService.send(GameEvents.PlayerLeaveGame, this.roomId);
                this.router.navigate(['home/']);
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    gameEndPopup(): void {
        const config: PopupMessageConfig = {
            message: "L'organisateur a quitté. La partie est terminée.",
            hasCancelButton: false,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.router.navigate(['home/']);
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }
}
