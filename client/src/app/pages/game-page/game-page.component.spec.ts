/* eslint-disable max-classes-per-file */
// any est nécessaire pour espionner les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { CountdownComponent } from '@app/components/countdown/countdown.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { ProfileComponent } from '@app/components/profile/profile.component';
import { QuestionZoneComponent } from '@app/components/question-zone/question-zone.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { QuizCommunicationService } from '@app/services/quiz-communication.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { PlayerPoints } from '@common/player-points';
import { TimeEvents } from '@common/time.events';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { GamePageComponent } from './game-page.component';
import SpyObj = jasmine.SpyObj;

// La raison du lint disable est que le code vient d'un exemple de stub du professeur et le connect est vide dans l'exemple qu'il utilise.
@Component({
    selector: 'app-chat',
    template: '<p>Template Needed</p>',
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class ChatComponentStub {}

describe('GamePageComponent in test game route', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let quizCommunicationServiceMock: jasmine.SpyObj<QuizCommunicationService>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    let router: Router;
    let clientSocketServiceMock: jasmine.SpyObj<SocketClientService>;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;

    const mockedQuiz = {
        id: '123',
        title: 'Test quiz',
        description: 'Test quiz description',
        visibility: true,
        duration: 60,
        lastModification: '2018-11-13T20:20:39+00:00',
        questions: [],
    };

    beforeEach(async () => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists', 'connect', 'disconnect', 'send']);
        clientSocketServiceMock.socketExists.and.returnValue(true);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getPlayerName']);
        quizCommunicationServiceMock = jasmine.createSpyObj('QuizCommunicationService', ['getQuiz']);
        quizCommunicationServiceMock.getQuiz.and.returnValue(of(mockedQuiz));
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef<PopupMessageComponent>', ['componentInstance']);
        mockDialog.open.and.returnValue(mockDialogRef);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                GamePageComponent,
                TopBarComponent,
                CountdownComponent,
                QuestionZoneComponent,
                ProfileComponent,
                ChatComponentStub,
                MatIcon,
            ],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'test' }] } } },
                { provide: MatDialog, useValue: mockDialog },
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: QuizCommunicationService, useValue: quizCommunicationServiceMock },
                { provide: SocketClientService, useValue: clientSocketServiceMock },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call leaveGameaPage when clicking okButton', () => {
        spyOn<any>(component, 'leaveGamePage');
        component.openQuitPopUp();

        const config = mockDialogRef.componentInstance.config;
        expect(mockDialog.open).toHaveBeenCalled();
        config.okButtonFunction?.();
        expect(component['leaveGamePage']).toHaveBeenCalled();
    });

    it('clicking the exit icon should redirect to "game/new" page', () => {
        const navigateSpy = spyOn(router, 'navigateByUrl');
        component['leaveGamePage']();
        expect(navigateSpy).toHaveBeenCalledWith('/game/new');
    });

    it('should give points to the player', () => {
        const pointsWonFirstQuestion = 30;
        const pointsWonSecondQuestion = 50;
        component.givePoints(pointsWonFirstQuestion);
        component.givePoints(pointsWonSecondQuestion);
        expect(component.playerPoints).toEqual(pointsWonFirstQuestion + pointsWonSecondQuestion);
    });

    it('should fetch the quiz ', fakeAsync(() => {
        const id = '123';
        component['getQuiz']();
        tick();

        expect(quizCommunicationServiceMock.getQuiz).toHaveBeenCalledWith(id);
        expect(component.quiz).toEqual(mockedQuiz);
    }));

    it('should popup a message when the user tries to exit a game with the correct configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter la partie? Vous ne pourrez plus rejoindre cette partie.',
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

    it('should not call handleNavigation when beforeunload event is triggered and it is a test game', () => {
        spyOn<any>(component, 'handleNavigation');
        component['beforeUnloadHandler']();
        expect(component['handleNavigation']).not.toHaveBeenCalled();
    });

    it('should not call socketClientServiceConfig if it is a test game', fakeAsync(() => {
        spyOn<any>(component, 'getQuiz').and.returnValue(Promise.resolve());
        spyOn<any>(component, 'getQuizTitle');
        spyOn<any>(component, 'socketClientServiceConfig');

        component['loadQuiz']();
        tick();

        expect(component['getQuiz']).toHaveBeenCalled();
        expect(component['getQuizTitle']).toHaveBeenCalled();
        expect(component['socketClientServiceConfig']).not.toHaveBeenCalled();
    }));
});

class MockSocketClientService extends SocketClientService {
    private mockSocketExists = true;

    override connect() {
        this.mockSocketExists = true;
    }

    override socketExists() {
        return this.mockSocketExists;
    }

    override disconnect() {
        this.setSocketExists(false);
    }

    setSocketExists(value: boolean) {
        this.mockSocketExists = value;
    }
}

describe('GamePageComponent in regular game route', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let router: Router;
    let quizCommunicationServiceMock: jasmine.SpyObj<QuizCommunicationService>;
    let clientSocketServiceMock: MockSocketClientService;

    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['connect', 'disconnect', 'on', 'socketExists', 'send']);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getPlayerName']);
        quizCommunicationServiceMock = jasmine.createSpyObj('CommunicationService', ['getQuiz']);
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        clientSocketServiceMock = new MockSocketClientService();
        clientSocketServiceMock.socket = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            declarations: [
                GamePageComponent,
                TopBarComponent,
                ProfileComponent,
                ChatComponentStub,
                QuestionZoneComponent,
                CountdownComponent,
                MatIcon,
            ],
            imports: [MatDialogModule],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: '' }] } } },
                { provide: QuizCommunicationService, useValue: quizCommunicationServiceMock },
                { provide: SocketClientService, useValue: clientSocketServiceMock },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
            ],
        }).compileComponents();

        clientSocketServiceMock.setSocketExists(true);
        router = TestBed.inject(Router);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should redirect to "/home" page when clicking the exit icon', () => {
        const navigateSpy = spyOn(router, 'navigateByUrl');
        component['leaveGamePage']();
        expect(navigateSpy).toHaveBeenCalledWith('/home');
    });

    it('should call handleNavigation when beforeunload event is triggered and it is not a test game', () => {
        spyOn<any>(component, 'handleNavigation');
        component['beforeUnloadHandler']();
        expect(component['handleNavigation']).toHaveBeenCalled();
    });

    it('should react to SendResults event and navigate to the Results page', () => {
        spyOn(router, 'navigateByUrl');

        component['socketClientServiceConfig']();
        socketHelper.peerSideEmit(GameEvents.ShowResults);

        expect(router.navigateByUrl).toHaveBeenCalled();
    });

    it('should react to AddPointsToPlayer event by giving the points to player that got a correct answer', () => {
        const pointsToGive: PlayerPoints = {
            pointsToAdd: 50,
        };
        const initialPlayerPoints = 100;
        component.playerPoints = initialPlayerPoints;
        spyOn(component, 'givePoints').and.callThrough();

        component['socketClientServiceConfig']();
        socketHelper.peerSideEmit(GameEvents.AddPointsToPlayer, pointsToGive);

        expect(component.givePoints).toHaveBeenCalledWith(pointsToGive.pointsToAdd);
        expect(component.playerPoints).toEqual(initialPlayerPoints + pointsToGive.pointsToAdd);
    });

    it('should react to the PanicMode event and play the panic sound', () => {
        spyOn<any>(component, 'playPanicModeSound');

        component['socketClientServiceConfig']();
        socketHelper.peerSideEmit(TimeEvents.PanicMode);

        expect(component['playPanicModeSound']).toHaveBeenCalled();
    });

    it('should call getQuiz and getQuizTitle when loading quiz', fakeAsync(() => {
        spyOn<any>(component, 'getQuiz');
        spyOn<any>(component, 'getQuizTitle');

        component['loadQuiz']();
        tick();

        expect(component['getQuiz']).toHaveBeenCalled();
        expect(component['getQuizTitle']).toHaveBeenCalled();
    }));

    it('should call socketClientServiceConfig if it is not a test game', fakeAsync(() => {
        spyOn<any>(component, 'getQuiz').and.returnValue(Promise.resolve());
        spyOn<any>(component, 'getQuizTitle');
        spyOn<any>(component, 'socketClientServiceConfig');

        component['loadQuiz']();
        tick();

        expect(component['getQuiz']).toHaveBeenCalled();
        expect(component['getQuizTitle']).toHaveBeenCalled();
        expect(component['socketClientServiceConfig']).toHaveBeenCalled();
    }));

    it('should connect, send PlayerLeaveGame event, disconnect, and navigate to "home/" if not a test game and non existing socket', fakeAsync(() => {
        clientSocketServiceMock.setSocketExists(false);
        const connectSpy = spyOn(clientSocketServiceMock, 'connect').and.callThrough();
        const sendSpy = spyOn(clientSocketServiceMock, 'send');

        spyOn(component['router'], 'navigateByUrl');

        component.ngOnInit();
        fixture.detectChanges();
        tick();

        expect(connectSpy).toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalled();
        expect(component['router'].navigateByUrl).toHaveBeenCalledWith('home/');
    }));

    it('should play panic audio when playPanicModeSound is called', () => {
        spyOn<any>(component['panicAudio'], 'play');
        component['playPanicModeSound']();
        expect(component['panicAudio'].play).toHaveBeenCalled();
    });
});
