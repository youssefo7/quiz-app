// TODO: Revoir si on peut diminuer le nombre de ligne
/* eslint-disable max-lines */
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Choice, Question, Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { Constants, QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-question-zone',
    templateUrl: './question-zone.component.html',
    styleUrls: ['./question-zone.component.scss'],
})
export class QuestionZoneComponent implements OnInit, OnDestroy {
    @Output() pointsEarned: EventEmitter<number>;
    @Input() quiz: Quiz;
    @Input() roomId: string | null;
    question: Question;
    chosenChoices: boolean[];
    choiceButtonStyle: { backgroundColor: string }[];
    submitButtonStyle: { backgroundColor: string };
    pointsMessage: string;
    isSubmitDisabled: boolean;
    isChoiceButtonDisabled: boolean;
    doesDisplayPoints: boolean;
    pointsToDisplay: number;
    characterCounterDisplay: string;
    userAnswer: string;
    isTextareaDisabled: boolean;
    private points: number;
    private isQuestionTransitioning: boolean;
    private currentQuestionIndex: number;
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
        this.userAnswer = '';
        this.characterCounterDisplay = `${this.userAnswer.length} / ${Constants.MAX_TEXTAREA_LENGTH}`;
        this.isTextareaDisabled = false;
    }

    @HostListener('keypress', ['$event'])
    preventDefaultEnter(event: KeyboardEvent) {
        if (event.key === 'Enter' && this.question.type === QTypes.QCM) {
            event.preventDefault();
        }
    }

    @HostListener('keyup', ['$event'])
    handleKeyboardInput(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            if (!this.isSubmitDisabled && this.question.type === QTypes.QCM) {
                this.submitAnswerOnClick();
            }
        } else if (this.question.type === QTypes.QCM) {
            const choiceIndex = parseInt(event.key, 10) - 1;
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
    }

    ngOnDestroy() {
        if (!this.isTestGame) {
            this.sendUnselectChoices();
        } else {
            this.timeService.stopTimer();
            if (this.timerSubscription) this.timerSubscription.unsubscribe();
            if (this.gameServiceSubscription) this.gameServiceSubscription.unsubscribe();
        }
    }

    stopPropagation(event: Event) {
        if (this.question.type === QTypes.QCM) {
            event.stopPropagation();
        }
    }

    focusOnButtons() {
        if (this.question.type === QTypes.QCM) {
            this.elementRef.nativeElement.querySelector('button').focus();
        }
    }

    toggleChoice(index: number) {
        const isIndexInbound = index >= 0 && index < this.chosenChoices.length;
        if (!isNaN(index) && isIndexInbound) {
            this.chosenChoices[index] = !this.chosenChoices[index];
            const isIndexSelected = this.chosenChoices[index];
            if (!this.isTestGame) {
                this.socketClientService.send(GameEvents.ToggleSelect, {
                    roomId: this.roomId,
                    questionChoiceIndex: index,
                    isSelect: isIndexSelected,
                });
            }
        }
    }

    setSubmitButtonStateOnChoices() {
        const hasSelectedChoices = this.chosenChoices.some((isChoiceSelected) => isChoiceSelected);
        this.setSubmitButtonToDisabled(!hasSelectedChoices, { backgroundColor: hasSelectedChoices ? 'green' : 'grey' });
    }

    submitAnswerOnClick() {
        if (this.isTestGame) {
            this.gameService.setButtonPressState = true;
            this.givePoints();
            this.isQuestionTransitioning = true;
        } else {
            this.handleAnswerSubmission(false);
            this.isChoiceButtonDisabled = true;
        }
        this.isTextareaDisabled = true;
    }

    detectCharacterLengthOnInput() {
        this.characterCounterDisplay = `${this.userAnswer.length} / ${Constants.MAX_TEXTAREA_LENGTH}`;
        const hasTyped = this.userAnswer.trim().length > 0;
        this.setSubmitButtonToDisabled(!hasTyped, { backgroundColor: hasTyped ? 'green' : 'grey' });
    }

    private subscribeToTimer() {
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

    private detectEndGame() {
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

    private getQuestion(index: number) {
        const isValidIndex = this.quiz && index < this.quiz.questions.length;
        if (isValidIndex) {
            this.question = this.quiz.questions[index];
            if (this.question.type === QTypes.QCM) {
                const choices = this.question.choices as Choice[];
                this.chosenChoices = new Array(choices.length).fill(false);
                choices.forEach((choice, buttonIndex) => {
                    this.setButtonToInitState(buttonIndex);
                });
            } else {
                this.isTextareaDisabled = false;
                this.userAnswer = '';
            }
            this.doesDisplayPoints = false;
        }
    }

    private setSubmitButtonToDisabled(isDisabled: boolean, backgroundColor: { backgroundColor: string }) {
        this.isSubmitDisabled = isDisabled;
        this.submitButtonStyle = backgroundColor;
    }

    private setButtonToInitState(index: number) {
        this.choiceButtonStyle[index] = { backgroundColor: '' };
        this.isChoiceButtonDisabled = false;
        this.submitButtonStyle = { backgroundColor: '' };
    }

    private setButtonStateOnSubmit(index: number) {
        const choices = this.question.choices;
        if (choices) {
            this.choiceButtonStyle[index] = {
                backgroundColor: choices[index].isCorrect ? 'rgb(97, 207, 72)' : 'red',
            };
            this.isChoiceButtonDisabled = true;
        }
    }

    private isAnswerGood() {
        let isAnswerGood = false;
        const choices = this.question.choices;

        if (this.isTestGame && this.question.type === QTypes.QRL) {
            isAnswerGood = true;
        }

        if (choices && this.chosenChoices) {
            isAnswerGood = this.chosenChoices.every((answer, index) => answer === choices[index].isCorrect);
        }
        return isAnswerGood;
    }

    private displayCorrectAnswer() {
        const choices = this.question.choices;
        if (choices) {
            choices.forEach((choice, index) => {
                this.setButtonStateOnSubmit(index);
            });
        }
        this.doesDisplayPoints = true;
    }

    private giveBonus() {
        const bonus = this.isTestGame ? Constants.BONUS_120_PERCENT : Constants.BONUS_20_PERCENT;
        this.pointsToDisplay = this.question.points * Constants.BONUS_120_PERCENT;
        this.points = this.question.points * bonus;
        this.pointsMessage = '(20% bonus Woohoo!)';
    }

    private givePoints() {
        if (this.isTestGame) {
            if (this.isAnswerGood()) {
                if (this.question.type === QTypes.QCM) {
                    this.giveBonus();
                } else {
                    this.points = this.question.points;
                    this.pointsToDisplay = this.question.points;
                    this.pointsMessage = '(100% Bravo!)';
                }
            } else {
                this.points = 0;
                this.pointsMessage = '';
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
                this.pointsMessage = '';
                this.socketClientService.send(GameEvents.AddPointsToPlayer, { roomId: this.roomId, points: this.points });
            }
        }
        this.showResult();
    }

    private showResult() {
        this.setSubmitButtonToDisabled(true, { backgroundColor: 'grey' });
        this.displayCorrectAnswer();
    }

    private handleTransitionClockFinished() {
        if (!this.isTestGame) {
            this.socketClientService.on(TimeEvents.TransitionClockFinished, () => {
                this.isQuestionTransitioning = false;
                this.hasReceivedBonus = false;
                ++this.currentQuestionIndex;
                this.getQuestion(this.currentQuestionIndex);
                this.hasSentAnswer = false;
            });
        }
    }

    private handleBonusPoints() {
        if (!this.isTestGame) {
            this.socketClientService.on(GameEvents.GiveBonus, () => {
                this.hasReceivedBonus = true;
                this.giveBonus();
                this.givePoints();
                this.socketClientService.send(GameEvents.AddPointsToPlayer, { roomId: this.roomId, points: this.points });
            });
        }
    }

    private detectEndOfQuestion(time: number) {
        if (!this.hasGameEnded && time === 0) {
            if (!this.isQuestionTransitioning) {
                if (!this.hasSentAnswer && !this.isTestGame) {
                    this.handleAnswerSubmission(true);
                }
                this.isQuestionTransitioning = true;
                this.isTextareaDisabled = true;
                this.givePoints();
            } else if (this.isTestGame) {
                this.isQuestionTransitioning = false;
                ++this.currentQuestionIndex;
                this.getQuestion(this.currentQuestionIndex);
            }
        }
    }

    private sendUnselectChoices() {
        if (this.chosenChoices) {
            const choicesToUnselect = this.chosenChoices.map((isSelected, index) => (isSelected ? index : null)).filter((index) => index !== null);
            if (choicesToUnselect.length > 0) {
                this.socketClientService.send(GameEvents.QuestionChoicesUnselect, { roomId: this.roomId, questionChoiceIndexes: choicesToUnselect });
                if (this.hasSentAnswer) {
                    this.socketClientService.send(GameEvents.RemoveAnswerTime, {
                        roomId: this.roomId,
                        userIdToRemove: this.socketClientService.socket.id,
                    });
                }
            }
        }
    }

    private handleAnswerSubmission(isTimerFinished: boolean) {
        this.setSubmitButtonToDisabled(true, { backgroundColor: 'grey' });
        if (!isTimerFinished) {
            this.socketClientService.send(GameEvents.SubmitAnswer, this.roomId);
        }
        this.hasSentAnswer = true;

        if (this.isAnswerGood()) {
            this.points = this.question.points;
            this.socketClientService.send(GameEvents.GoodAnswer, { roomId: this.roomId, isTimerFinished });
        } else {
            this.socketClientService.send(GameEvents.BadAnswer, { roomId: this.roomId, isTimerFinished });
        }
    }
}
