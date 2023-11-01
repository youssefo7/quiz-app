import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { CountdownComponent } from '@app/components/countdown/countdown.component';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { ProfileComponent } from '@app/components/profile/profile.component';
import { QuestionZoneStatsComponent } from '@app/components/question-zone-stats/question-zone-stats.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { HostGamePageComponent } from './host-game-page.component';
import SpyObj = jasmine.SpyObj;

/* The reason for disabling lint is that the code comes from a professor's stub example,
    and the connect is empty in the example he uses.*/
@Component({
    selector: 'app-chat',
    template: '<p>Template Needed</p>',
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class ChatComponentStub {}

describe('HostGamePageComponent', () => {
    let component: HostGamePageComponent;
    let fixture: ComponentFixture<HostGamePageComponent>;
    let communicationServiceMock: SpyObj<CommunicationService>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    let clientSocketServiceMock: SpyObj<SocketClientService>;
    let gameService: GameService;
    let router: Router;
    const mockedQuiz: Quiz = {
        id: '123',
        title: 'Test quiz',
        description: 'Test quiz description',
        visibility: true,
        duration: 60,
        lastModification: '2018-11-13T20:20:39+00:00',
        questions: [],
    };

    beforeEach(() => {
        communicationServiceMock = jasmine.createSpyObj('CommunicationService', ['getQuiz']);
        communicationServiceMock.getQuiz.and.returnValue(of(mockedQuiz));
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef<PopupMessageComponent>', ['componentInstance']);
        mockDialog.open.and.returnValue(mockDialogRef);
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                HostGamePageComponent,
                QuestionZoneStatsComponent,
                HistogramComponent,
                GamePlayersListComponent,
                TopBarComponent,
                CountdownComponent,
                ProfileComponent,
                ChatComponentStub,
                MatIcon,
            ],
            imports: [NgChartsModule],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'host' }] } } },
                { provide: CommunicationService, useValue: communicationServiceMock },
                { provide: MatDialog, useValue: mockDialog },
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: SocketClientService, useValue: clientSocketServiceMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(HostGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        gameService = TestBed.inject(GameService);
        router = TestBed.inject(Router);
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch the quiz ', () => {
        const getQuizByIdSpy = spyOn(gameService, 'getQuizById');
        component['getQuiz']();
        expect(getQuizByIdSpy).toHaveBeenCalledWith(mockedQuiz.id);
    });

    it('clicking the exit icon should redirect to "/game/new" page', () => {
        const navigateSpy = spyOn(router, 'navigateByUrl');
        component['leaveGamePage']();
        expect(navigateSpy).toHaveBeenCalledWith('/game/new');
    });

    it('should popup a message when the user tries to exit a game with the correct configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter la partie? La partie sera terminée pour tous les joueurs.',
            hasCancelButton: true,
            okButtonText: 'Quitter',
            cancelButtonText: 'Annuler',
        };

        component.openQuitPopUp();
        const config = mockDialogRef.componentInstance.config;

        expect(mockDialog.open).toHaveBeenCalled();
        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonText).toEqual(mockConfig.okButtonText);
        expect(config.okButtonFunction).toBeDefined();
    });
});
