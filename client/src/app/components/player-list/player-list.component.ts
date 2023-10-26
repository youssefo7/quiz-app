import { Component } from '@angular/core';

@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss'],
})
export class PlayerListComponent {
    // Juste pour tester l'affichage
    players: string[] = ['Joueur1', 'Joueur2', 'Joueur3', 'jouteur4', 'Joueur5', 'Joueur6', 'Joueur7', 'Joueur8', 'Joueur9', 'Joueur10', 'Joueur11'];
    isHost = true;
    isLocked = false;

    lockGame() {
        this.isLocked = true;
    }

    unlockGame() {
        this.isLocked = false;
    }

    removePlayer(bannedPlayer: string) {
        this.players = this.players.reduce<string[]>((updatedList, player) => {
            if (player !== bannedPlayer) {
                updatedList.push(player);
            }
            return updatedList;
        }, []);
    }
}
