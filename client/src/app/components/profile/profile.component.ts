import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    @Input() points: number;
    name: string;

    constructor(private route: ActivatedRoute) {
        this.name = '';
    }

    checkGameRoute() {
        const isTestGame = this.route.snapshot.url.some((segment: { path: string }) => segment.path === 'test');
        if (isTestGame) {
            this.name = 'Testeur';
        }
    }

    ngOnInit() {
        this.checkGameRoute();
    }
}
