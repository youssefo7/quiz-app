import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';
import { BehaviorSubject } from 'rxjs';

// const date = new Date();
// const dateStr = date.toLocaleString('en-US', { timeZone: 'America/New_York' });

@Component({
    selector: 'app-create-quiz-form',
    templateUrl: './create-quiz-form.component.html',
    styleUrls: ['./create-quiz-form.component.scss'],
})
export class CreateQuizFormComponent implements OnInit {
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');
    quizzes: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);
    selectedQuiz: BehaviorSubject<Quiz | null> = new BehaviorSubject<Quiz | null>(null);

    // newQuiz: Quiz = {
    //     $schema: '',
    //     id: '',
    //     title: '',
    //     description: '',
    //     duration: 0,
    //     lastModification: dateStr,
    //     visibility: true,
    //     questions: [
    //         {
    //             type: '',
    //             text: '',
    //             points: 0,
    //             choices: [
    //                 {
    //                     text: '',
    //                     isCorrect: false,
    //                 },
    //             ],
    //         },
    //     ],
    // };
    newQuiz: Quiz;

    constructor(
        private readonly communicationService: CommunicationService,
        private quizController: NewQuizManagerService,
    ) {}
    ngOnInit(): void {
        this.newQuiz = this.quizController.getNewQuiz();
        this.getQuizListFromServer();
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

    addQuizToServer(newQuiz: Quiz): void {
        this.communicationService.addQuiz(newQuiz).subscribe({
            next: () => {
                this.getQuizListFromServer();
                newQuiz.id = '';
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

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

    // updateIsCorrect(index: number): void {
    //     this.newQuiz.questions[index].choices[index].isCorrect = true;
    // }

    // addNewResponse() {
    //     if(this.newQuiz.questions[index].choices.length < 4) {
    //         let newDiv = document.createElement('div');
    //         newDiv.className = "newAnswer";
    //         let newChoiceLabel = document.createElement('label');
    //         newChoiceLabel.innerHTML = "Choix:";
    //         let newChoiceInput = document.createElement('input');
    //         newChoiceInput.setAttribute('[(ngModel)]', 'this.newQuiz.questions[1].choices[1].text');
    //         newChoiceInput.placeholder = "Choix";
    //         let newSwitchLabel = document.createElement('label');
    //         newSwitchLabel.className = "switch";
    //         let newCheckBoxInput = document.createElement('input');
    //         newCheckBoxInput.type = "checkbox";
    //         let newSliderSpan = document.createElement('span');
    //         newSliderSpan.className = 'slider round';
    //         // newSliderSpan.onclick = (this.newQuiz.questions[1].choices[1].isCorrect = true);
    //         newSwitchLabel.appendChild(newCheckBoxInput);
    //         newSwitchLabel.appendChild(newSliderSpan);

    //         newDiv.appendChild(newChoiceLabel);
    //         newDiv.appendChild(newChoiceInput);
    //         newDiv.appendChild(newSwitchLabel);

    //         document.querySelector('#newChoice')?.appendChild(newDiv);
    //     }
    // }

    // addNewInput() {
    //     const newInput = document.createElement('input');
    //     newInput.setAttribute('placeholder', 'new input test');
    //     newInput.type = 'text';
    //     document.querySelector('#test')?.appendChild(newInput);
    // }
}
