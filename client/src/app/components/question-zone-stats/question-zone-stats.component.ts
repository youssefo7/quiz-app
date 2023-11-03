import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { TimeService } from '@app/services/time.service';
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
    private isEndOfQuestionTime: boolean;
    private timeServiceSubscription: Subscription;

    constructor(
        private gameService: GameService,
        private readonly timeService: TimeService,
        private readonly route: ActivatedRoute,
    ) {
        this.currentQuestionIndex = 0;
        this.isNextQuestionButtonDisable = true;
        this.nextQuestionButtonText = 'Prochaine Question';
        this.nextQuestionButtonStyle = { backgroundColor: '' };
        this.isEndOfQuestionTime = false;
    }

    ngOnInit() {
        this.loadQuiz();
    }

    ngOnDestroy() {
        if (this.timeServiceSubscription) this.timeServiceSubscription.unsubscribe();
    }

    goToNextQuestion() {
        this.isEndOfQuestionTime = true;
        this.isNextQuestionButtonDisable = true;
        this.nextQuestionButtonStyle = { backgroundColor: '' };
        this.gameService.isNextQuestionPressed.next(true);
    }

    private async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');
        this.quiz = await this.gameService.getQuizById(id);
    }

    private async loadQuiz() {
        await this.getQuiz();
        this.getQuestion(this.currentQuestionIndex);
        this.enableNextQuestionButton();
    }

    private getQuestion(index: number) {
        if (this.quiz && index < this.quiz.questions.length) {
            this.question = this.quiz.questions[index];
        }
    }

    private enableNextQuestionButton() {
        this.timeServiceSubscription = this.timeService.getTime().subscribe((time) => {
            if (time === 0) {
                this.isEndOfQuestionTime = !this.isEndOfQuestionTime;
                if (this.isEndOfQuestionTime) {
                    this.isNextQuestionButtonDisable = false;
                    this.nextQuestionButtonStyle = { backgroundColor: 'rgb(18, 18, 217)' };
                }
                this.showNextQuestion();
            }
        });
    }

    private showNextQuestion() {
        if (!this.isEndOfQuestionTime && this.quiz) {
            const lastQuestionIndex = this.quiz.questions.length - 1;
            this.currentQuestionIndex++;
            this.getQuestion(this.currentQuestionIndex);
            if (this.currentQuestionIndex === lastQuestionIndex) {
                this.nextQuestionButtonText = 'Voir les résultats';
            }
        }
    }
}
