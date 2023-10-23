import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-host-game-page',
    templateUrl: './host-game-page.component.html',
    styleUrls: ['./host-game-page.component.scss'],
})
export class HostGamePageComponent implements OnInit {
    @Input() isHost: boolean;
    quiz: Quiz | null;

    constructor(
        private gameService: GameService,
        private readonly route: ActivatedRoute,
    ) {
        this.isHost = true;
    }

    ngOnInit() {
        this.getQuiz();
    }

    async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');
        this.quiz = await this.gameService.getQuizById(id);
    }
}
