import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameEvents } from '@app/events/game.events';
import { TimeEvents } from '@app/events/time.events';
import { Question, Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-question-zone-stats',
    templateUrl: './question-zone-stats.component.html',
    styleUrls: ['./question-zone-stats.component.scss'],
})
export class QuestionZoneStatsComponent implements OnInit, OnDestroy {
    quiz: Quiz | null;
    question: Question;
    isNextQuestionButtonDisable: boolean;
    nextQuestionButtonText: string;
    nextQuestionButtonStyle: { backgroundColor: string };
    private currentQuestionIndex: number;
    private lastQuestionIndex: number;
    private isEndOfQuestionTime: boolean;
    private timeServiceSubscription: Subscription;

    constructor(
        private gameService: GameService,
        private readonly route: ActivatedRoute,
        private readonly socketClientService: SocketClientService,
    ) {
        this.currentQuestionIndex = 0;
        this.isNextQuestionButtonDisable = true;
        this.nextQuestionButtonText = 'Prochaine Question';
        this.nextQuestionButtonStyle = { backgroundColor: '' };
        this.isEndOfQuestionTime = false;
    }

    ngOnInit() {
        this.setEvents();
    }

    ngOnDestroy() {
        if (this.timeServiceSubscription) this.timeServiceSubscription.unsubscribe();
    }

    goToNextQuestion() {
        const roomId = this.route.snapshot.paramMap.get('roomId');
        if (this.currentQuestionIndex !== this.lastQuestionIndex) {
            this.socketClientService.send(GameEvents.NextQuestion, roomId);
        } else {
            this.socketClientService.send(GameEvents.ShowResults, roomId);
        }
    }

    private reactToNextQuestionEvent() {
        this.socketClientService.on(GameEvents.NextQuestion, () => {
            this.isEndOfQuestionTime = true;
            this.isNextQuestionButtonDisable = true;
            this.nextQuestionButtonStyle = { backgroundColor: '' };
        });
    }

    private async getQuiz() {
        const quizId = this.route.snapshot.paramMap.get('quizId');
        this.quiz = await this.gameService.getQuizById(quizId);
        if (this.quiz) {
            this.lastQuestionIndex = this.quiz.questions.length - 1;
        }
    }

    private async setEvents() {
        await this.getQuiz();
        this.getQuestion(this.currentQuestionIndex);
        this.enableNextQuestionButton();
        this.reactToNextQuestionEvent();
    }

    private getQuestion(index: number) {
        if (this.quiz && index < this.quiz.questions.length) {
            this.question = this.quiz.questions[index];
        }
    }

    private enableNextQuestionButton() {
        this.socketClientService.on(TimeEvents.CurrentTimer, (time: number) => {
            this.detectEndOfQuestion(time);
        });

        this.socketClientService.on(TimeEvents.TimerInterrupted, () => {
            this.detectEndOfQuestion(0);
        });

        this.socketClientService.on(TimeEvents.TransitionClockFinished, () => {
            this.showNextQuestion();
        });
    }

    private detectEndOfQuestion(time: number) {
        if (time === 0) {
            this.isEndOfQuestionTime = !this.isEndOfQuestionTime;
            if (this.isEndOfQuestionTime) {
                this.isNextQuestionButtonDisable = false;
                this.nextQuestionButtonStyle = { backgroundColor: 'rgb(18, 18, 217)' };
            }
        }
    }

    private showNextQuestion() {
        if (!this.isEndOfQuestionTime && this.quiz) {
            this.currentQuestionIndex++;
            this.getQuestion(this.currentQuestionIndex);
            if (this.currentQuestionIndex === this.lastQuestionIndex) {
                this.nextQuestionButtonText = 'Voir les résultats';
            }
        }
    }
}
