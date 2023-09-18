import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    name: string;
    points = 0;
    private readonly isTestGame: boolean = this.route.snapshot.url.some((segment) => segment.path === 'test');

    constructor(private route: ActivatedRoute) {}

    checkGameRoute(isTestGame: boolean = this.isTestGame) {
        if (isTestGame) {
            this.name = 'Testeur';
        }
    }

    ngOnInit() {
        this.checkGameRoute();
    }
}
