import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { HistogramComponent } from './histogram.component';

import SpyObj = jasmine.SpyObj;

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;
    let gameServiceMock: SpyObj<GameService>;
    let timeServiceMock: SpyObj<TimeService>;
    let socketClientServiceMock: SpyObj<SocketClientService>;
    const mockedQuiz = {
        $schema: 'test.json',
        id: '123',
        title: 'Test quiz',
        description: 'Test quiz description',
        visibility: true,
        duration: 60,
        lastModification: '2018-11-13T20:20:39+00:00',
        questions: [],
    };

    beforeEach(() => {
        gameServiceMock = jasmine.createSpyObj('GameService', ['getQuizById']);
        gameServiceMock.getQuizById.and.returnValue(Promise.resolve(mockedQuiz));
        timeServiceMock = jasmine.createSpyObj('TimeService', ['subscribeToGameService', 'getTime']);
        timeServiceMock.getTime.and.returnValue(of(0));
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['on']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [HistogramComponent],
            imports: [NgChartsModule],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
                { provide: GameService, useValue: gameServiceMock },
                { provide: TimeService, useValue: timeServiceMock },
                { provide: SocketClientService, useValue: socketClientServiceMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch the quiz ', () => {
        component['getQuiz']();
        expect(gameServiceMock.getQuizById).toHaveBeenCalledWith(mockedQuiz.id);
    });
});
