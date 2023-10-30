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
    // Juste pour tester l'affichage
    players: string[] = [
        'Joueur1',
        'Joueur2',
        'Joueur3',
        'joueur4',
        'Joueur5',
        'Joueur6',
        'Joueur7',
        'Joueur8',
        'Joueur9',
        'Joueur10',
        'Joueur11',
        'Joueur12',
        'Joueur13',
    ];

    bannedPlayers: string[] = ['test1', 'test1', 'test1', 'test1', 'test1', 'test1', 'test1'];

    isHost: boolean;
    isLocked: boolean;
    roomId: string | null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private popUp: MatDialog,
        private socketClientService: SocketClientService,
    ) {
        this.isHost = this.route.snapshot.url.some((segment) => segment.path === 'host');
        this.roomId = this.route.snapshot.paramMap.get('roomId');
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
    }

    ngOnInit(): void {
        this.listenToSocketEvents();
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
        }
    }

    quitPopUp(): void {
        // TODO: Gérer le click sur la flèche de retour de page
        if (!this.isHost) {
            this.playerQuitPopup();
        } else {
            this.hostQuitPopup();
        }
    }

    hostQuitPopup(): void {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sur de vouloir annuler la partie?',
            hasCancelButton: true,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.socketClientService.send(GameEvents.EndGame, { roomId: this.roomId, gameAborted: true });
                this.router.navigate(['home/']);
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    playerQuitPopup(): void {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sur de vouloir quitter?',
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
}
