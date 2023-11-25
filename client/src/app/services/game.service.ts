import { Injectable } from '@angular/core';
import { PointsManager } from '@app/interfaces/points-manager';
import { Choice, Question } from '@app/interfaces/quiz';
import { Constants, QTypes } from '@common/constants';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private isSubmitPressed: Subject<boolean>;
    private isTestGame: boolean;

    constructor() {
        this.isSubmitPressed = new Subject<boolean>();
    }

    get isSubmitButtonPressed(): Observable<boolean> {
        return this.isSubmitPressed.asObservable();
    }

    set setSubmitButtonPressState(isPressed: boolean) {
        this.isSubmitPressed.next(isPressed);
    }
    set setIfTestGame(isTestGame: boolean) {
        this.isTestGame = isTestGame;
    }

    isAnswerGood(playerAnswer: string | boolean[], questionType: string, goodAnswer?: Choice[]) {
        let isAnswerGood = false;
        if (questionType === QTypes.QCM) {
            const playerChoices = playerAnswer as boolean[];
            const goodChoicesAnswer = goodAnswer as Choice[];
            isAnswerGood = playerChoices.every((answer, index) => answer === goodChoicesAnswer[index].isCorrect);
        } else {
            isAnswerGood = true;
        }
        return isAnswerGood;
    }

    giveBonus(pointsManager: PointsManager, questionPoints: number): PointsManager {
        const bonus = this.isTestGame ? Constants.BONUS_120_PERCENT : Constants.BONUS_20_PERCENT;
        pointsManager.points = questionPoints * bonus;
        pointsManager.pointsToDisplay = questionPoints * Constants.BONUS_120_PERCENT;
        pointsManager.pointsMessage = '(20% bonus Woohoo!)';
        return pointsManager;
    }

    givePoints(pointsManager: PointsManager, question: Question, playerAnswer: boolean[] | string): PointsManager {
        if (this.isTestGame) {
            if (question.type === QTypes.QCM) {
                pointsManager = this.calculatePointsQCM(pointsManager, question, playerAnswer as boolean[]);
            } else {
                pointsManager = this.calculatePointsQRL(pointsManager, question, playerAnswer as string);
            }
        }

        // if (!this.hasReceivedBonus) {
        //     if (this.gameService.isAnswerGood(this.chosenChoices, this.question.type, this.question.choices)) {
        //         this.points = this.question.points;
        //         this.pointsToDisplay = this.question.points;
        //     } else {
        //         this.points = 0;
        //         this.pointsToDisplay = 0;
        //     }
        //     this.bonusMessage = '';
        //     this.socketClientService.send(GameEvents.AddPointsToPlayer, { roomId: this.roomId, points: this.points });
        // }

        return pointsManager;
    }

    calculatePointsQCM(pointsManager: PointsManager, question: Question, playerAnswer: boolean[]): PointsManager {
        const playerChoices = playerAnswer as boolean[];
        const goodChoicesAnswer = question.choices as Choice[];
        const isAnswerGood = this.isAnswerGood(playerChoices, question.type, goodChoicesAnswer);
        if (isAnswerGood) {
            pointsManager = this.giveBonus(pointsManager, question.points);
        } else {
            pointsManager = this.noPointsEarned(pointsManager);
        }
        return pointsManager;
    }

    calculatePointsQRL(pointsManager: PointsManager, question: Question, playerAnswer: string): PointsManager {
        const isAnswerGood = this.isAnswerGood(playerAnswer, question.type);
        if (isAnswerGood) {
            pointsManager.points = question.points;
            pointsManager.pointsToDisplay = question.points;
            pointsManager.pointsMessage = '(100% Bravo!)';
        } else {
            pointsManager = this.noPointsEarned(pointsManager);
        }
        return pointsManager;
    }

    private noPointsEarned(pointsManager: PointsManager): PointsManager {
        pointsManager.points = 0;
        pointsManager.pointsToDisplay = 0;
        pointsManager.pointsMessage = '';
        return pointsManager;
    }
}
