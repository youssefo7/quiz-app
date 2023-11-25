// TODO: Revoir si on peut diminuer le nombre de ligne
/* eslint-disable max-lines */
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ButtonStyle } from '@app/interfaces/button-style';
import { PointsManager } from '@app/interfaces/points-manager';
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
    @Input() isTestGame: boolean;
    question: Question;
    chosenChoices: boolean[];
    choiceButtonStyle: ButtonStyle[];
    submitButtonStyle: ButtonStyle;
    isSubmitDisabled: boolean;
    isChoiceButtonDisabled: boolean;
    characterCounterDisplay: string;
    userAnswer: string;
    isTextareaDisabled: boolean;
    pointsManager: PointsManager;
    private currentQuestionIndex: number;
    private isTimerFinishedSubscription: Subscription;
    private gameServiceSubscription: Subscription;
    private hasSentAnswer: boolean;

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private gameService: GameService,
        private readonly elementRef: ElementRef,
        private readonly timeService: TimeService,
        private socketClientService: SocketClientService,
    ) {
        this.pointsEarned = new EventEmitter<number>();
        this.currentQuestionIndex = 0;
        this.pointsManager = { points: 0, pointsToDisplay: 0, pointsMessage: '', doesDisplayPoints: false };
        this.choiceButtonStyle = [{ backgroundColor: '' }];
        this.submitButtonStyle = { backgroundColor: '' };
        this.isSubmitDisabled = true;
        this.isChoiceButtonDisabled = false;
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
        this.gameService.setIfTestGame = this.isTestGame;
        this.getQuestion(this.currentQuestionIndex);
        this.subscribeToTimer();
        this.handleTransitionClockFinished();
        this.handleBonusPoints();
    }

    ngOnDestroy() {
        if (!this.isTestGame) {
            this.sendUnselectChoices();
        } else {
            this.timeService.stopTimer();
            if (this.isTimerFinishedSubscription) {
                this.isTimerFinishedSubscription.unsubscribe();
            }
            if (this.gameServiceSubscription) {
                this.gameServiceSubscription.unsubscribe();
            }
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
        this.setSubmitButtonToDisable(!hasSelectedChoices);
    }

    submitAnswerOnClick() {
        if (this.isTestGame) {
            this.gameService.setSubmitButtonPressState = true;
            this.hasSentAnswer = true;
        } else {
            this.handleAnswerSubmission(false);
            this.isChoiceButtonDisabled = true;
        }
        this.isTextareaDisabled = true;
    }

    detectCharacterLengthOnInput() {
        this.characterCounterDisplay = `${this.userAnswer.length} / ${Constants.MAX_TEXTAREA_LENGTH}`;
        const hasTyped = this.userAnswer.trim().length > 0;
        this.setSubmitButtonToDisable(!hasTyped);
    }

    private subscribeToTimer() {
        if (this.isTestGame) {
            this.isTimerFinishedSubscription = this.timeService.isTimerFinished().subscribe((isTransitionTimer: boolean) => {
                this.handleEndOfTimer(isTransitionTimer);
            });
        } else {
            this.socketClientService.on(TimeEvents.TimerFinished, (isTransitionTimer: boolean) => {
                this.handleEndOfTimer(isTransitionTimer);
            });

            this.socketClientService.on(TimeEvents.TimerInterrupted, () => {
                if (this.question.type === QTypes.QCM) {
                    const isTransitionTimer = false;
                    this.handleEndOfTimer(isTransitionTimer);
                }
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
            this.pointsManager.doesDisplayPoints = false;
        }
    }

    private setSubmitButtonToDisable(isDisabled: boolean) {
        const buttonStyle: ButtonStyle = { backgroundColor: isDisabled ? '' : 'green' };
        this.isSubmitDisabled = isDisabled;
        this.submitButtonStyle = buttonStyle;
    }

    private setButtonToInitState(index: number) {
        const buttonStyle: ButtonStyle = { backgroundColor: '' };
        this.choiceButtonStyle[index] = buttonStyle;
        this.isChoiceButtonDisabled = false;
    }

    private setButtonStateOnSubmit(index: number) {
        const choices = this.question.choices;
        if (choices) {
            const buttonStyle: ButtonStyle = { backgroundColor: choices[index].isCorrect ? 'rgb(97, 207, 72)' : 'red' };
            this.choiceButtonStyle[index] = buttonStyle;
            this.isChoiceButtonDisabled = true;
        }
    }

    private displayCorrectAnswer() {
        const choices = this.question.choices;
        if (choices) {
            choices.forEach((choice, index) => {
                this.setButtonStateOnSubmit(index);
            });
        }
        this.pointsManager.doesDisplayPoints = true;
    }

    // private givePoints() {
    //     const isAnswerGood = this.gameService.isAnswerGood(this.chosenChoices, this.question.type, this.question.choices);
    //         if (!this.hasReceivedBonus) {
    //             if (isAnswerGood) {
    //                 this.points = this.question.points;
    //                 this.pointsToDisplay = this.question.points;
    //             } else {
    //                 this.points = 0;
    //                 this.pointsToDisplay = 0;
    //             }
    //             this.bonusMessage = '';
    //             this.socketClientService.send(GameEvents.AddPointsToPlayer, { roomId: this.roomId, points: this.points });
    //         }
    //     }
    //     this.showResult();
    // }

    private showResult() {
        this.setSubmitButtonToDisable(true);
        this.displayCorrectAnswer();
    }

    private handleTransitionClockFinished() {
        if (!this.isTestGame) {
            this.socketClientService.on(TimeEvents.TimerFinished, (isTransitionTimer: boolean) => {
                if (isTransitionTimer) {
                    // this.hasReceivedBonus = false;
                    ++this.currentQuestionIndex;
                    this.getQuestion(this.currentQuestionIndex);
                    this.hasSentAnswer = false;
                }
            });
        }
    }

    private handleBonusPoints() {
        if (!this.isTestGame) {
            this.socketClientService.on(GameEvents.GiveBonus, () => {
                // this.hasReceivedBonus = true;
                this.pointsManager = this.gameService.giveBonus(this.pointsManager, this.question.points);
                this.pointsManager = this.gameService.givePoints(this.pointsManager, this.question, this.chosenChoices);
                this.socketClientService.send(GameEvents.AddPointsToPlayer, { roomId: this.roomId, points: this.pointsManager.points });
            });
        }
    }

    private handleEndOfTimer(isTransitionTimer: boolean) {
        if (this.isTestGame) {
            if (isTransitionTimer) {
                ++this.currentQuestionIndex;
                this.getQuestion(this.currentQuestionIndex);
            } else {
                this.pointsManager = this.gameService.givePoints(this.pointsManager, this.question, this.chosenChoices);
                this.pointsEarned.emit(this.pointsManager.points);
                this.showResult();
                this.isTextareaDisabled = true;
            }
        } else {
            if (!isTransitionTimer && !this.hasSentAnswer) {
                this.handleAnswerSubmission(true);
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
        this.setSubmitButtonToDisable(true);
        this.hasSentAnswer = true;

        if (this.question.type === QTypes.QRL) {
            this.isTextareaDisabled = true;
            this.socketClientService.send(GameEvents.SubmitQRL, { roomId: this.roomId, answer: this.userAnswer.trim() });
        } else {
            const isAnswerGood = this.gameService.isAnswerGood(this.chosenChoices, this.question.type, this.question.choices);
            if (!isTimerFinished) {
                this.socketClientService.send(GameEvents.SubmitAnswer, this.roomId);
            }
            if (isAnswerGood) {
                this.pointsManager.points = this.question.points;
                this.socketClientService.send(GameEvents.GoodAnswer, { roomId: this.roomId, isTimerFinished });
            } else {
                this.socketClientService.send(GameEvents.BadAnswer, { roomId: this.roomId, isTimerFinished });
            }
        }
    }
}
