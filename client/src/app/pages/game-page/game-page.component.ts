import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss', '../../../assets/shared.scss'],
})
export class GamePageComponent implements OnInit {
    title = 'Partie';
    link = '/home';
    quiz: Quiz;
    private readonly isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');

    constructor(
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
    ) {}

    checkGameRoute(isTestGame = this.isTestGame) {
        if (isTestGame) {
            this.link = '/admin'; // TODO: Change with create-game route
            this.title += ' - Test';
        }
    }

    getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.communicationService.getQuiz(id).subscribe((quiz) => {
                this.quiz = quiz;
            });
        }
    }

    ngOnInit() {
        this.checkGameRoute();
        this.getQuiz();
    }
}
