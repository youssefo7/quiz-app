import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-question-zone-stats',
    templateUrl: './question-zone-stats.component.html',
    styleUrls: ['./question-zone-stats.component.scss'],
})
export class QuestionZoneStatsComponent implements OnInit {
    quiz: Quiz | null;
    question: Question;
    currentQuestionIndex: number;

    constructor(
        private gameService: GameService,
        private readonly route: ActivatedRoute,
    ) {
        this.currentQuestionIndex = 0;
    }

    ngOnInit() {
        this.loadQuiz();
    }

    async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');
        this.quiz = await this.gameService.getQuizById(id);
    }

    async loadQuiz() {
        await this.getQuiz();
        this.getQuestion(this.currentQuestionIndex);
    }

    getQuestion(index: number) {
        if (this.quiz && index <= this.quiz.questions.length) {
            this.question = this.quiz.questions[index];
        }
    }
}
