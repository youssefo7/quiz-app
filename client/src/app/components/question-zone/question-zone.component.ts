import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { TimeService } from '@app/services/time.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-question-zone',
    templateUrl: './question-zone.component.html',
    styleUrls: ['./question-zone.component.scss'],
})
export class QuestionZoneComponent implements OnInit, OnDestroy {
    @Output() pointsEarned: EventEmitter<number>;
    isQuestionTransition: boolean;
    currentQuestionIndex: number;
    points: number;
    quiz: Quiz;
    question: Question;
    chosenChoices: boolean[];
    choiceButtonStyle: { backgroundColor: string }[];
    submitButtonStyle: { backgroundColor: string };
    bonusMessage: string;
    pointsDisplay: { display: string };
    isSubmitDisabled: boolean;
    isChoiceButtonDisabled: boolean;
    private mySubscription: Subscription;

    // Raison: J'injecte 5 services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
        private elementRef: ElementRef,
        private gameService: GameService,
        private readonly timeService: TimeService,
    ) {
        this.pointsEarned = new EventEmitter<number>();
        this.isQuestionTransition = false;
        this.currentQuestionIndex = 0;
        this.points = 0;
        this.choiceButtonStyle = [{ backgroundColor: '' }];
        this.submitButtonStyle = { backgroundColor: '' };
        this.isSubmitDisabled = true;
        this.isChoiceButtonDisabled = false;
    }

    @HostListener('keypress', ['$event'])
    preventDefaultEnter(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    }

    @HostListener('keyup', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        const keyPressed = event.key;

        if (keyPressed === 'Enter') {
            if (this.isSubmitDisabled) return;
            this.submitAnswerOnClickEvent();
        } else {
            const choiceIndex = parseInt(keyPressed, 10) - 1;
            this.toggleChoice(choiceIndex);
            this.setSubmitButtonStateOnChoices();
        }
    }

    focusOnButton() {
        this.elementRef.nativeElement.querySelector('button')?.focus();
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

    subscribeToTimer() {
        this.mySubscription = this.timeService.getTime().subscribe((time: number) => {
            const timerTime = time;
            if (timerTime === 0) {
                if (!this.isQuestionTransition) {
                    this.submitAnswerOnCountdownEvent();
                    this.isQuestionTransition = true;
                } else {
                    this.isQuestionTransition = false;
                    ++this.currentQuestionIndex;
                    this.getQuestion(this.currentQuestionIndex);
                }
            }
        });
    }

    getQuestion(index: number = 0) {
        if (index >= this.quiz.questions.length) return;
        this.question = this.quiz.questions[index];
        this.chosenChoices = new Array(this.question.choices.length).fill(false);
        this.question.choices.forEach((choice, buttonIndex) => {
            this.setButtonsToInitState(buttonIndex);
        });
    }

    toggleChoice(index: number) {
        if (isNaN(index) || index < 0 || index >= this.chosenChoices.length) return;
        this.chosenChoices[index] = !this.chosenChoices[index];
    }

    disableSubmitButton() {
        this.isSubmitDisabled = true;
        this.submitButtonStyle = { backgroundColor: 'grey' };
    }

    setSubmitButtonStateOnChoices() {
        if (this.chosenChoices.some((choice) => choice === true)) {
            this.isSubmitDisabled = false;
            this.submitButtonStyle = { backgroundColor: 'green' };
        } else {
            this.isSubmitDisabled = true;
            this.submitButtonStyle = { backgroundColor: 'grey' };
        }
    }

    setButtonsToInitState(index: number) {
        this.choiceButtonStyle[index] = { backgroundColor: '' };
        this.isChoiceButtonDisabled = false;
        this.submitButtonStyle = { backgroundColor: '' };
        this.hidePoints();
    }

    setButtonsStateOnSubmit(index: number) {
        this.choiceButtonStyle[index] = {
            backgroundColor: this.question.choices[index].isCorrect ? 'rgb(97, 207, 72)' : 'red',
        };
        this.isChoiceButtonDisabled = true;
    }

    async submitAnswerOnClickEvent() {
        this.gameService.setButtonPressState = true;
        this.disableSubmitButton();
        this.displayCorrectAnswer();
        this.givePoints();
        this.isQuestionTransition = true;
    }

    async submitAnswerOnCountdownEvent() {
        this.disableSubmitButton();
        this.displayCorrectAnswer();
        this.givePoints();
    }

    isAnswerGood() {
        const isAnswerGood = this.chosenChoices.every((answer, index) => answer === this.question.choices[index].isCorrect);
        return isAnswerGood;
    }
    displayCorrectAnswer() {
        this.question.choices.forEach((choice, index) => {
            this.setButtonsStateOnSubmit(index);
        });
        this.showPoints();
    }

    // TODO: Ajouter le point bonus seulement au joueur qui à soumis la bonne réponse en 1er (Sprint 2)
    givePoints() {
        if (!this.isAnswerGood()) {
            this.points = 0;
            this.bonusMessage = '';
        } else {
            const bonus = 1.2;
            this.points = this.question.points * bonus;
            this.bonusMessage = '(20% bonus Woohoo!)';
        }
        this.pointsEarned.emit(this.points);
    }

    showPoints() {
        this.pointsDisplay = { display: 'block' };
    }

    hidePoints() {
        this.pointsDisplay = { display: 'none' };
    }

    async loadQuestions() {
        await this.getQuiz();
        this.getQuestion();
    }

    ngOnInit() {
        this.loadQuestions();
        this.subscribeToTimer();
    }

    ngOnDestroy() {
        this.mySubscription.unsubscribe();
    }
}
