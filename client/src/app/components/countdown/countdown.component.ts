import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
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

    // Raison: J'injecte 4 services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private readonly timeService: TimeService,
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
        private router: Router,
        private gameService: GameService,
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

    async transitionClock() {
        const transitionTime = 3;
        this.message = 'Préparez-vous!';
        this.clockStyle = { backgroundColor: '#E5E562' };
        await this.timeService.startTimer(transitionTime);
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
        if (isTestGame) {
            this.gameService.setGameEndState = true;
            const exitTransitionTime = 3;
            this.message = 'Redirection vers «Organiser Partie»';
            this.clockStyle = { backgroundColor: 'white' };
            await this.timeService.startTimer(exitTransitionTime);
            this.router.navigateByUrl('/game/new');
        }
    }

    async loadTimer() {
        await this.getQuiz();
        this.gameClock();
    }

    ngOnInit() {
        this.loadTimer();
    }
}
