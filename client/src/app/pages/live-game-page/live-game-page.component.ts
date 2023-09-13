import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuizList } from '@app/interfaces/game';
import { CommunicationService } from '@app/services/communication.service';

@Component({
    selector: 'app-live-game-page',
    templateUrl: './live-game-page.component.html',
    styleUrls: ['./live-game-page.component.scss'],
})
export class LiveGamePageComponent {
    game: QuizList;

    constructor(
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        const id: string | null = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.communicationService.getGame(id).subscribe((game) => {
                this.game = game;
            });
        }
    }
}
