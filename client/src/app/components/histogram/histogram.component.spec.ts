import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SocketClientService } from '@app/services/socket-client.service';
import { NgChartsModule } from 'ng2-charts';
import { HistogramComponent } from './histogram.component';

import SpyObj = jasmine.SpyObj;

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;
    let socketClientServiceMock: SpyObj<SocketClientService>;
    // const mockedQuiz = {
    //     $schema: 'test.json',
    //     id: '123',
    //     title: 'Test quiz',
    //     description: 'Test quiz description',
    //     visibility: true,
    //     duration: 60,
    //     lastModification: '2018-11-13T20:20:39+00:00',
    //     questions: [],
    // };

    beforeEach(() => {
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['on']);
    });

    beforeEach(waitForAsync(() => {
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
});
