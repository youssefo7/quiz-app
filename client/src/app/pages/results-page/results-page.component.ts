import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-results-page',
    templateUrl: './results-page.component.html',
    styleUrls: ['./results-page.component.scss', '../../../assets/shared.scss'],
})
export class ResultsPageComponent {
    roomId: string | null;
    title: string;

    constructor(private route: ActivatedRoute) {
        this.roomId = this.route.snapshot.paramMap.get('roomId');
        this.title = 'Résultats';
    }
}
