import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';

@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss'],
})
export class PlayerListComponent {
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

    isHost = true;
    isLocked: boolean;

    constructor(
        private router: Router,
        private popUp: MatDialog,
    ) {}

    lockGame() {
        this.isLocked = true;
    }

    unlockGame() {
        this.isLocked = false;
    }

    // À enlever (juste pour tester)
    removePlayer(bannedPlayer: string) {
        this.players = this.players.reduce<string[]>((updatedList, player) => {
            if (player !== bannedPlayer) {
                updatedList.push(player);
            }
            return updatedList;
        }, []);
    }

    startGame(): void {
        if (!this.isHost) {
            // naviguer vers: /game/:quizId/room/:roomId/
            this.router.navigate([]);
        } else {
            // naviguer vers: /game/:quizId/room/:roomId/host
            this.router.navigate([]);
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
            message: 'Êtes-vous sur de vouloir annuler la partie?',
            hasCancelButton: true,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
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
                this.router.navigate(['home/']);
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }
}
