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

    ngOnInit() {
        const isTestGame = this.route.snapshot.url.some((segment: { path: string }) => segment.path === 'test');
        this.name = isTestGame ? 'Testeur' : 'Joueur A';
    }
}
