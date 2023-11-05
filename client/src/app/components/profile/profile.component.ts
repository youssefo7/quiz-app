import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    @Input() points: number;
    @Input() isHost: boolean;
    @Input() playerName: string | null;
    name: string;

    constructor(private readonly route: ActivatedRoute) {
        this.name = '';
        this.isHost = false;
    }

    ngOnInit() {
        this.name = this.getProfileName();
    }

    getProfileName() {
        const isTestGame = this.route.snapshot.url.some((segment: { path: string }) => segment.path === 'test');
        let profileName = '';

        if (isTestGame) {
            profileName = 'Testeur';
        } else if (this.isHost) {
            profileName = 'Organisateur';
        } else {
            profileName = this.playerName as string;
        }

        return profileName;
    }
}
