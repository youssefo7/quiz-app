import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ChartDataManagerService } from './chart-data-manager.service';
import { RoomCommunicationService } from './room-communication.service';

describe('ChartDataManagerService', () => {
    let service: ChartDataManagerService;
    let roomCommunicationService: jasmine.SpyObj<RoomCommunicationService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('RoomCommunicationService', ['sendQuestionsChartData', 'getQuestionsChartData']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ChartDataManagerService, { provide: RoomCommunicationService, useValue: spy }],
        });
        service = TestBed.inject(ChartDataManagerService);
        roomCommunicationService = TestBed.inject(RoomCommunicationService) as jasmine.SpyObj<RoomCommunicationService>;
        service['chartData'] = [{ playersChoices: ['A', 'B'], interactionsCount: [1, 2] }];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get the questions chart data for a given room by using the getQuestionsChartData from the roomCommunicationSwervice', async () => {
        const chartDataCopy = service['chartData'];
        const roomId = 'testRoom';

        roomCommunicationService.getQuestionsChartData.and.returnValue(of(chartDataCopy));
        const result = await service.getQuestionsChartData(roomId);

        expect(roomCommunicationService.getQuestionsChartData).toHaveBeenCalledWith(roomId);
        expect(result).toEqual(chartDataCopy);
    });

    it('should save chart data as is when the function is called upon with arguments', () => {
        const playersChoices = ['A', 'B'];
        const interactionsCount = [1, 2];

        service.saveChartData(playersChoices, interactionsCount);

        expect(service['chartData'].length).toEqual(2);
        expect(service['chartData'][0]).toEqual({ playersChoices, interactionsCount });
    });

    it('should find chart data to load from the questionsChartData for a given room', () => {
        const questionsChartData = [{ playersChoices: ['A', 'B'], interactionsCount: [1, 2] }];
        const currentQuestionIndex = 0;

        const result = service.findChartDataToLoad(questionsChartData, currentQuestionIndex);

        expect(result).toEqual(questionsChartData[currentQuestionIndex]);
    });

    it('should reset chart data when the room no longer exits', () => {
        service.resetChartData();
        expect(service['chartData']).toEqual([]);
    });
});
