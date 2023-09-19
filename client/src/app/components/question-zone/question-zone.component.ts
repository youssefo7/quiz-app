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
    }
    // TODO: Connect this function with the timer so that it activates when the time is up
    goToNextQuestion() {
        this.quiz.questions.shift();
        this.getQuestion();
    }

    async loadQuestion() {
        await this.getQuiz();
        this.getQuestion();
    }

    // TODO: Create a function that shows the points when the time is up

    // TODO: Create a function that checks if the answer is correct

    // TODO: Create a function that shows the correct answer (change the style of the button)

    // TODO: Create a function that gives points to the player

    // TODO: Change the style of the button when its selected (clicked)

    // TODO: Change the style of the validate button when clicked

    // TODO: Show something when the player click on the validate button to make him know that he can't change his answer

    ngOnInit() {
        this.loadQuestion();
    }
}
