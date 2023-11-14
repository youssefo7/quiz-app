import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog } from '@angular/material/dialog';
import { HistoryCommunicationService } from '@app/services/history-communication.service';
import { HistoryComponent } from './history.component';

describe('HistoryComponent', () => {
    let component: HistoryComponent;
    let fixture: ComponentFixture<HistoryComponent>;
    let historyCommunicationServiceMock: jasmine.SpyObj<HistoryCommunicationService>;
    let matDialogServiceSpy: jasmine.SpyObj<MatDialog>;
    const history = [
        {
            name: 'abc',
            date: '2021-10-11 01:02:03',
            numberOfPlayers: 2,
            maxScore: 10,
        },
        {
            name: 'test',
            date: '2021-10-10 01:02:03',
            numberOfPlayers: 2,
            maxScore: 10,
        },
    ];

    beforeEach(() => {
        matDialogServiceSpy = jasmine.createSpyObj('MatDialog', ['open']);
        historyCommunicationServiceMock = jasmine.createSpyObj('HistoryCommunicationService', ['getAllHistory']);

        TestBed.configureTestingModule({
            declarations: [HistoryComponent],
            providers: [
                {
                    provide: HistoryCommunicationService,
                    useValue: historyCommunicationServiceMock,
                },
                {
                    provide: MatDialog,
                    useValue: matDialogServiceSpy,
                },
            ],
        });
        fixture = TestBed.createComponent(HistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.history = history;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // it('should load history', () => {
    //     component.loadHistory();
    //     historyCommunicationServiceMock.getAllHistory.and.returnValue(of(history));
    //     expect(component.isHistoryEmpty).toBeFalsy();
    // });

    it('should sort history by name', () => {
        component.sort('name');
        expect(component.history[0].name).toEqual('test');
        component.sort('name');
        expect(component.history[0].name).toEqual('abc');
    });

    it('should sort history by date', () => {
        component.sort('date');
        expect(component.history[0].date).toEqual('2021-10-11 01:02:03');
        component.sort('date');
        expect(component.history[0].date).toEqual('2021-10-10 01:02:03');
    });

    // it('should open delete history popup', () => {
    //     component.isHistoryEmpty = false;
    //     const deleteIcon = fixture.debugElement.nativeElement.querySelector('.fa-trash');
    //     deleteIcon.click();

    //     expect(matDialogServiceSpy.open).toHaveBeenCalled();
    // });
});
