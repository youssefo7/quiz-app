import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PointsManager } from '@app/interfaces/points-manager';
import { Choice, Question } from '@app/interfaces/quiz';
import { Constants } from '@common/constants';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    const question: Question = { type: 'QRL', text: 'qrlTestQuestion', points: 100 };
    const questionQCM: Question = { type: 'QCM', text: 'qcmTestQuestion', points: 100, choices: [{ text: 'Choice 1', isCorrect: true }] };

    const goodAnswer: Choice[] = [
        { text: 'Choice 1', isCorrect: true },
        { text: 'Choice 2', isCorrect: false },
        { text: 'Choice 3', isCorrect: true },
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        }).compileComponents();
        service = TestBed.inject(GameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return an Observable<boolean> for isSubmitButtonPressed', () => {
        const getter = service.isSubmitButtonPressed;
        expect(getter).toBeDefined();
    });

    it('should set the submit button presser state to the assigned value', () => {
        const spy = spyOn(service['isSubmitPressed'], 'next');
        const testValue = true;
        service.setSubmitButtonPressState = testValue;
        expect(spy).toHaveBeenCalledWith(testValue);
    });

    it("should correctly check if the player's answer is good for QCM", () => {
        const playerAnswer = [true, false, true];
        const result = service.isAnswerGood(playerAnswer, goodAnswer);
        expect(result).toBeTrue();
    });

    it('should reset points manager correctly', () => {
        const pointsManager: PointsManager = { points: 100, pointsToDisplay: 120, pointsMessage: '(20% bonus Woohoo!)', doesDisplayPoints: true };
        const result = service.resetPointsManager(pointsManager);

        expect(result.points).toBe(0);
        expect(result.pointsToDisplay).toBe(0);
        expect(result.pointsMessage).toBe('');
    });

    it('should set points manager properties', () => {
        const points = 100;
        const pointsToDisplay = 120;
        const pointsMessage = 'Test message';
        const result = service['setPointsManager'](points, pointsToDisplay, pointsMessage);

        expect(result.points).toBe(points);
        expect(result.pointsToDisplay).toBe(pointsToDisplay);
        expect(result.pointsMessage).toBe(pointsMessage);
        expect(result.doesDisplayPoints).toBeFalse();
    });

    it('should determine the correct QRL message for 0 points', () => {
        const pointsManager: PointsManager = { points: 0, pointsToDisplay: 0, pointsMessage: '', doesDisplayPoints: false };
        const result = service['determineQRLMessage'](pointsManager, question);
        expect(result).toBe('(0% Dommage!)');
    });

    it('should determine the correct QRL message for maximum points', () => {
        const pointsManager: PointsManager = { points: 100, pointsToDisplay: 100, pointsMessage: '', doesDisplayPoints: false };
        const result = service['determineQRLMessage'](pointsManager, question);
        expect(result).toBe('(100% Bravo!)');
    });

    it('should determine the correct QRL message for other points', () => {
        const pointsManager: PointsManager = { points: 50, pointsToDisplay: 50, pointsMessage: '', doesDisplayPoints: false };
        const result = service['determineQRLMessage'](pointsManager, question);
        expect(result).toBe('(50% Pas mal!)');
    });

    it('should give the correct points and message for a test game', () => {
        service.isTestGame = true;
        const pointsManager: PointsManager = { points: 0, pointsToDisplay: 0, pointsMessage: '', doesDisplayPoints: false };
        const result = service.givePointsQRL(pointsManager, question);

        expect(result.points).toBe(question.points);
        expect(result.pointsToDisplay).toBe(question.points);
        expect(result.pointsMessage).toBe('(100% Bravo!)');
    });

    it('should give the correct points and message for a non-test game', () => {
        const pointsManager: PointsManager = { points: 0, pointsToDisplay: 0, pointsMessage: '', doesDisplayPoints: false };
        const playerPoints = 50;
        const result = service.givePointsQRL(pointsManager, question, playerPoints);

        expect(result.points).toBe(playerPoints);
        expect(result.pointsToDisplay).toBe(playerPoints);
        expect(result.pointsMessage).toBe('(50% Pas mal!)');
    });

    it('should give 20% bonus for a non-test game', () => {
        const pointsManager: PointsManager = { points: 0, pointsToDisplay: 0, pointsMessage: '', doesDisplayPoints: false };
        const questionPoints = 100;
        service.isTestGame = false;
        const result = service.giveBonus(pointsManager, questionPoints);

        expect(result.points).toBe(questionPoints * Constants.BONUS_20_PERCENT);
        expect(result.pointsToDisplay).toBe(questionPoints * Constants.BONUS_120_PERCENT);
        expect(result.pointsMessage).toBe('(20% bonus Woohoo!)');
    });

    it('should give 120% bonus for a test game', () => {
        const pointsManager: PointsManager = { points: 0, pointsToDisplay: 0, pointsMessage: '', doesDisplayPoints: false };
        const questionPoints = 100;
        service.isTestGame = true;
        const result = service.giveBonus(pointsManager, questionPoints);

        expect(result.points).toBe(questionPoints * Constants.BONUS_120_PERCENT);
        expect(result.pointsToDisplay).toBe(questionPoints * Constants.BONUS_120_PERCENT);
        expect(result.pointsMessage).toBe('(20% bonus Woohoo!)');
    });

    it('should give full points and bonus for a correct answer in a test game', () => {
        service.isTestGame = true;
        const pointsManager: PointsManager = { points: 0, pointsToDisplay: 0, pointsMessage: '', doesDisplayPoints: false };
        const playerAnswer = [true];
        const result = service.givePointsQCM(pointsManager, questionQCM, playerAnswer);

        expect(result.points).toBe(questionQCM.points * Constants.BONUS_120_PERCENT);
        expect(result.pointsToDisplay).toBe(questionQCM.points * Constants.BONUS_120_PERCENT);
        expect(result.pointsMessage).toBe('(20% bonus Woohoo!)');
    });

    it('should give no points for a wrong answer in a test game', () => {
        service.isTestGame = true;
        const pointsManager: PointsManager = { points: 0, pointsToDisplay: 0, pointsMessage: '', doesDisplayPoints: false };
        const playerAnswer = [false];
        const result = service.givePointsQCM(pointsManager, questionQCM, playerAnswer);

        expect(result.points).toBe(0);
        expect(result.pointsToDisplay).toBe(0);
        expect(result.pointsMessage).toBe('');
    });

    it('should give 0 points and no bonus for a wrong answer in a non-test game', () => {
        service.isTestGame = false;
        const pointsManager: PointsManager = { points: 0, pointsToDisplay: 0, pointsMessage: '', doesDisplayPoints: false };
        const playerAnswer = [false];
        const result = service.givePointsQCM(pointsManager, questionQCM, playerAnswer);

        expect(result.points).toBe(0);
        expect(result.pointsToDisplay).toBe(0);
        expect(result.pointsMessage).toBe('');
    });
});
