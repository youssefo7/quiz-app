import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
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
    isQuestionTransitioning: boolean;
    currentQuestionIndex: number;
    points: number;
    quiz: Quiz | null;
    question: Question;
    chosenChoices: boolean[];
    choiceButtonStyle: { backgroundColor: string }[];
    submitButtonStyle: { backgroundColor: string };
    bonusMessage: string;
    pointsDisplay: { display: string };
    isSubmitDisabled: boolean;
    isChoiceButtonDisabled: boolean;
    doesDisplayPoints: boolean;
    hasGameEnded: boolean;
    private timerSubscription: Subscription;
    private gameServiceSubscription: Subscription;

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private route: ActivatedRoute,
        private elementRef: ElementRef,
        private gameService: GameService,
        private readonly timeService: TimeService,
    ) {
        this.pointsEarned = new EventEmitter<number>();
        this.isQuestionTransitioning = false;
        this.currentQuestionIndex = 0;
        this.points = 0;
        this.choiceButtonStyle = [{ backgroundColor: '' }];
        this.submitButtonStyle = { backgroundColor: '' };
        this.isSubmitDisabled = true;
        this.isChoiceButtonDisabled = false;
        this.doesDisplayPoints = false;
        this.hasGameEnded = false;
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
            if (!this.isSubmitDisabled) {
                this.submitAnswerOnClickEvent();
            }
        } else {
            const choiceIndex = parseInt(keyPressed, 10) - 1;
            this.toggleChoice(choiceIndex);
            this.setSubmitButtonStateOnChoices();
        }
    }

    ngOnInit() {
        this.loadQuiz();
        this.subscribeToTimer();
        this.subscribeToGameService();
    }

    ngOnDestroy() {
        this.timerSubscription.unsubscribe();
        this.gameServiceSubscription.unsubscribe();
    }

    async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');
        this.quiz = await this.gameService.getQuizById(id);
    }

    async loadQuiz() {
        await this.getQuiz();
        this.getQuestion();
    }

    focusOnButton() {
        this.elementRef.nativeElement.querySelector('button')?.focus();
    }

    subscribeToTimer() {
        this.timerSubscription = this.timeService.getTime().subscribe((time: number) => {
            if (!this.hasGameEnded) {
                const timerTime = time;
                if (timerTime === 0) {
                    if (!this.isQuestionTransitioning) {
                        this.submitAnswerOnCountdownEvent();
                        this.isQuestionTransitioning = true;
                    } else {
                        this.isQuestionTransitioning = false;
                        ++this.currentQuestionIndex;
                        this.getQuestion(this.currentQuestionIndex);
                    }
                }
            }
        });
    }

    subscribeToGameService() {
        this.gameServiceSubscription = this.gameService.hasGameEndedObservable.subscribe((hasEnded: boolean) => {
            this.hasGameEnded = hasEnded;
        });
    }

    getQuestion(index: number = 0) {
        if (this.quiz && index <= this.quiz.questions.length) {
            this.question = this.quiz.questions[index];
            this.chosenChoices = new Array(this.question.choices.length).fill(false);
            this.question.choices.forEach((choice, buttonIndex) => {
                this.setButtonToInitState(buttonIndex);
            });
        }
    }

    toggleChoice(index: number) {
        if (!isNaN(index) && index >= 0 && index < this.chosenChoices.length) {
            this.chosenChoices[index] = !this.chosenChoices[index];
        }
    }

    setSubmitButtonToDisabled(isDisabled: boolean, backgroundColor: { backgroundColor: string }) {
        this.isSubmitDisabled = isDisabled;
        this.submitButtonStyle = backgroundColor;
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

    setButtonToInitState(index: number) {
        this.choiceButtonStyle[index] = { backgroundColor: '' };
        this.isChoiceButtonDisabled = false;
        this.submitButtonStyle = { backgroundColor: '' };
        this.hidePoints();
    }

    setButtonStateOnSubmit(index: number) {
        this.choiceButtonStyle[index] = {
            backgroundColor: this.question.choices[index].isCorrect ? 'rgb(97, 207, 72)' : 'red',
        };
        this.isChoiceButtonDisabled = true;
    }

    async submitAnswerOnClickEvent() {
        this.gameService.setButtonPressState = true;
        this.showResult();
        this.isQuestionTransitioning = true;
    }

    async submitAnswerOnCountdownEvent() {
        this.showResult();
    }

    isAnswerGood() {
        const isAnswerGood = this.chosenChoices.every((answer, index) => answer === this.question.choices[index].isCorrect);
        return isAnswerGood;
    }

    displayCorrectAnswer() {
        this.question.choices.forEach((choice, index) => {
            this.setButtonStateOnSubmit(index);
        });
        this.showPoints();
    }

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

    showResult() {
        this.setSubmitButtonToDisabled(true, { backgroundColor: 'grey' });
        this.displayCorrectAnswer();
        this.givePoints();
    }

    showPoints() {
        this.doesDisplayPoints = true;
    }

    hidePoints() {
        this.doesDisplayPoints = false;
    }
}
