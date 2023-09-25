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
    message: string;
    clockStyle: { backgroundColor: string };
    private readonly transitionTime: number;

    // Raison: J'injecte 4 services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private readonly timeService: TimeService,
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
        private router: Router,
    ) {
        this.transitionTime = 3;
    }

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

    async transitionClock() {
        this.message = 'Préparez-vous!';
        this.clockStyle = { backgroundColor: '#E5E562' };
        await this.timeService.startTimer(this.transitionTime);
    }

    async questionClock() {
        this.message = 'Temps Restant';
        this.clockStyle = { backgroundColor: 'lightblue' };
        await this.timeService.startTimer(this.quiz.duration);
    }

    async gameClock() {
        const lastQuestionIndex = this.quiz.questions.length - 1;
        // Raison: Boucle for in/of pas pertinent, car je n'ai pas besoin des éléments du tableau
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i <= lastQuestionIndex; i++) {
            await this.questionClock();
            if (i === lastQuestionIndex) break;
            await this.transitionClock();
        }
        this.leaveGame();
    }

    async leaveGame() {
        const isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
        if (!isTestGame) return;
        const exitTransitionTime = 3000;
        setTimeout(() => {
            this.router.navigateByUrl('/game/new');
        }, exitTransitionTime);
    }

    async loadTimer() {
        await this.getQuiz();
        this.gameClock();
    }

    ngOnInit() {
        this.loadTimer();
    }
}
