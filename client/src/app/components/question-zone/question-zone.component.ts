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
    buttonStyle = [{}];
    points = 0;
    bonusMessage = '';
    pointsDisplay = { display: 'none' };
    bonusDisplay = { display: 'none' };
    private readonly Bonus = 1.2;

    constructor(
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
    ) {}

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
        this.choicesChosen = [];
        for (let i = 0; i < this.question.choices.length; i++) {
            // Linting error à cause du for loop (À revoir)
            this.choicesChosen.push(false);
        }
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

    // TODO: Create a function that gives points to the player
    givePoints() {
        if (this.isAnswerGood()) {
            this.points = this.question.points * this.Bonus; // BONUS when 1st to get the answer right (to put in a constant later)
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

    // TODO: Change the style of the validate button when clicked or when enter is pressed (change style of buttons)
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
