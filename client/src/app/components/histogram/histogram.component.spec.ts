// Raison: Tests necessaire dépassent la limite
/* eslint-disable max-lines */
// Nous avons besoin d'assigner des arrays avec plusieurs valeurs pour les informations d'un chart
/* eslint-disable @typescript-eslint/no-magic-numbers */
// Nous avons besoin du any pour tester les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { HistogramInfo } from '@app/interfaces/histogram-info';
import { Question } from '@app/interfaces/quiz';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { QuestionChartData } from '@common/question-chart-data';
import { TimeEvents } from '@common/time.events';
import { Chart } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { HistogramComponent } from './histogram.component';

class MockSocketClientService extends SocketClientService {
    private mockSocketExists = true;

    override connect() {
        // vide
    }
    override socketExists() {
        return this.mockSocketExists;
    }

    setSocketExists(value: boolean) {
        this.mockSocketExists = value;
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
        {
            type: 'QRL',
            text: 'Q3',
            points: 100,
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
        socketClientServiceMock.setSocketExists(true);
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load chart and listen to socket events when created', fakeAsync(() => {
        component.isResultsPage = false;
        const loadChartSpy = spyOn<any>(component, 'loadChart');
        const updateSelectionsSpy = spyOn<any>(component, 'updateSelections');
        const reactToTransitionClockFinishedEventSpy = spyOn<any>(component, 'reactToTimerEvents');
        const reactToChartEventsSpy = spyOn<any>(component, 'reactToChartEvents');

        component.ngOnInit();
        tick();

        expect(loadChartSpy).toHaveBeenCalled();
        expect(updateSelectionsSpy).toHaveBeenCalled();
        expect(reactToTransitionClockFinishedEventSpy).toHaveBeenCalled();
        expect(reactToChartEventsSpy).toHaveBeenCalled();
    }));

    it('should not call functions when initializing component without an existing socket', fakeAsync(() => {
        socketClientServiceMock.setSocketExists(false);
        spyOn<any>(component, 'loadChart');

        component.ngOnInit();
        tick();

        expect(component['loadChart']).not.toHaveBeenCalled();
    }));

    it('should update chart information when getting a question', fakeAsync(() => {
        const expectedPlayersChoices = ['Choix 1', 'Choix 2'];
        const expectedInteractionsCount = [0, 0];
        const expectedChartBorderColors = ['black', 'black'];
        const setBackgroundColorsSpy = spyOn<any>(component, 'setBackgroundColors');
        component['histogramInfo'].playersChoices = [];
        component['histogramInfo'].interactionsCount = [];
        component['histogramInfo'].chartBorderColors = [];
        component['getQuestion'](0);
        tick();

        expect(component['histogramInfo'].playersChoices).toEqual(expectedPlayersChoices);
        expect(component['histogramInfo'].interactionsCount).toEqual(expectedInteractionsCount);
        expect(component['histogramInfo'].chartBorderColors).toEqual(expectedChartBorderColors);
        expect(setBackgroundColorsSpy).toHaveBeenCalledTimes(2);
    }));

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

    it('should react to SaveChartData event to save the chart data of a question when the timer has ended', () => {
        component['isResultsPage'] = false;
        const interactionsCount = [1, 2, 3, 4];
        const playersChoices = ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'];
        component['histogramInfo'] = {
            interactionsCount,
            playersChoices,
        } as HistogramInfo;
        spyOn<any>(component['chartDataManager'], 'saveChartData');

        component['reactToChartEvents']();
        socketHelper.peerSideEmit(GameEvents.SaveChartData);

        expect(component['chartDataManager'].saveChartData).toHaveBeenCalledWith(
            component['histogramInfo'].playersChoices,
            component['histogramInfo'].interactionsCount,
        );
    });

    it('should load the QRL chart data in the chart object if user is not in Results page', fakeAsync(() => {
        const qrlIndex = 2;
        component.isResultsPage = false;
        const playerNames = ['name1', 'name2', 'name3', 'name4'];
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of(playerNames));

        component['getQuestion'](qrlIndex);
        tick();

        expect(component['histogramInfo'].playersChoices).toEqual(["N'a pas modifié", 'A modifié']);
        expect(component['histogramInfo'].interactionsCount).toEqual([playerNames.length, 0]);
        expect(component['histogramInfo'].chartBorderColors).toEqual(['black', 'black']);
        expect(component['histogramInfo'].chartBackgroundColors).toEqual(['red', 'green']);
    }));

    it('should load the QRL chart data in the chart object if the user is in Results page', fakeAsync(() => {
        const qrlIndex = 2;
        component.isResultsPage = true;
        component['chartDataToLoad'] = {
            playersChoices: ['0', '50', '100'],
            interactionsCount: [13, 5, 21],
        };
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of([]));

        component['getQuestion'](qrlIndex);
        tick();

        expect(roomCommunicationServiceMock.getRoomPlayers).toHaveBeenCalled();
        expect(component['histogramInfo'].playersChoices).toEqual(component['chartDataToLoad'].playersChoices);
        expect(component['histogramInfo'].interactionsCount).toEqual(component['chartDataToLoad'].interactionsCount);
        expect(component['histogramInfo'].chartBorderColors).toEqual(['black', 'black', 'black']);
        expect(component['histogramInfo'].chartBackgroundColors).toEqual(['red', 'yellow', 'green']);
    }));

    it('should update chart when changing chartDataToLoad', fakeAsync(() => {
        const currentQuestionIndex = 0;
        const questionChartDataToLoad: QuestionChartData = {
            playersChoices: ['C1', 'C2'],
            interactionsCount: [23, 25],
        };
        spyOn<any>(component, 'resetArrays');
        spyOn<any>(component, 'getQuestion');
        spyOn<any>(component, 'updateChartConfig');

        component['setChartDataToLoad'](questionChartDataToLoad, currentQuestionIndex);
        tick();

        expect(component['resetArrays']).toHaveBeenCalled();
        expect(component['chartDataToLoad']).toEqual(questionChartDataToLoad);
        expect(component['currentQuestionIndex']).toEqual(currentQuestionIndex);
        expect(component['getQuestion']).toHaveBeenCalledWith(currentQuestionIndex);
        expect(component['updateChartConfig']).toHaveBeenCalled();
    }));

    it('should fetch charts data from server and set the chart to the first saved one', async () => {
        component['questionsChartData'] = [];
        component['currentQuestionIndex'] = 0;
        component.roomId = '1234';
        component.isResultsPage = true;
        spyOn<any>(component['chartDataManager'], 'getQuestionsChartData').and.returnValue(of([]));
        spyOn<any>(component, 'loadChart');

        await component.ngOnInit();

        expect(component['chartDataManager'].getQuestionsChartData).toHaveBeenCalledWith(component.roomId);
        expect(component['loadChart']).toHaveBeenCalled();
    });

    it('should update interactionsCount based on isResultsPage and chartDataToLoad when getting a question', fakeAsync(() => {
        component['histogramInfo'].interactionsCount = [];
        component.questions = mockedQuestions;
        component.isResultsPage = true;
        component['chartDataToLoad'] = {
            interactionsCount: [1, 2],
            playersChoices: ['C1', 'C2'],
        };
        component['getQuestion'](0);
        tick();

        expect(component['histogramInfo'].interactionsCount).toEqual(component['chartDataToLoad'].interactionsCount);
    }));

    it('should set the title of the chart correctly if in Results Page and question type is QRL', () => {
        component.isResultsPage = true;
        component.currentQuestion = {
            type: 'QRL',
        } as Question;

        const result = component['getChartTitle']();

        expect(result).toEqual('Notes des joueurs');
    });

    it('should set the title of the chart correctly if not in Results Page and question type is QRL', () => {
        component.isResultsPage = false;
        component.currentQuestion = {
            type: 'QRL',
        } as Question;

        const result = component['getChartTitle']();

        expect(result).toEqual('État de réponse des joueurs');
    });

    it('should set the title of the chart if the question type is QCM', () => {
        component.isResultsPage = false;
        component.currentQuestion = {
            type: 'QCM',
        } as Question;

        const result = component['getChartTitle']();

        expect(result).toEqual('Réponses des joueurs');
    });

    it('should react to QRLAnswerUpdate event and update the chart if text was modified', () => {
        component['histogramInfo'] = {} as HistogramInfo;
        const hasModifiedText = true;
        component['histogramInfo'].interactionsCount = [1, 1];
        spyOn<any>(component, 'updateChartConfig');

        socketHelper.peerSideEmit(GameEvents.QRLAnswerUpdate, hasModifiedText);

        expect(component['histogramInfo'].interactionsCount).toEqual([0, 2]);
        expect(component['updateChartConfig']).toHaveBeenCalled();
    });

    it('should react to QRLAnswerUpdate event and update the chart if text was not modified', () => {
        component['histogramInfo'] = {} as HistogramInfo;
        const hasModifiedText = false;
        component['histogramInfo'].interactionsCount = [1, 1];
        spyOn<any>(component, 'updateChartConfig');

        socketHelper.peerSideEmit(GameEvents.QRLAnswerUpdate, hasModifiedText);

        expect(component['histogramInfo'].interactionsCount).toEqual([2, 0]);
        expect(component['updateChartConfig']).toHaveBeenCalled();
    });
});
