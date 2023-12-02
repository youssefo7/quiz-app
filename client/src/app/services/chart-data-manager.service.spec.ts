// Nous avons besoins d'assigner des des arrays avec plusieurs valeurs pour les informations d'un chart
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { ChartDataManagerService } from './chart-data-manager.service';
import { RoomCommunicationService } from './room-communication.service';

describe('ChartDataManagerService', () => {
    let service: ChartDataManagerService;
    let roomCommunicationService: jasmine.SpyObj<RoomCommunicationService>;

    beforeEach(() => {
        const roomCommunicationServiceSpy = jasmine.createSpyObj('RoomCommunicationService', ['sendQuestionsChartData', 'getQuestionsChartData']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ChartDataManagerService, { provide: RoomCommunicationService, useValue: roomCommunicationServiceSpy }],
        });
        service = TestBed.inject(ChartDataManagerService);
        roomCommunicationService = TestBed.inject(RoomCommunicationService) as jasmine.SpyObj<RoomCommunicationService>;
        service['chartData'] = [{ playersChoices: ['A', 'B'], interactionsCount: [1, 2] }];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send chart data to the server through roomCommunicationService', fakeAsync(() => {
        const initialChartData = service['chartData'];
        const roomId = 'testRoom';

        roomCommunicationService.sendQuestionsChartData.and.returnValue(of(service['chartData']));
        service.sendChartData(roomId);
        tick();

        expect(roomCommunicationService.sendQuestionsChartData).toHaveBeenCalledWith(roomId, initialChartData);
        expect(service['chartData']).toEqual([]);
    }));

    it('should get the questions chart data for a given room', async () => {
        service['chartData'] = [];
        const chartDataCopy = service['chartData'];
        const roomId = 'testRoom';

        roomCommunicationService.getQuestionsChartData.and.returnValue(of(chartDataCopy));
        const result = await service.getQuestionsChartData(roomId);

        expect(roomCommunicationService.getQuestionsChartData).toHaveBeenCalledWith(roomId);
        expect(result).toEqual(chartDataCopy);
    });

    it('should save chart data as is when the function is called upon with arguments', () => {
        const playersChoices = ['C1', 'C2'];
        const interactionsCount = [3, 6];

        service.saveChartData(playersChoices, interactionsCount);

        expect(service['chartData'].length).toEqual(2);
        expect(service['chartData'][1].playersChoices).toEqual(playersChoices);
        expect(service['chartData'][1].interactionsCount).toEqual(interactionsCount);
    });

    it('should reset chart data when the room no longer exits', () => {
        service.resetChartData();
        expect(service['chartData']).toEqual([]);
    });
});
