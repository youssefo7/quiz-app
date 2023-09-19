import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Question, Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';

@Component({
    selector: 'app-quiz-question-info',
    templateUrl: './quiz-question-info.component.html',
    styleUrls: ['./quiz-question-info.component.scss'],
})
export class QuizQuestionInfoComponent implements OnInit {
    myForm: FormGroup;
    newQuiz: Quiz;
    questions: Question[];
    index: number;

    questionInfoForm = this.fb.group({
        type: '',
        text: '',
        points: 10,
    });

    constructor(
        private quizManagerService: NewQuizManagerService,
        private fb: FormBuilder,
    ) {}

    ngOnInit(): void {
        this.newQuiz = this.quizManagerService.getNewQuiz();
        this.questions = this.quizManagerService.getNewQuizQuestions();
    }

    roundToNearest10() {
        const incrementOf10 = 10;
        return Math.round((this.questionInfoForm.value.points as number) / incrementOf10) * incrementOf10;
    }
}
