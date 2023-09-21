import { Component, OnInit } from '@angular/core';
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

    constructor(
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
    ) {
        this.points = 0;
        this.bonusMessage = '';
        this.pointsDisplay = { display: 'none' };
        this.bonusDisplay = { display: 'none' };
        this.buttonStyle = [{ backgroundColor: 'blueviolet', borderColor: 'white', borderWidth: '5px' }];
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

    showCorrectAnswer() {
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

    setButtonStyle(index: number, isSubmit = false) {
        this.buttonStyle[index] = {
            backgroundColor: this.choicesChosen[index] ? 'rgb(0, 51, 204)' : 'blueviolet',
            borderColor: this.choicesChosen[index] ? 'black' : 'white',
            borderWidth: this.choicesChosen[index] ? '7px' : '5px',
        };
        if (isSubmit) {
            this.buttonStyle[index] = {
                backgroundColor: this.question.choices[index].isCorrect ? 'rgb(97, 207, 72)' : 'red',
                borderColor: this.choicesChosen[index] ? 'black' : 'white',
                borderWidth: this.choicesChosen[index] ? '6px' : '5px',
            };
            document.querySelectorAll('button').forEach((button) => button.setAttribute('disabled', 'true'));
        }
    }

    toggleChoice(index: number) {
        this.choicesChosen[index] = !this.choicesChosen[index];
        this.setButtonStyle(index);
    }

    submitAnswer() {
        document.querySelector('input[type="button"]')?.setAttribute('disabled', 'true');
        document.querySelector('input[type="button"]')?.setAttribute('style', 'background-color: grey');
        // 2 functions below will be called when the timer is up (not when the submit button is clicked)
        this.showCorrectAnswer();
        this.givePoints();
    }

    ngOnInit() {
        this.loadQuestions();
    }
}
