import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-live-game-page',
    templateUrl: './live-game-page.component.html',
    styleUrls: ['./live-game-page.component.scss'],
})
export class LiveGamePageComponent implements OnInit {
    link = '/home';

    constructor(private route: ActivatedRoute) {}

    isTestGame(): void {
        const isTestGame: boolean = this.route.snapshot.url.some((segment) => segment.path === 'test');
        if (isTestGame) {
            this.link = '/game'; // TODO: Change with create-game route
        }
    }

    ngOnInit(): void {
        this.isTestGame();
    }
}
