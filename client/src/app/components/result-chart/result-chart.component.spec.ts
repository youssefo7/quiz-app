/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { QuestionChartData } from '@common/question-chart-data';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { ResultChartComponent } from './result-chart.component';

describe('ResultChartComponent', () => {
    let component: ResultChartComponent;
    let fixture: ComponentFixture<ResultChartComponent>;
    let histogramComponentMock: HistogramComponent;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;
    const mockQuestionsChartData: QuestionChartData[] = [
        { playersChoices: ['C1', 'C2'], interactionsCount: [1, 2] },
        { playersChoices: ['C3', 'C4'], interactionsCount: [3, 4] },
        { playersChoices: ['C5', 'C6'], interactionsCount: [5, 6] },
    ];

    beforeEach(() => {
        histogramComponentMock = jasmine.createSpyObj('HistogramComponent', ['setChartDataToLoad']);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getQuestionsChartData']);
        roomCommunicationServiceMock.getQuestionsChartData.and.returnValue(of(mockQuestionsChartData));
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ResultChartComponent, HistogramComponent, MatIcon],
            imports: [NgChartsModule, HttpClientTestingModule],
            providers: [{ provide: RoomCommunicationService, useValue: roomCommunicationServiceMock }],
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ResultChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should reset all data when the resetData method is called', () => {
        component.currentQuestionIndex = 1;
        component['lastQuestionIndex'] = 2;
        component['chartData'] = mockQuestionsChartData;

        component['resetData']();

        expect(component.currentQuestionIndex).toEqual(0);
        expect(component['lastQuestionIndex']).toEqual(0);
        expect(component['chartData'].length).toEqual(0);
    });

    it('should increment the currentQuestionIndex and call updateChartToLoad when transitionning to the next question', () => {
        component['lastQuestionIndex'] = 2;
        const initialCurrentIndex = component.currentQuestionIndex;
        spyOn<any>(component, 'updateChartToLoad');

        component.viewNextQuestion();

        expect(component.currentQuestionIndex).toEqual(initialCurrentIndex + 1);
        expect(component['updateChartToLoad']).toHaveBeenCalled();
    });

    it('should decrement the currentQuestionIndex and call updateChartToLoad when transitionning to the previous question', () => {
        component.currentQuestionIndex = 1;
        spyOn<any>(component, 'updateChartToLoad');

        component.viewPreviousQuestion();

        expect(component.currentQuestionIndex).toEqual(0);
        expect(component['updateChartToLoad']).toHaveBeenCalled();
    });

    it('should call resetData when component is being destroyed', () => {
        spyOn<any>(component, 'resetData');
        component.ngOnDestroy();
        expect(component['resetData']).toHaveBeenCalled();
    });

    it('should verify if it is possible for a user to alternate between charts', () => {
        component.currentQuestionIndex = 2;
        component['lastQuestionIndex'] = 3;

        const isNextQuestionPossible = component['isViewNextQuestionPossible']();
        const isPreviousQuestionPossible = component['isViewPreviousQuestionPossible']();

        expect(isNextQuestionPossible).toBeTruthy();
        expect(isPreviousQuestionPossible).toBeTruthy();
    });

    it('should not let user view previous or next question if the quiz only has 1 question', () => {
        component.currentQuestionIndex = 0;
        component['lastQuestionIndex'] = 0;

        const isNextQuestionPossible = component['isViewNextQuestionPossible']();
        const isPreviousQuestionPossible = component['isViewPreviousQuestionPossible']();

        expect(isNextQuestionPossible).toBeFalsy();
        expect(isPreviousQuestionPossible).toBeFalsy();
    });

    it('should check if player can go to the next or previous question when updateQuestionNavigation is called', () => {
        component.canGoToNextQuestion = false;
        component.canGoToPreviousQuestion = false;

        component.currentQuestionIndex = 2;
        component['lastQuestionIndex'] = 3;

        component['updateQuestionNavigation']();

        expect(component.canGoToNextQuestion).toBeTruthy();
        expect(component.canGoToPreviousQuestion).toBeTruthy();
    });

    it('should not let player go to previous question when handleNavigation is called and the user is at the first question', () => {
        component.canGoToNextQuestion = false;
        component.canGoToPreviousQuestion = false;

        component.currentQuestionIndex = 0;
        component['lastQuestionIndex'] = 3;

        component['updateQuestionNavigation']();

        expect(component.canGoToNextQuestion).toBeTruthy();
        expect(component.canGoToPreviousQuestion).toBeFalsy();
    });

    it('should initialize the values for attributes after the page is created', async () => {
        component.roomId = '1234';
        component['chartData'] = [];
        spyOn<any>(component['chartDataManager'], 'getQuestionsChartData').and.callThrough();
        spyOn<any>(component, 'isViewNextQuestionPossible').and.callThrough();
        spyOn<any>(component, 'isViewPreviousQuestionPossible').and.callThrough();

        await component.ngOnInit();

        expect(component['chartDataManager'].getQuestionsChartData).toHaveBeenCalledWith(component.roomId);
        expect(component['chartData']).toEqual(mockQuestionsChartData);
        expect(component['lastQuestionIndex']).toEqual(mockQuestionsChartData.length - 1);
        expect(component['isViewNextQuestionPossible']).toHaveBeenCalled();
        expect(component['isViewPreviousQuestionPossible']).toHaveBeenCalled();
        expect(component.canGoToNextQuestion).toBeTruthy();
        expect(component.canGoToPreviousQuestion).toBeFalsy();
    });

    it('should update chartDataToLoad', () => {
        component['chartData'] = mockQuestionsChartData;
        component.currentQuestionIndex = 0;
        component.histogram = histogramComponentMock;

        spyOn<any>(component, 'updateQuestionNavigation').and.callThrough();
        spyOn<any>(component['chartDataManager'], 'findChartDataToLoad').and.returnValue(mockQuestionsChartData[0]);

        component['updateChartToLoad']();

        expect(component['chartDataManager'].findChartDataToLoad).toHaveBeenCalledWith(mockQuestionsChartData, 0);
        expect(component['chartDataToLoad']).toEqual(mockQuestionsChartData[0]);
        expect(histogramComponentMock.setChartDataToLoad).toHaveBeenCalledWith(mockQuestionsChartData[0], 0);
        expect(component['updateQuestionNavigation']).toHaveBeenCalled();
    });
});
