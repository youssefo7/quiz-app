import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameEvents } from '@app/events/game.events';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-results-page',
    templateUrl: './results-page.component.html',
    styleUrls: ['./results-page.component.scss', '../../../assets/shared.scss'],
})
export class ResultsPageComponent implements OnInit, OnDestroy {
    roomId: string | null;
    title: string;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private socketClientService: SocketClientService,
    ) {
        this.roomId = this.route.snapshot.paramMap.get('roomId');
        this.title = 'Résultats';
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeUnloadHandler() {
        this.handleNavigation();
    }

    ngOnDestroy() {
        this.handleNavigation();
    }

    handleNavigation() {
        const currentUrl = this.router.url;
        if (currentUrl.includes('host')) {
            this.socketClientService.send(GameEvents.EndGame, { roomId: this.roomId, gameAborted: false });
        } else {
            this.socketClientService.send(GameEvents.PlayerLeaveGame, { roomId: this.roomId, isInGame: true });
        }
        this.socketClientService.disconnect();
    }

    async ngOnInit() {
        const currentUrl = this.router.url;
        if (!this.socketClientService.socketExists()) {
            this.socketClientService.connect();
            while (this.socketClientService.socketExists()) {
                if (currentUrl.includes('host')) {
                    this.socketClientService.send(GameEvents.EndGame, { roomId: this.roomId, gameAborted: false });
                } else {
                    this.socketClientService.send(GameEvents.PlayerLeaveGame, { roomId: this.roomId, isInGame: true });
                }
                this.socketClientService.disconnect();
            }
            this.router.navigateByUrl('home/');
            return;
        }
    }
}
