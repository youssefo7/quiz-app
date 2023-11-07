// Nous avons besoin du any pour tester les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { GameEvents } from '@app/events/game.events';
import { TimeEvents } from '@app/events/time.events';
import { Quiz } from '@app/interfaces/quiz';
import { SocketClientService } from '@app/services/socket-client.service';
import { NgChartsModule } from 'ng2-charts';
import { Socket } from 'socket.io-client';
import { HistogramComponent } from './histogram.component';

class MockSocketClientService extends SocketClientService {
    override connect() {
        // vide
    }
}

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;
    let socketClientServiceMock: MockSocketClientService;
    let socketHelper: SocketTestHelper;
    const mockedQuiz: Quiz = {
        $schema: 'test.json',
        id: '123',
        title: 'Test quiz',
        description: 'Test quiz description',
        visibility: true,
        duration: 60,
        lastModification: '2018-11-13T20:20:39+00:00',
        questions: [
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
        ],
    };

    beforeEach(() => {
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['on']);
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new MockSocketClientService();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [HistogramComponent],
            imports: [NgChartsModule],
            providers: [{ provide: SocketClientService, useValue: socketClientServiceMock }],
        }).compileComponents();
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load chart and listen to socket events when created', () => {
        const loadChartSpy = spyOn<any>(component, 'loadChart');
        const updateSelectionsSpy = spyOn<any>(component, 'updateSelections');
        const reactToTransitionClockFinishedEventSpy = spyOn<any>(component, 'reactToTransitionClockFinishedEvent');

        component.ngOnInit();
        expect(loadChartSpy).toHaveBeenCalled();
        expect(updateSelectionsSpy).toHaveBeenCalled();
        expect(reactToTransitionClockFinishedEventSpy).toHaveBeenCalled();
    });

    it('should update chart information when getting question', () => {
        component.quiz = mockedQuiz;
        const expectedPlayersChoices = ['Choix 1', 'Choix 2'];
        const expectedChoicesSelectionCounts = [0, 0];
        const expectedChartBorderColors = ['black', 'black'];
        const setBackgroundColorsSpy = spyOn<any>(component, 'setBackgroundColors');
        component['getQuestion'](0);

        expect(component['playersChoices']).toEqual(expectedPlayersChoices);
        expect(component['choicesSelectionCounts']).toEqual(expectedChoicesSelectionCounts);
        expect(component['chartBorderColors']).toEqual(expectedChartBorderColors);
        expect(setBackgroundColorsSpy).toHaveBeenCalledTimes(2);
    });

    it('should set background colors and update goodBadChoices accordingly to correctness of answer choices', () => {
        component.question = mockedQuiz.questions[1];
        const expectedBackgroundColors = ['red', 'green', 'red'];
        const expectedGoodBadChoices = [false, true, false];

        component['setBackgroundColors'](0);
        component['setBackgroundColors'](1);
        component['setBackgroundColors'](2);
        expect(component['chartBackgroundColors']).toEqual(expectedBackgroundColors);
        expect(component['goodBadChoices']).toEqual(expectedGoodBadChoices);
    });

    it('should prepare next question when the transition clock is finished', () => {
        const questionIndex = 0;
        component['currentQuestionIndex'] = questionIndex;
        const resetArraysSpy = spyOn<any>(component, 'resetArrays');
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        const updateChartConfigSpy = spyOn<any>(component, 'updateChartConfig');

        socketHelper.peerSideEmit(TimeEvents.TransitionClockFinished);
        expect(component['currentQuestionIndex']).toEqual(questionIndex + 1);
        expect(resetArraysSpy).toHaveBeenCalled();
        expect(getQuestionSpy).toHaveBeenCalledWith(questionIndex + 1);
        expect(updateChartConfigSpy).toHaveBeenCalled();
    });

    it('should reset arrays', () => {
        component['playersChoices'] = ['Choix 1', 'Choix 2'];
        component['choicesSelectionCounts'] = [2, 2];
        component['chartBorderColors'] = ['black', 'black'];
        component['chartBackgroundColors'] = ['red', 'green'];
        component['goodBadChoices'] = [false, true];

        component['resetArrays']();
        expect(component['playersChoices']).toEqual([]);
        expect(component['choicesSelectionCounts']).toEqual([]);
        expect(component['chartBorderColors']).toEqual([]);
        expect(component['chartBackgroundColors']).toEqual([]);
        expect(component['goodBadChoices']).toEqual([]);
    });

    it('should update selections on QuestionChoiceUnselect and QuestionChoiceSelect events', () => {
        component['choicesSelectionCounts'] = [0, 0];
        const updateSpy = spyOn(component.chart, 'update');

        socketHelper.peerSideEmit(GameEvents.QuestionChoiceSelect, 0);
        socketHelper.peerSideEmit(GameEvents.QuestionChoiceSelect, 0);
        expect(component['choicesSelectionCounts'][0]).toEqual(2);
        expect(updateSpy).toHaveBeenCalled();

        socketHelper.peerSideEmit(GameEvents.QuestionChoiceUnselect, 0);
        expect(component['choicesSelectionCounts'][0]).toEqual(1);
        expect(updateSpy).toHaveBeenCalled();
    });

    it('should create player answers chart', () => {
        // On a besoin de détruire le chart pour lui en assigner un nouveau
        component.ngOnDestroy();
        component.quiz = mockedQuiz;
        component['currentQuestionIndex'] = 0;
        component['loadChart']();
        const chartData = component.chart.data;
        const chartDataset = chartData.datasets[0];

        expect(chartData.labels).toEqual(component['playersChoices']);
        expect(chartDataset.data).toEqual(component['choicesSelectionCounts']);
        expect(chartDataset.backgroundColor).toEqual(component['chartBackgroundColors']);
        expect(chartDataset.borderColor).toEqual(component['chartBorderColors']);
    });

    it('should update chart configuration', () => {
        const playersChoices = ['Choix 1', 'Choix 2'];
        const choicesSelectionCounts = [2, 2];
        const chartBorderColors = ['black', 'black'];
        const chartBackgroundColors = ['red', 'green'];
        component['playersChoices'] = playersChoices;
        component['choicesSelectionCounts'] = choicesSelectionCounts;
        component['chartBorderColors'] = chartBorderColors;
        component['chartBackgroundColors'] = chartBackgroundColors;

        const chartDataset = component.chart.data.datasets[0];
        component['updateChartConfig']();
        expect(component.chart.data.labels).toEqual(playersChoices);
        expect(chartDataset.data).toEqual(choicesSelectionCounts);
        expect(chartDataset.backgroundColor).toEqual(chartBackgroundColors);
        expect(chartDataset.borderColor).toEqual(chartBorderColors);
    });
});
