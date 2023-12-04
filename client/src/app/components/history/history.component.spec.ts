import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { HistoryCommunicationService } from '@app/services/history-communication.service';
import { of } from 'rxjs';
import { HistoryComponent } from './history.component';

describe('HistoryComponent', () => {
    let component: HistoryComponent;
    let fixture: ComponentFixture<HistoryComponent>;
    let historyCommunicationServiceMock: jasmine.SpyObj<HistoryCommunicationService>;
    let mockDialog: jasmine.SpyObj<MatDialog>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<PopupMessageComponent>>;

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
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['componentInstance']);
        historyCommunicationServiceMock = jasmine.createSpyObj('HistoryCommunicationService', ['getAllHistory', 'deleteAllHistory']);

        TestBed.configureTestingModule({
            declarations: [HistoryComponent],
            providers: [
                {
                    provide: HistoryCommunicationService,
                    useValue: historyCommunicationServiceMock,
                },
                {
                    provide: MatDialog,
                    useValue: mockDialog,
                },
            ],
        });
        fixture = TestBed.createComponent(HistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.history = history;
        historyCommunicationServiceMock.getAllHistory.and.returnValue(of(component.history));
        mockDialog.open.and.returnValue(mockDialogRef);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load history', () => {
        component['loadHistory']();
        expect(historyCommunicationServiceMock.getAllHistory).toHaveBeenCalled();
    });

    it('should sort history by name', () => {
        component.sortHistory('name');
        expect(component.history[0].name).toEqual('test');
        expect(component['isSortingByName']).toBeTruthy();
        expect(component['isSortingByDate']).toBeFalsy();

        component.sortHistory('name');
        expect(component.history[0].name).toEqual('abc');
        expect(component['isSortingByName']).toBeTruthy();
        expect(component['isSortingByDate']).toBeFalsy();
    });

    it('should sort history by date', () => {
        component.sortHistory('date');
        expect(component.history[0].date).toEqual('2021-10-11 01:02:03');
        expect(component['isSortingByName']).toBeFalsy();
        expect(component['isSortingByDate']).toBeTruthy();

        component.sortHistory('date');
        expect(component.history[0].date).toEqual('2021-10-10 01:02:03');
        expect(component['isSortingByName']).toBeFalsy();
        expect(component['isSortingByDate']).toBeTruthy();
    });

    it('should display delete history popup with the correct configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: "Êtes-vous sûr de vouloir supprimer tout l'historique?",
            hasCancelButton: true,
        };

        component.openDeleteHistoryPopUp();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });

    it('should sort the history from the most recent date when history list is not empty', fakeAsync(() => {
        spyOn(component, 'sortHistory');
        component.ngOnInit();
        tick();
        expect(component.sortHistory).toHaveBeenCalledWith('date');
    }));

    it('should not sort the history from the most recent date when history list is empty', fakeAsync(() => {
        historyCommunicationServiceMock.getAllHistory.and.returnValue(of([]));
        spyOn(component, 'sortHistory');

        component.ngOnInit();
        tick();

        expect(component.sortHistory).not.toHaveBeenCalledWith('date');
    }));
});
