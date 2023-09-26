import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuizGeneralInfoComponent } from '@app/components/quiz-general-info/quiz-general-info.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { Question, Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-create-quiz-form',
    templateUrl: './create-quiz-form.component.html',
    styleUrls: ['./create-quiz-form.component.scss'],
})
export class CreateQuizFormComponent implements OnInit, AfterViewInit {
    @Input() questionIndex: number;
    @ViewChild(QuizQuestionInfoComponent, { static: false }) quizQuestionInfo: QuizQuestionInfoComponent;
    @ViewChild(QuizGeneralInfoComponent, { static: false }) quizGeneralInfo: QuizGeneralInfoComponent;
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');
    quizzes: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);
    selectedQuiz: BehaviorSubject<Quiz | null> = new BehaviorSubject<Quiz | null>(null);
    newQuiz: Quiz;
    isQuizToModify: boolean;
    quizId: string;

    constructor(
        private readonly communicationService: CommunicationService,
        private quizManagerService: NewQuizManagerService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.getQuizListFromServer();
        this.questionIndex = 0;
        this.newQuiz = this.quizManagerService.getNewQuiz();

        const routeParams = this.route.snapshot.paramMap;
        this.quizId = String(routeParams.get('id'));
        // if(this.quizId != null) {
        //     this.quizManagerService.getQuizById(this.quizId);
        //     this.newQuiz = this.quizManagerService.getQuizToModify();
        // }
    }

    ngAfterViewInit(): void {
        if (this.quizId != null) {
            this.isQuizToModify = true;
            // const quizToModify = this.quizManagerService.getQuizToModify();
            // console.log(quizToModify);
            // this.loadQuizToModify(quizToModify);
        } else {
            this.isQuizToModify = false;
        }
    }

    getQuizListFromServer(): void {
        this.communicationService.getQuizzes().subscribe({
            next: (quizzes) => {
                this.quizzes.next(quizzes);
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

    // addQuizToServer(newQuiz: Quiz): void {
    //     this.communicationService.addQuiz(newQuiz).subscribe({
    //         next: () => {
    //             this.getQuizListFromServer();
    //             newQuiz.id = '';
    //         },
    //         error: (err: HttpErrorResponse) => {
    //             const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
    //             this.message.next(responseString);
    //         },
    //     });
    // }

    getQuizFromServer(id: string): void {
        this.communicationService.getQuiz(id).subscribe({
            next: (quiz) => {
                this.selectedQuiz.next(quiz);
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

    deleteQuizFromServer(id: string): void {
        this.communicationService.deleteQuiz(id).subscribe({
            next: () => {
                this.getQuizListFromServer();
                this.selectedQuiz.next(null);
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

    // loadQuizToModify(quizToModify: Quiz) {
    //     this.quizGeneralInfo.loadGeneralInformation(quizToModify);
    //     // this.newQuiz = quizToModify;
    // }

    modifyQuestion(selectedQuestion: Question, selectedIndex: number) {
        this.quizQuestionInfo.loadQuestionInformation(selectedQuestion, selectedIndex);
    }

    isQuizFormValid(): boolean {
        if (
            this.newQuiz.questions.some((question) => this.isQuestionValid(question)) &&
            this.newQuiz.title !== '' &&
            this.newQuiz.description !== '' &&
            this.newQuiz.duration !== 0
        ) {
            return true;
        }
        return false;
    }

    isQuestionValid(question: Question): boolean {
        return (
            question.text.trim().length > 0 &&
            question.type.trim().length > 0 &&
            question.choices.length >= 2 &&
            question.choices.some((choice) => choice.text.trim().length > 0) &&
            question.choices.some((choice) => choice.isCorrect)
        );
    }

    deleteQuestion(index: number): void {
        if (index >= 0 && index < this.newQuiz.questions.length) {
            this.newQuiz.questions.splice(index, 1);
            this.quizQuestionInfo.resetForm();
        }
        // if(this.isQuizToModify && this.quizId !== null) {
        //     this.quizManagerService.updateQuiz(this.quizId, this.newQuiz);
        // }
    }

    // repositionQuestions(index: number) {
    //     for (let i = index; i < this.newQuiz.questions.length; i++) {
    //         let tmp = this.newQuiz.questions.
    //         this.newQuiz.questions[index] = this.newQuiz.questions[index + 1];
    //     }
    // }

    moveQuestionUp(index: number) {
        if (index > 0) {
            const tmp = this.newQuiz.questions[index - 1];
            this.newQuiz.questions[index - 1] = this.newQuiz.questions[index];
            this.newQuiz.questions[index] = tmp;
        }
    }

    moveQuestionDown(index: number) {
        if (index < this.newQuiz.questions.length - 1) {
            const tmp = this.newQuiz.questions[index + 1];
            this.newQuiz.questions[index + 1] = this.newQuiz.questions[index];
            this.newQuiz.questions[index] = tmp;
        }
    }

    saveQuiz() {
        // if(!this.isQuizToModify) {
        this.quizManagerService.addNewQuiz(this.newQuiz);
        // }
        // else {
        //     this.quizManagerService.updateQuiz(this.quizId, this.newQuiz);
        //     this.isQuizToModify = false;
        //     this.quizId = '';
        // }
    }
}

// loadQuestionInformation(selectedQuestion: Question) {
//     if (this.quizQuestionInfo) {
//         this.quizQuestionInfo.loadQuestionInformation(selectedQuestion);
//         this.selectedQuestionIndex = this.newQuiz.questions.findIndex((question) => question === selectedQuestion);
//     }
// }

// onQuestionModified(event: { question: Question; index: number }) {
//     console.log("onModified");
//     const modifiedQuestion = event.question;
//     const index = event.index;
//     const nonValidIndex = -1;
//     if (index !== nonValidIndex) {
//         if (index < this.newQuiz.questions.length) {
//             this.newQuiz.questions[index] = modifiedQuestion;
//         }
//     }
// }

// onQuestionModified(event: { question: Question; index: number }) {
//     const modifiedQuestion = event.question;
//     const index = event.index;

//     if (index !== undefined && index !== null && index >= 0 && index < this.newQuiz.questions.length) {
//         this.newQuiz.questions[index] = modifiedQuestion;
//     } else {
//         this.newQuiz.questions.push(modifiedQuestion);
//     }
// }
