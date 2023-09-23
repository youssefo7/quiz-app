import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';

@Component({
    selector: 'app-question-zone',
    templateUrl: './question-zone.component.html',
    styleUrls: ['./question-zone.component.scss'],
})
export class QuestionZoneComponent implements OnInit {
    quiz: Quiz;
    question: Question;
    choicesChosen: boolean[];
    buttonStyle: { backgroundColor: string; borderColor: string; borderWidth: string }[];
    points: number;
    bonusMessage: string;
    pointsDisplay: { display: string };
    bonusDisplay: { display: string };
    keyPressed: string;

    constructor(
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
        private elementRef: ElementRef,
    ) {
        this.points = 0;
        this.bonusMessage = '';
        this.pointsDisplay = { display: 'none' };
        this.bonusDisplay = { display: 'none' };
        this.buttonStyle = [{ backgroundColor: '', borderColor: '', borderWidth: '' }];
    }

    @HostListener('document:keydown', ['$event'])
    preventDefaultEnter(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    }

    @HostListener('document:keyup', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        this.keyPressed = event.key;
        if (this.keyPressed === 'Enter') {
            this.submitAnswer();
        } else {
            const keyNumber = parseInt(this.keyPressed, 10) - 1;
            this.toggleChoice(keyNumber);
        }
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

    setButtonStyle(index: number, isSubmit = false) {
        this.buttonStyle[index] = {
            backgroundColor: this.choicesChosen[index] ? 'rgb(0, 51, 204)' : 'blueviolet',
            borderColor: this.choicesChosen[index] ? 'black' : 'white',
            borderWidth: this.choicesChosen[index] ? '10px' : 'thick',
        };
        if (isSubmit) {
            this.buttonStyle[index] = {
                backgroundColor: this.question.choices[index].isCorrect ? 'rgb(97, 207, 72)' : 'red',
                borderColor: this.choicesChosen[index] ? 'black' : 'white',
                borderWidth: this.choicesChosen[index] ? '10px' : 'thick',
            };
            this.elementRef.nativeElement.querySelectorAll('button').forEach((button: HTMLButtonElement) => button.setAttribute('disabled', 'true'));
        }
    }

    toggleChoice(index: number) {
        if (isNaN(index) || index < 0 || index >= this.choicesChosen.length) return;
        this.choicesChosen[index] = !this.choicesChosen[index];
        this.setButtonStyle(index);
    }

    getQuestion() {
        this.question = this.quiz.questions[0];
        this.choicesChosen = new Array(this.question.choices.length).fill(false);
    }
    // TODO: Connect this function with the timer so that it activates when the time is up
    goToNextQuestion() {
        this.quiz.questions.shift();
        this.getQuestion();
    }

    async loadQuestions() {
        await this.getQuiz();
        this.getQuestion();
    }

    // TODO: Create a function that shows the points when the time is up
    showPoints() {
        this.pointsDisplay = { display: 'block' };
    }

    isAnswerGood() {
        const isAnswerGood = this.choicesChosen.every((answer, index) => answer === this.question.choices[index].isCorrect);
        return isAnswerGood;
    }

    submitAnswer() {
        this.elementRef.nativeElement.querySelector('input[type="button"]')?.setAttribute('disabled', 'true');
        this.elementRef.nativeElement.querySelector('input[type="button"]')?.setAttribute('style', 'background-color: grey');
        this.displayCorrectAnswer();
        this.givePoints();
    }

    displayCorrectAnswer() {
        this.question.choices.forEach((choice, index) => {
            this.setButtonStyle(index, true);
        });
        this.showPoints();
    }

    // TODO: Make this function actually give points to the player
    givePoints() {
        const bonus = 1.2; // Could be in a const file
        if (this.isAnswerGood()) {
            this.points = this.question.points * bonus;
            this.bonusMessage = '(20% bonus Woohoo!)';
        }
        return this.points;
    }

    ngOnInit() {
        this.loadQuestions();
    }
}
