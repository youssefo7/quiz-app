import { Component, OnInit } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';

@Component({
    selector: 'app-quiz-general-info',
    templateUrl: './quiz-general-info.component.html',
    styleUrls: ['./quiz-general-info.component.scss'],
})
export class QuizGeneralInfoComponent implements OnInit {
    newQuiz: Quiz;
    constructor(private quizController: NewQuizManagerService) {}

    ngOnInit(): void {
        this.newQuiz = this.quizController.getNewQuiz();
    }
}
