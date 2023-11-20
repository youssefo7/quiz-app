import { Injectable } from '@angular/core';
import { PointsManager } from '@app/interfaces/points-manager';
import { Choice, Question } from '@app/interfaces/quiz';
import { Constants } from '@common/constants';
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

    isAnswerGood(playerAnswer: boolean[], goodAnswer: Choice[]) {
        const isAnswerGood = playerAnswer.every((answer, index) => answer === goodAnswer[index].isCorrect);
        return isAnswerGood;
    }

    giveBonus(pointsManager: PointsManager, questionPoints: number): PointsManager {
        const bonus = this.isTestGame ? Constants.BONUS_120_PERCENT : Constants.BONUS_20_PERCENT;
        const pointsToAdd = questionPoints * bonus;
        const pointsToDisplay = questionPoints * Constants.BONUS_120_PERCENT;
        pointsManager = this.setPointsManager(pointsToAdd, pointsToDisplay, '(20% bonus Woohoo!)');
        return pointsManager;
    }

    givePointsQCM(pointsManager: PointsManager, question: Question, playerAnswer: boolean[]): PointsManager {
        const playerChoices = playerAnswer as boolean[];
        const goodChoicesAnswer = question.choices as Choice[];
        const isAnswerGood = this.isAnswerGood(playerChoices, goodChoicesAnswer);
        if (isAnswerGood) {
            pointsManager = this.isTestGame
                ? this.giveBonus(pointsManager, question.points)
                : this.setPointsManager(question.points, question.points, '');
        } else {
            pointsManager = this.noPointsEarned(pointsManager);
        }
        return pointsManager;
    }

    givePointsQRL(pointsManager: PointsManager, question: Question, playerPoints?: number): PointsManager {
        pointsManager.points = playerPoints ?? 0;
        pointsManager = this.isTestGame
            ? this.setPointsManager(question.points, question.points, '(100% Bravo!)')
            : this.setPointsManager(pointsManager.points, playerPoints as number, this.determineQRLMessage(pointsManager, question));
        return pointsManager;
    }

    resetPointsManager(pointsManager: PointsManager): PointsManager {
        pointsManager.points = 0;
        pointsManager.pointsToDisplay = 0;
        pointsManager.pointsMessage = '';
        return pointsManager;
    }

    private noPointsEarned(pointsManager: PointsManager): PointsManager {
        pointsManager = this.setPointsManager(0, 0, '');
        return pointsManager;
    }

    private determineQRLMessage(pointsManager: PointsManager, question: Question) {
        switch (pointsManager.points) {
            case 0:
                return '(0% Dommage!)';
            case question.points:
                return '(100% Bravo!)';
            default:
                return '(50% Pas mal!)';
        }
    }

    private setPointsManager(points: number, pointsToDisplay: number, pointsMessage: string): PointsManager {
        const pointsManager: PointsManager = {
            points,
            pointsToDisplay,
            pointsMessage,
            doesDisplayPoints: false,
        };
        return pointsManager;
    }
}
