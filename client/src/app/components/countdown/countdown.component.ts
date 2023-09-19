import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { TimeService } from '@app/services/time.service';

@Component({
    selector: 'app-countdown',
    templateUrl: './countdown.component.html',
    styleUrls: ['./countdown.component.scss'],
})
export class CountdownComponent implements OnInit {
    quiz: Quiz;
    private readonly transitionTime = 3;
    private readonly isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');

    constructor(
        private readonly timeService: TimeService,
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
        private router: Router,
    ) {}

    get time(): number {
        return this.timeService.time;
    }

    async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            return new Promise<void>((resolve) => {
                this.communicationService.getQuiz(id).subscribe((quiz) => {
                    this.quiz = quiz;
                    resolve();
                });
            });
        }
    }

    async gameClock() {
        for (let i = 0; i < this.quiz.questions.length; i++) {
            await this.timeService.startTimer(this.transitionTime);
            await this.timeService.startTimer(this.quiz.duration);
        }
    }

    // Est-ce que c'est mieux que j'insère la variable isTestGame dans la fonction ou non?
    async loadTimer() {
        await this.getQuiz();
        await this.gameClock();
        if (this.isTestGame) {
            this.leaveGame();
        }
    }

    async leaveGame() {
        await this.timeService.startTimer(this.transitionTime);
        this.router.navigateByUrl('/admin'); // TODO : Change this to the create-game
    }

    ngOnInit() {
        this.loadTimer();
    }
}
