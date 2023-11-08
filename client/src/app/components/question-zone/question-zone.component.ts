import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameEvents } from '@app/events/game.events';
import { TimeEvents } from '@app/events/time.events';
import { Question, Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { Subscription } from 'rxjs';

const BONUS_20_PERCENT = 0.2;
const BONUS_120_PERCENT = 1.2;

@Component({
    selector: 'app-question-zone',
    templateUrl: './question-zone.component.html',
    styleUrls: ['./question-zone.component.scss'],
})
export class QuestionZoneComponent implements OnInit, OnDestroy {
    @Output() pointsEarned: EventEmitter<number>;
    @Input() quiz: Quiz;
    @Input() roomId: string | null;
    isQuestionTransitioning: boolean;
    currentQuestionIndex: number;
    points: number;
    question: Question;
    chosenChoices: boolean[];
    choiceButtonStyle: { backgroundColor: string }[];
    submitButtonStyle: { backgroundColor: string };
    bonusMessage: string;
    pointsDisplay: { display: string };
    isSubmitDisabled: boolean;
    isChoiceButtonDisabled: boolean;
    doesDisplayPoints: boolean;
    pointsToDisplay: number;
    private isTestGame: boolean;
    private hasGameEnded: boolean;
    private timerSubscription: Subscription;
    private gameServiceSubscription: Subscription;
    private hasReceivedBonus: boolean;
    private hasSentAnswer: boolean;

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private gameService: GameService,
        private readonly route: ActivatedRoute,
        private readonly elementRef: ElementRef,
        private readonly timeService: TimeService,
        private socketClientService: SocketClientService,
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
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
        this.hasReceivedBonus = false;
        this.pointsToDisplay = 0;
        this.hasSentAnswer = false;
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
                this.submitAnswerOnClick();
            }
        } else {
            const choiceIndex = parseInt(keyPressed, 10) - 1;
            this.toggleChoice(choiceIndex);
            this.setSubmitButtonStateOnChoices();
        }
    }

    ngOnInit() {
        if (!this.socketClientService.socketExists() && !this.isTestGame) {
            return;
        }
        this.getQuestion(this.currentQuestionIndex);
        this.subscribeToTimer();
        this.detectEndGame();
        this.handleTransitionClockFinished();
        this.handleBonusPoints();
        this.handlePlayerAbandonedGame();
    }

    ngOnDestroy() {
        if (this.isTestGame) {
            this.timeService.stopTimer();
            if (this.timerSubscription) this.timerSubscription.unsubscribe();
            if (this.gameServiceSubscription) this.gameServiceSubscription.unsubscribe();
        }
    }

    focusOnButton() {
        this.elementRef.nativeElement.querySelector('button')?.focus();
    }

    subscribeToTimer() {
        if (this.isTestGame) {
            this.timerSubscription = this.timeService.getTime().subscribe((time: number) => {
                this.detectEndOfQuestion(time);
            });
        } else {
            this.socketClientService.on(TimeEvents.CurrentTimer, (time: number) => {
                this.detectEndOfQuestion(time);
            });

            this.socketClientService.on(TimeEvents.TimerInterrupted, () => {
                this.detectEndOfQuestion(0);
            });
        }
    }

    detectEndGame() {
        if (this.isTestGame) {
            this.gameServiceSubscription = this.gameService.hasGameEndedObservable.subscribe((hasEnded: boolean) => {
                this.hasGameEnded = hasEnded;
            });
        } else {
            this.socketClientService.on(GameEvents.ShowResults, () => {
                this.hasGameEnded = true;
            });
        }
    }

    getQuestion(index: number) {
        if (this.quiz && index < this.quiz.questions.length) {
            this.question = this.quiz.questions[index];
            this.chosenChoices = new Array(this.question.choices.length).fill(false);
            this.question.choices.forEach((choice, buttonIndex) => {
                this.setButtonToInitState(buttonIndex);
            });
        }
    }

    toggleChoice(index: number) {
        const isIndexInbound = index >= 0 && index < this.chosenChoices.length;
        if (!isNaN(index) && isIndexInbound) {
            this.chosenChoices[index] = !this.chosenChoices[index];
            if (this.chosenChoices[index]) {
                this.socketClientService.send(GameEvents.QuestionChoiceSelect, { roomId: this.roomId, questionChoiceIndex: index });
            } else {
                this.socketClientService.send(GameEvents.QuestionChoiceUnselect, { roomId: this.roomId, questionChoiceIndex: index });
            }
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
        this.doesDisplayPoints = false;
    }

    setButtonStateOnSubmit(index: number) {
        this.choiceButtonStyle[index] = {
            backgroundColor: this.question.choices[index].isCorrect ? 'rgb(97, 207, 72)' : 'red',
        };
        this.isChoiceButtonDisabled = true;
    }

    submitAnswerOnClick() {
        if (this.isTestGame) {
            this.gameService.setButtonPressState = true;
            this.givePoints();
            this.isQuestionTransitioning = true;
        } else {
            this.setSubmitButtonToDisabled(true, { backgroundColor: 'grey' });
            this.socketClientService.send(GameEvents.SubmitQuestionOnClick, this.roomId);
            if (this.isAnswerGood()) {
                this.points = this.question.points;
                this.socketClientService.send(GameEvents.GoodAnswerOnClick, this.roomId);
            } else {
                this.socketClientService.send(GameEvents.BadAnswerOnClick, this.roomId);
            }
            this.hasSentAnswer = true;
        }
    }

    submitAnswerOnFinishedTimer() {
        this.setSubmitButtonToDisabled(true, { backgroundColor: 'grey' });
        this.socketClientService.send(GameEvents.SubmitQuestionOnFinishedTimer, this.roomId);
        this.hasSentAnswer = true;
        if (this.isAnswerGood()) {
            this.points = this.question.points;
            this.socketClientService.send(GameEvents.GoodAnswerOnFinishedTimer, this.roomId);
        } else {
            this.socketClientService.send(GameEvents.BadAnswerOnFinishedTimer, this.roomId);
        }
    }

    isAnswerGood() {
        const isAnswerGood = this.chosenChoices?.every((answer, index) => answer === this.question.choices[index].isCorrect);
        return isAnswerGood;
    }

    displayCorrectAnswer() {
        this.question.choices.forEach((choice, index) => {
            this.setButtonStateOnSubmit(index);
        });
        this.doesDisplayPoints = true;
    }

    giveBonus() {
        const bonus = this.isTestGame ? BONUS_120_PERCENT : BONUS_20_PERCENT;
        this.pointsToDisplay = this.question.points * BONUS_120_PERCENT;
        this.points = this.question.points * bonus;
        this.bonusMessage = '(20% bonus Woohoo!)';
    }

    givePoints() {
        if (this.isTestGame) {
            if (this.isAnswerGood()) {
                this.giveBonus();
            } else {
                this.points = 0;
                this.bonusMessage = '';
                this.pointsToDisplay = 0;
            }
            this.pointsEarned.emit(this.points);
        } else {
            if (!this.hasReceivedBonus) {
                if (this.isAnswerGood()) {
                    this.points = this.question.points;
                    this.pointsToDisplay = this.question.points;
                } else {
                    this.points = 0;
                    this.pointsToDisplay = 0;
                }
                this.bonusMessage = '';
                this.socketClientService.send(GameEvents.AddPointsToPlayer, { roomId: this.roomId, points: this.points });
            }
        }
        this.showResult();
    }

    showResult() {
        this.setSubmitButtonToDisabled(true, { backgroundColor: 'grey' });
        this.displayCorrectAnswer();
    }

    private handleTransitionClockFinished() {
        this.socketClientService.on(TimeEvents.TransitionClockFinished, () => {
            this.isQuestionTransitioning = false;
            this.hasReceivedBonus = false;
            ++this.currentQuestionIndex;
            this.getQuestion(this.currentQuestionIndex);
            this.hasSentAnswer = false;
        });
    }

    private handleBonusPoints() {
        this.socketClientService.on(GameEvents.GiveBonus, () => {
            this.hasReceivedBonus = true;
            this.giveBonus();
            this.givePoints();
            this.socketClientService.send(GameEvents.AddPointsToPlayer, { roomId: this.roomId, points: this.points });
        });
    }

    private detectEndOfQuestion(time: number) {
        if (!this.hasGameEnded && time === 0) {
            if (!this.isQuestionTransitioning) {
                if (!this.hasSentAnswer) {
                    this.submitAnswerOnFinishedTimer();
                }
                this.isQuestionTransitioning = true;
                this.givePoints();
            } else if (this.isTestGame) {
                this.isQuestionTransitioning = false;
                ++this.currentQuestionIndex;
                this.getQuestion(this.currentQuestionIndex);
            }
        }
    }

    private handlePlayerAbandonedGame() {
        this.socketClientService.on(GameEvents.PlayerAbandonedGame, () => {
            console.log('has detected player leaving in question-zone');
            this.socketClientService.send(GameEvents.RemoveSubmitOnAbandoned, {
                roomId: this.roomId,
                questionsChoices: this.chosenChoices,
                isGoodAnswer: this.isAnswerGood(),
            });
        });
    }
}
