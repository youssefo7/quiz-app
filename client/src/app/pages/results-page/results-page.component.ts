import { Component } from '@angular/core';

@Component({
    selector: 'app-results-page',
    templateUrl: './results-page.component.html',
    styleUrls: ['./results-page.component.scss', '../../../assets/shared.scss'],
})
export class ResultsPageComponent {
    title: string;

    constructor() {
        this.title = 'Résultats';
    }
}
