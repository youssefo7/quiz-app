// Nous avons besoin du any pour tester les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Question } from '@app/interfaces/quiz';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { Chart } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { Socket } from 'socket.io-client';
import { HistogramComponent } from './histogram.component';

class MockSocketClientService extends SocketClientService {
    override connect() {
        // vide
    }
    override socketExists() {
        return true;
    }
}

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;
    let socketClientServiceMock: MockSocketClientService;
    let socketHelper: SocketTestHelper;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;

    const mockedQuestions: Question[] = [
        {
            type: 'QCM',
            text: 'Q1',
            points: 10,
            choices: [
                { text: 'C1', isCorrect: true },
                { text: 'C2', isCorrect: false },
            ],
        },
        {
            type: 'QCM',
            text: 'Q2',
            points: 10,
            choices: [
                { text: 'C1', isCorrect: false },
                { text: 'C2', isCorrect: true },
                { text: 'C3', isCorrect: false },
            ],
        },
    ];

    beforeEach(() => {
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists']);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers']);
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new MockSocketClientService();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [HistogramComponent],
            imports: [NgChartsModule, HttpClientTestingModule],
            providers: [
                { provide: SocketClientService, useValue: socketClientServiceMock },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
        component.questions = mockedQuestions;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load chart and listen to socket events when created', fakeAsync(() => {
        const loadChartSpy = spyOn<any>(component, 'loadChart');
        const updateSelectionsSpy = spyOn<any>(component, 'updateSelections');
        const reactToTransitionClockFinishedEventSpy = spyOn<any>(component, 'reactToTimerEvents');
        component.isResultsPage = false;
        component.ngOnInit();
        tick();

        expect(loadChartSpy).toHaveBeenCalled();
        expect(updateSelectionsSpy).toHaveBeenCalled();
        expect(reactToTransitionClockFinishedEventSpy).toHaveBeenCalled();
    }));

    it('should update chart information when getting a question', () => {
        const expectedPlayersChoices = ['Choix 1', 'Choix 2'];
        const expectedInteractionsCount = [0, 0];
        const expectedChartBorderColors = ['black', 'black'];
        const setBackgroundColorsSpy = spyOn<any>(component, 'setBackgroundColors');
        component['histogramInfo'].playersChoices = [];
        component['histogramInfo'].interactionsCount = [];
        component['histogramInfo'].chartBorderColors = [];
        component['getQuestion'](0);

        expect(component['histogramInfo'].playersChoices).toEqual(expectedPlayersChoices);
        expect(component['histogramInfo'].interactionsCount).toEqual(expectedInteractionsCount);
        expect(component['histogramInfo'].chartBorderColors).toEqual(expectedChartBorderColors);
        expect(setBackgroundColorsSpy).toHaveBeenCalledTimes(2);
    });

    it('should set background colors and update goodBadChoices accordingly based on the correctness of answer choices', () => {
        component.currentQuestion = mockedQuestions[1];
        const expectedBackgroundColors = ['red', 'green', 'red'];
        const expectedGoodBadChoices = [false, true, false];
        component['histogramInfo'].chartBackgroundColors = [];
        component['goodBadChoices'] = [];

        component['setBackgroundColors'](0);
        component['setBackgroundColors'](1);
        component['setBackgroundColors'](2);
        expect(component['histogramInfo'].chartBackgroundColors).toEqual(expectedBackgroundColors);
        expect(component['goodBadChoices']).toEqual(expectedGoodBadChoices);
    });

    it('should prepare next question when the transition timer is finished', fakeAsync(() => {
        const questionIndex = 0;
        const isTransitionTimer = true;
        component['currentQuestionIndex'] = questionIndex;
        const resetArraysSpy = spyOn<any>(component, 'resetArrays');
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        const updateChartConfigSpy = spyOn<any>(component, 'updateChartConfig');

        socketHelper.peerSideEmit(TimeEvents.TimerFinished, isTransitionTimer);
        tick();

        expect(component['currentQuestionIndex']).toEqual(questionIndex + 1);
        expect(resetArraysSpy).toHaveBeenCalled();
        expect(getQuestionSpy).toHaveBeenCalledWith(questionIndex + 1);
        expect(updateChartConfigSpy).toHaveBeenCalled();
    }));

    it('should reset all arrays implicated in the question process', () => {
        component['histogramInfo'].playersChoices = ['Choix 1', 'Choix 2'];
        component['histogramInfo'].interactionsCount = [2, 2];
        component['histogramInfo'].chartBorderColors = ['black', 'black'];
        component['histogramInfo'].chartBackgroundColors = ['red', 'green'];
        component['goodBadChoices'] = [false, true];

        component['resetArrays']();
        expect(component['histogramInfo'].playersChoices).toEqual([]);
        expect(component['histogramInfo'].interactionsCount).toEqual([]);
        expect(component['histogramInfo'].chartBorderColors).toEqual([]);
        expect(component['histogramInfo'].chartBackgroundColors).toEqual([]);
        expect(component['goodBadChoices']).toEqual([]);
    });

    it('should update selections data based on QuestionChoiceUnselect and QuestionChoiceSelect events', () => {
        component['histogramInfo'].interactionsCount = [0, 0];
        const updateSpy = spyOn(component.chart as Chart, 'update');

        socketHelper.peerSideEmit(GameEvents.QuestionChoiceSelect, 0);
        socketHelper.peerSideEmit(GameEvents.QuestionChoiceSelect, 0);
        expect(component['histogramInfo'].interactionsCount[0]).toEqual(2);
        expect(updateSpy).toHaveBeenCalled();

        socketHelper.peerSideEmit(GameEvents.QuestionChoiceUnselect, 0);
        expect(component['histogramInfo'].interactionsCount[0]).toEqual(1);
        expect(updateSpy).toHaveBeenCalled();
    });

    it('should create player answers chart', fakeAsync(() => {
        // On a besoin de détruire le chart pour lui en assigner un nouveau
        component.ngOnDestroy();
        component.currentQuestion = mockedQuestions[0];
        component['currentQuestionIndex'] = 0;
        component['loadChart']();
        tick();

        const chartData = (component.chart as Chart).data;
        const chartDataset = chartData.datasets[0];

        expect(chartData.labels).toEqual(component['histogramInfo'].playersChoices);
        expect(chartDataset.data).toEqual(component['histogramInfo'].interactionsCount);
        expect(chartDataset.backgroundColor).toEqual(component['histogramInfo'].chartBackgroundColors);
        expect(chartDataset.borderColor).toEqual(component['histogramInfo'].chartBorderColors);
    }));

    it('should update the chart configuration', () => {
        const playersChoices = ['Choix 1', 'Choix 2'];
        const interactionsCount = [2, 2];
        const chartBorderColors = ['black', 'black'];
        const chartBackgroundColors = ['red', 'green'];
        component['histogramInfo'].playersChoices = playersChoices;
        component['histogramInfo'].interactionsCount = interactionsCount;
        component['histogramInfo'].chartBorderColors = chartBorderColors;
        component['histogramInfo'].chartBackgroundColors = chartBackgroundColors;

        const chartDataset = (component.chart as Chart).data.datasets[0];
        component['updateChartConfig']();
        expect((component.chart as Chart).data.labels).toEqual(playersChoices);
        expect(chartDataset.data).toEqual(interactionsCount);
        expect(chartDataset.backgroundColor).toEqual(chartBackgroundColors);
        expect(chartDataset.borderColor).toEqual(chartBorderColors);
    });
});
