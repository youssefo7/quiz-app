// any est nécessaire pour espionner les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GradeValues } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { PlayerSubmission } from '@common/player-submission';
import { Socket } from 'socket.io-client';
import { EvaluationZoneComponent } from './evaluation-zone.component';

class MockSocketClientService extends SocketClientService {
    override connect() {
        // vide
    }

    override socketExists() {
        return true;
    }
}

describe('EvaluationZoneComponent', () => {
    let component: EvaluationZoneComponent;
    let fixture: ComponentFixture<EvaluationZoneComponent>;
    let clientSocketServiceMock: MockSocketClientService;
    let chartDataManagerServiceMock: jasmine.SpyObj<ChartDataManagerService>;
    let socketHelper: SocketTestHelper;

    const mockedAnswers: PlayerSubmission[] = [
        { name: 'test1', answer: 'answer1', hasSubmittedBeforeEnd: true },
        { name: 'test2', answer: 'answer2', hasSubmittedBeforeEnd: true },
        { name: 'test3', answer: 'answer3', hasSubmittedBeforeEnd: true },
    ];

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'send']);
        chartDataManagerServiceMock = jasmine.createSpyObj('ChartDataManagerService', ['saveChartData']);
    });

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        clientSocketServiceMock = new MockSocketClientService();
        clientSocketServiceMock.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [EvaluationZoneComponent],
            providers: [
                { provide: SocketClientService, useValue: clientSocketServiceMock },
                { provide: ChartDataManagerService, useValue: chartDataManagerServiceMock },
            ],
        });
        fixture = TestBed.createComponent(EvaluationZoneComponent);
        component = fixture.componentInstance;
        component.answers = mockedAnswers;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call reactToAllPlayersSubmittedEvent() on initialization', () => {
        const reactPlayersSubmittedSpy = spyOn<any>(component, 'reactToAllPlayersSubmittedEvent');
        component.ngOnInit();
        expect(reactPlayersSubmittedSpy).toHaveBeenCalled();
    });

    it('should correctly set the grade button state depending on the grade value', () => {
        const setGradeButtonSpy = spyOn<any>(component, 'setGradeButtonState');
        component.setGrade(GradeValues.WrongAnswer);
        expect(setGradeButtonSpy).toHaveBeenCalledWith(true, false, false);

        component.setGrade(GradeValues.PartiallyGoodAnswer);
        expect(setGradeButtonSpy).toHaveBeenCalledWith(false, true, false);

        component.setGrade(GradeValues.GoodAnswer);
        expect(setGradeButtonSpy).toHaveBeenCalledWith(false, false, true);
    });

    it('should add to playersPoints with the correct properties when givePoints() is called for a good answer', () => {
        component['grade'] = GradeValues.GoodAnswer;
        component.currentAnswerIndex = 0;
        component.givePoints();
        expect(component['playersPoints'][0]).toEqual({
            name: 'test1',
            pointsToAdd: component['grade'] * component.questionPoints,
            roomId: component.roomId,
            grade: GradeValues.GoodAnswer,
        });
        expect(component.currentAnswerIndex).toBe(1);
    });

    it('should add to playersPoints with the correct properties when givePoints() is called for a partially good answer', () => {
        component['grade'] = GradeValues.PartiallyGoodAnswer;
        component.currentAnswerIndex = 1;
        component.givePoints();
        expect(component['playersPoints'][0]).toEqual({
            name: 'test2',
            pointsToAdd: component['grade'] * component.questionPoints,
            roomId: component.roomId,
            grade: GradeValues.PartiallyGoodAnswer,
        });
        expect(component.currentAnswerIndex).toBe(2);
    });

    it('should not add to playersPoints when givePoints() is called for player with points and a wrong answer', () => {
        const playersPointsBefore = component['playersPoints'];
        component['grade'] = GradeValues.WrongAnswer;
        component.currentAnswerIndex = 1;
        component.givePoints();
        expect(component['playersPoints']).toEqual(playersPointsBefore);
    });

    it('should not add to playersPoints when givePoints() is called for player with no points and a wrong answer', () => {
        component['grade'] = GradeValues.WrongAnswer;
        component.currentAnswerIndex = 2;
        component.givePoints();
        expect(component['playersPoints']).toEqual([]);
    });

    it('should send AddPointsToPlayer event and call the correct methods when the current answer index is on the last answer', () => {
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const savePointsSpy = spyOn<any>(component, 'savePointsStatistics');
        const resetEvaluationSpy = spyOn<any>(component, 'resetEvaluationZone');
        const enableButtonSpy = spyOn(component.enableNextQuestionButton, 'emit');
        component.currentAnswerIndex = component.answers.length - 1;
        component.givePoints();

        expect(sendSpy).toHaveBeenCalled();
        expect(savePointsSpy).toHaveBeenCalled();
        expect(resetEvaluationSpy).toHaveBeenCalled();
        expect(enableButtonSpy).toHaveBeenCalled();
    });

    it('should call the correct methods and increase the current answer index when it is not the last answer', () => {
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const resetButtonSpy = spyOn<any>(component, 'resetButtons');
        component.currentAnswerIndex = 0;
        component.givePoints();

        expect(sendSpy).not.toHaveBeenCalled();
        expect(resetButtonSpy).toHaveBeenCalled();
        expect(component.currentAnswerIndex).toBeGreaterThan(0);
    });

    it('should reset the evaluation zone', () => {
        component['resetEvaluationZone']();
        expect(component.isEvaluationFinished).toBeTruthy();
        expect(component.answers).toEqual([]);
        expect(component.currentAnswerIndex).toEqual(0);
        expect(component['playersPoints']).toEqual([]);
    });

    it('should listen on AllPlayersSubmitted event and react correctly when the event is received', () => {
        const resetButtonSpy = spyOn<any>(component, 'resetButtons');
        socketHelper.peerSideEmit(GameEvents.AllPlayersSubmitted, mockedAnswers);
        component['reactToAllPlayersSubmittedEvent']();
        expect(resetButtonSpy).toHaveBeenCalled();
        expect(component.isEvaluationFinished).toBeFalsy();
        expect(component.answers[0].name).toBe('test1');
        expect(component.answers[1].name).toBe('test2');
        expect(component.answers[2].name).toBe('test3');
    });

    it('should set grade button state with the correct configuration depending on the amount of points given', () => {
        component['setGradeButtonState'](true, false, false);
        expect(component.gradeButtonState.isZeroPointsGiven).toBeTruthy();
        expect(component.gradeButtonState.isHalfPointsGiven).toBeFalsy();
        expect(component.gradeButtonState.isTotalPointsGiven).toBeFalsy();

        component['setGradeButtonState'](false, true, false);
        expect(component.gradeButtonState.isHalfPointsGiven).toBeTruthy();
        expect(component.gradeButtonState.isZeroPointsGiven).toBeFalsy();
        expect(component.gradeButtonState.isTotalPointsGiven).toBeFalsy();

        component['setGradeButtonState'](false, false, true);
        expect(component.gradeButtonState.isZeroPointsGiven).toBeFalsy();
        expect(component.gradeButtonState.isHalfPointsGiven).toBeFalsy();
        expect(component.gradeButtonState.isTotalPointsGiven).toBeTruthy();
    });

    it('should save the points statistics', () => {
        component.questionIndex = 1;
        component['playersPoints'] = [
            { name: 'Player1', pointsToAdd: 10, roomId: 'room1', grade: GradeValues.GoodAnswer },
            { name: 'Player2', pointsToAdd: 5, roomId: 'room1', grade: GradeValues.PartiallyGoodAnswer },
            { name: 'Player3', pointsToAdd: 0, roomId: 'room1', grade: GradeValues.WrongAnswer },
        ];

        component['savePointsStatistics']();

        expect(chartDataManagerServiceMock.saveChartData).toHaveBeenCalledWith(['0', '50', '100'], [1, 1, 1], 1);
    });

    it('should reset buttons with the correct configurations', () => {
        const initialGradeButtonState = {
            isZeroPointsGiven: false,
            isHalfPointsGiven: false,
            isTotalPointsGiven: false,
        };
        component['resetButtons']();
        expect(component.gradeButtonState).toEqual(initialGradeButtonState);
        expect(component.isSubmitEvaluationDisabled).toBeTruthy();
    });
});
