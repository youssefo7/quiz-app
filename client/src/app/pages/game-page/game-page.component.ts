import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    title = 'Partie';
    quiz: Quiz;

    constructor(
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
    ) {}

    getQuiz() {
        const id: string | null = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.communicationService.getQuiz(id).subscribe((quiz) => {
                this.quiz = quiz;
            });
        }
    }

    ngOnInit(): void {
        this.getQuiz();
    }
}
