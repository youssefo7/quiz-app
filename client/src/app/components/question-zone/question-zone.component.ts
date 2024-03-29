// Contient l'affichage et les événements liés à la zone de question
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
import { PlayerPoints } from '@common/player-points';
import { PlayerSubmission } from '@common/player-submission';
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
    @Input() roomId: string;
    @Input() isTestGame: boolean;
    question: Question;
    chosenChoices: boolean[];
    choiceButtonStyle: ButtonStyle[];
    isSubmitDisabled: boolean;
    isChoiceButtonDisabled: boolean;
    characterCounterDisplay: string;
    userAnswer: string;
    isTextareaDisabled: boolean;
    pointsManager: PointsManager;
    private currentQuestionIndex: number;
    private isTimerFinishedSubscription: Subscription;
    private hasSentAnswer: boolean;
    private hasReceivedBonus: boolean;
    private hasModifiedText: boolean;
    private hasInteractedOnce: boolean;
    private textDetectionTime: number;
    private socketTime: number;

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
        this.isSubmitDisabled = true;
        this.isChoiceButtonDisabled = false;
        this.hasSentAnswer = false;
        this.userAnswer = '';
        this.characterCounterDisplay = `${this.userAnswer.length} / ${Constants.MAX_TEXTAREA_LENGTH}`;
        this.isTextareaDisabled = false;
        this.hasReceivedBonus = false;
        this.hasModifiedText = false;
        this.hasInteractedOnce = false;
        this.textDetectionTime = 0;
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
        this.gameService.isTestGame = this.isTestGame;
        this.getQuestion(this.currentQuestionIndex);
        this.subscribeToTimer();
        this.handleBonusPoints();
        this.reactToQRLEvaluation();
    }

    ngOnDestroy() {
        if (!this.isTestGame) {
            this.sendUnselectChoices();
        } else {
            this.timeService.stopTimer();
            if (this.isTimerFinishedSubscription) {
                this.isTimerFinishedSubscription.unsubscribe();
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
                this.handleFieldInteraction(this.hasInteractedOnce);
            }
        }
    }

    setSubmitButtonStateOnChoices() {
        const hasSelectedChoices = this.chosenChoices.some((isChoiceSelected) => isChoiceSelected);
        this.setSubmitButtonToDisabled(!hasSelectedChoices);
    }

    submitAnswerOnClick() {
        if (this.isTestGame) {
            this.gameService.setSubmitButtonPressState = true;
            this.hasSentAnswer = true;
        } else {
            this.handleAnswerSubmission(false);
            this.isChoiceButtonDisabled = true;
        }
    }

    detectCharacterLengthOnInput() {
        this.characterCounterDisplay = `${this.userAnswer.length} / ${Constants.MAX_TEXTAREA_LENGTH}`;
        const hasTyped = this.userAnswer.trim().length > 0;
        this.setSubmitButtonToDisabled(!hasTyped);
        if (!this.isTestGame) {
            this.handleFieldInteraction(this.hasInteractedOnce);
        }
    }

    private handleFieldInteraction(hasInteractedOnce: boolean) {
        if (!hasInteractedOnce) {
            this.socketClientService.send(GameEvents.FieldInteraction, this.roomId);
            this.hasInteractedOnce = !this.hasInteractedOnce;
        }

        if (this.question.type === QTypes.QRL && !this.hasModifiedText) {
            this.textDetectionTime = this.socketTime;
            this.hasModifiedText = true;
            this.socketClientService.send(GameEvents.QRLAnswerUpdate, { roomId: this.roomId, hasModifiedText: this.hasModifiedText });
        }
    }

    private subscribeToTimer() {
        if (this.isTestGame) {
            this.isTimerFinishedSubscription = this.timeService.isTimerFinished().subscribe((isTransitionTimer: boolean) => {
                this.handleEndOfTimer(isTransitionTimer);
            });
        } else {
            this.socketClientService.on(TimeEvents.TimerInterrupted, () => {
                if (this.question.type === QTypes.QCM) {
                    const isTransitionTimer = false;
                    this.handleEndOfTimer(isTransitionTimer);
                }
            });

            this.socketClientService.on(TimeEvents.TimerFinished, (isTransitionTimer: boolean) => {
                this.handleEndOfTimer(isTransitionTimer);
            });

            this.socketClientService.on(TimeEvents.CurrentTimer, (time: number) => {
                this.socketTime = time;
                const timeDifference = this.textDetectionTime - this.socketTime;
                const isTimeToCheckUpdate = timeDifference === Constants.TEXT_CHANGE_PERIOD;
                if (this.question.type === QTypes.QRL && isTimeToCheckUpdate) {
                    this.hasModifiedText = false;
                    this.socketClientService.send(GameEvents.QRLAnswerUpdate, { roomId: this.roomId, hasModifiedText: this.hasModifiedText });
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
                this.hasModifiedText = false;
                this.textDetectionTime = 0;
                this.isTextareaDisabled = false;
                this.userAnswer = '';
                this.characterCounterDisplay = `${this.userAnswer.length} / ${Constants.MAX_TEXTAREA_LENGTH}`;
            }
            this.pointsManager.doesDisplayPoints = false;
        }
    }

    private setSubmitButtonToDisabled(isDisabled: boolean) {
        this.isSubmitDisabled = isDisabled;
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

    private givePointsRealGame() {
        if (!this.hasReceivedBonus) {
            this.pointsManager = this.gameService.givePointsQCM(this.pointsManager, this.question, this.chosenChoices);
            const pointsToAdd: PlayerPoints = {
                pointsToAdd: this.pointsManager.points,
                roomId: this.roomId,
            };
            this.socketClientService.send(GameEvents.AddPointsToPlayer, pointsToAdd);
        }
        this.showResult();
    }

    private showResult() {
        this.setSubmitButtonToDisabled(true);
        this.displayCorrectAnswer();
    }

    private handleBonusPoints() {
        if (!this.isTestGame) {
            this.socketClientService.on(GameEvents.GiveBonus, () => {
                this.hasReceivedBonus = true;
                this.pointsManager = this.gameService.giveBonus(this.pointsManager, this.question.points);
                const pointsToAdd: PlayerPoints = {
                    pointsToAdd: this.pointsManager.points,
                    roomId: this.roomId,
                };
                this.socketClientService.send(GameEvents.AddPointsToPlayer, pointsToAdd);
                this.givePointsRealGame();
            });
        }
    }

    private handleEndOfTimer(isTransitionTimer: boolean) {
        if (this.isTestGame) {
            if (isTransitionTimer) {
                ++this.currentQuestionIndex;
                this.getQuestion(this.currentQuestionIndex);
            } else {
                this.pointsManager =
                    this.question.type === QTypes.QCM
                        ? this.gameService.givePointsQCM(this.pointsManager, this.question, this.chosenChoices)
                        : this.gameService.givePointsQRL(this.pointsManager, this.question);
                this.pointsEarned.emit(this.pointsManager.points);
                this.showResult();
                this.isTextareaDisabled = true;
            }
        } else {
            if (!isTransitionTimer) {
                if (!this.hasSentAnswer) {
                    this.handleAnswerSubmission(true);
                }
                if (this.question.type === QTypes.QCM) {
                    this.givePointsRealGame();
                }
            } else {
                this.hasReceivedBonus = false;
                this.hasInteractedOnce = false;
                this.pointsManager = this.gameService.resetPointsManager(this.pointsManager);
                ++this.currentQuestionIndex;
                this.getQuestion(this.currentQuestionIndex);
                this.hasSentAnswer = false;
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
        this.setSubmitButtonToDisabled(true);
        this.hasSentAnswer = true;

        if (this.question.type === QTypes.QRL) {
            this.isTextareaDisabled = true;
            const qrlSubmission: PlayerSubmission = {
                roomId: this.roomId,
                answer: this.userAnswer.trim(),
                hasSubmittedBeforeEnd: !isTimerFinished,
                questionType: QTypes.QRL,
            };
            this.socketClientService.send(GameEvents.SubmitAnswer, qrlSubmission);
        } else {
            const isAnswerGood = this.gameService.isAnswerGood(this.chosenChoices, this.question.choices as Choice[]);
            const qcmSubmission: PlayerSubmission = {
                roomId: this.roomId,
                hasSubmittedBeforeEnd: !isTimerFinished,
                questionType: QTypes.QCM,
            };

            this.socketClientService.send(GameEvents.SubmitAnswer, qcmSubmission);

            if (isAnswerGood) {
                this.socketClientService.send(GameEvents.GoodAnswer, qcmSubmission);
            }
        }
    }

    private reactToQRLEvaluation() {
        if (!this.isTestGame) {
            this.socketClientService.on(GameEvents.AddPointsToPlayer, (pointsOfPlayer: PlayerPoints) => {
                if (this.question.type === QTypes.QRL) {
                    this.pointsManager = this.gameService.givePointsQRL(this.pointsManager, this.question, pointsOfPlayer.pointsToAdd);
                    this.showResult();
                }
            });
        }
    }
}
