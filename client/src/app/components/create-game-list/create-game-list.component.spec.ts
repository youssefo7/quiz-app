// any est nécessaire pour espionner les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { QuizCommunicationService } from '@app/services/quiz-communication.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { JoinEvents } from '@common/join.events';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { CreateGameListComponent } from './create-game-list.component';
import SpyObj = jasmine.SpyObj;

class MockSocketClientService extends SocketClientService {
    override connect() {
        // vide
    }
}

describe('CreateGameListComponent', () => {
    let component: CreateGameListComponent;
    let fixture: ComponentFixture<CreateGameListComponent>;
    let routerSpy: SpyObj<Router>;
    let quizCommunicationServiceSpy: SpyObj<QuizCommunicationService>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    let mockSocketClientService: MockSocketClientService;
    let mockRoomCommunicationService: SpyObj<RoomCommunicationService>;
    let socketHelper: SocketTestHelper;

    const visibleQuizMock: Quiz[] = [
        {
            id: '123',
            title: 'mock1',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: true,
            description: 'mock1 quiz description',
            questions: [
                {
                    type: 'QCM',
                    text: 'Ceci est la première question du mock quiz1?',
                    points: 40,
                    choices: [],
                },
            ],
        },
    ];

    const hiddenQuizMock: Quiz[] = [
        {
            id: '456',
            title: 'mock2',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: false,
            description: 'mock2 quiz description',
            questions: [],
        },
    ];

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        Object.defineProperty(routerSpy, 'url', { value: 'waiting' });
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['componentInstance']);
        quizCommunicationServiceSpy = jasmine.createSpyObj('QuizCommunicationService', [
            'getQuizzes',
            'checkQuizAvailability',
            'checkQuizVisibility',
        ]);
        quizCommunicationServiceSpy.getQuizzes.and.returnValue(of([]));
        mockRoomCommunicationService = jasmine.createSpyObj('RoomCommunicationService', ['createRoom']);
        mockSocketClientService = jasmine.createSpyObj('SocketClientService', ['connect', 'disconnect', 'socketExists', 'send']);
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        mockSocketClientService = new MockSocketClientService();
        mockSocketClientService.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [CreateGameListComponent],
            imports: [HttpClientTestingModule],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: QuizCommunicationService, useValue: quizCommunicationServiceSpy },
                { provide: MatDialog, useValue: mockDialog },
                { provide: SocketClientService, useValue: mockSocketClientService },
                { provide: RoomCommunicationService, useValue: mockRoomCommunicationService },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        mockDialog.open.and.returnValue(mockDialogRef);
        fixture = TestBed.createComponent(CreateGameListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display a message if no games are available', () => {
        const paragraphElement = fixture.nativeElement.querySelector('p');
        expect(component.visibleQuizList.length).toEqual(0);
        expect(paragraphElement.innerText).toEqual("Aucun jeu n'est disponible pour le moment...");
    });

    it('should not display a message if 1 or more games are available', async () => {
        quizCommunicationServiceSpy.getQuizzes.and.returnValue(of(visibleQuizMock));
        await component['getVisibleQuizListFromServer']();
        fixture.detectChanges();

        const paragraphElement = fixture.nativeElement.querySelector('p');

        expect(component.visibleQuizList.length).toBeGreaterThan(0);
        expect(paragraphElement).toBeNull();
    });

    it('should show visible games', async () => {
        quizCommunicationServiceSpy.getQuizzes.and.returnValue(of(hiddenQuizMock));
        await component['getVisibleQuizListFromServer']();

        expect(component.visibleQuizList).toEqual([]);
    });

    it('should not disconnect socket if current URL contains "waiting"', () => {
        const disconnectSpy = spyOn(mockSocketClientService, 'disconnect');
        const mockRoute = '/waiting/game/123/room/0000/host';
        routerSpy.navigateByUrl(mockRoute);
        component.ngOnDestroy();
        expect(disconnectSpy).not.toHaveBeenCalled();
    });

    it('should show toggle button when the quiz is visible', async () => {
        quizCommunicationServiceSpy.getQuizzes.and.returnValue(of(visibleQuizMock));
        await component['getVisibleQuizListFromServer']();
        fixture.detectChanges();

        const toggleButton = fixture.nativeElement.querySelector('.toggle-button');
        expect(component.visibleQuizList).not.toBeNull();
        expect(toggleButton).toBeTruthy();
    });

    it('should toggle the selected quiz id ', () => {
        const quizId = '1';
        expect(component.selectedQuizId).toBeNull();

        component.toggleDetails(quizId);
        expect(component.selectedQuizId).toEqual(quizId);

        component.toggleDetails(quizId);
        expect(component.selectedQuizId).toBeNull();
    });

    it('should toggle the quiz details when the toggle button is clicked', async () => {
        quizCommunicationServiceSpy.getQuizzes.and.returnValue(of(visibleQuizMock));
        await component['getVisibleQuizListFromServer']();
        fixture.detectChanges();

        const toggleButton = fixture.nativeElement.querySelector('.toggle-button');
        component.selectedQuizId = visibleQuizMock[0].id;
        fixture.detectChanges();

        const quizDetails = fixture.nativeElement.querySelector('.quiz-details');

        expect(toggleButton.classList.contains('active')).toBeTruthy();
        expect(quizDetails).toBeTruthy();
    });

    it('should create a room and navigate to it if the quiz is available and visible', async () => {
        const mockSocketId = 'socketId';
        const mockRoomId = '1234';
        const joinRoomSpy = spyOn(mockSocketClientService, 'send');

        quizCommunicationServiceSpy.checkQuizAvailability.and.returnValue(of(true));
        quizCommunicationServiceSpy.checkQuizVisibility.and.returnValue(of(true));
        mockRoomCommunicationService.createRoom.and.returnValue(of({ roomId: mockRoomId }));

        spyOn(mockSocketClientService, 'socketExists').and.returnValue(true);
        Object.defineProperty(mockSocketClientService, 'socket', {
            value: { id: mockSocketId },
        });

        component.selectedQuizId = visibleQuizMock[0].id;
        await component.checkAndCreateRoom(visibleQuizMock[0]);

        expect(joinRoomSpy).toHaveBeenCalledWith(JoinEvents.OrganizerJoined, mockRoomId);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`/waiting/game/${visibleQuizMock[0].id}/room/${mockRoomId}/host`);
    });

    it('should call openConnectionPopUp if socketExists is false', async () => {
        const mockSocketId = 'socketId';
        const mockRoomId = '1234';
        const openConnectionPopUpSpy = spyOn<any>(component, 'openConnectionPopUp');

        quizCommunicationServiceSpy.checkQuizAvailability.and.returnValue(of(true));
        quizCommunicationServiceSpy.checkQuizVisibility.and.returnValue(of(true));
        mockRoomCommunicationService.createRoom.and.returnValue(of({ roomId: mockRoomId }));

        spyOn(mockSocketClientService, 'socketExists').and.returnValue(false);
        const joinRoomSpy = spyOn(mockSocketClientService, 'send');

        Object.defineProperty(mockSocketClientService, 'socket', {
            value: { id: mockSocketId },
        });
        component.selectedQuizId = visibleQuizMock[0].id;
        await component.checkAndCreateRoom(visibleQuizMock[0]);

        expect(openConnectionPopUpSpy).toHaveBeenCalled();
        expect(joinRoomSpy).not.toHaveBeenCalled();
    });

    it('should navigate to test game page if quiz is available and visible', async () => {
        quizCommunicationServiceSpy.checkQuizAvailability.and.returnValue(of(true));
        quizCommunicationServiceSpy.checkQuizVisibility.and.returnValue(of(true));
        await component.checkAndCreateRoom(visibleQuizMock[0], true);

        expect(quizCommunicationServiceSpy.checkQuizAvailability).toHaveBeenCalled();
        expect(quizCommunicationServiceSpy.checkQuizVisibility).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledOnceWith(`game/${visibleQuizMock[0].id}/test`);
    });

    it('should display popup if quiz is hidden', async () => {
        quizCommunicationServiceSpy.checkQuizAvailability.and.returnValue(of(true));
        quizCommunicationServiceSpy.checkQuizVisibility.and.returnValue(of(false));
        const hiddenPopUpSpy = spyOn<any>(component, 'openHiddenPopUp').and.callThrough();
        await component.checkAndCreateRoom(hiddenQuizMock[0]);

        expect(quizCommunicationServiceSpy.checkQuizAvailability).toHaveBeenCalled();
        expect(quizCommunicationServiceSpy.checkQuizVisibility).toHaveBeenCalled();
        expect(hiddenPopUpSpy).toHaveBeenCalled();
    });

    it('should display popup if quiz is deleted', async () => {
        quizCommunicationServiceSpy.checkQuizAvailability.and.returnValue(of(false));
        quizCommunicationServiceSpy.checkQuizVisibility.and.returnValue(of(false));
        const isUnavailableSpy = spyOn(component, 'openUnavailablePopUp').and.callThrough();
        await component.checkAndCreateRoom(hiddenQuizMock[0]);

        expect(quizCommunicationServiceSpy.checkQuizAvailability).toHaveBeenCalled();
        expect(quizCommunicationServiceSpy.checkQuizVisibility).not.toHaveBeenCalled();
        expect(isUnavailableSpy).toHaveBeenCalled();
    });

    it('should display unavailable popUp when quiz has been deleted', () => {
        const popUpInstanceSpy = jasmine.createSpyObj('PopupMessageComponent', ['']);
        mockDialogRef.componentInstance = popUpInstanceSpy;
        mockDialog.open.and.returnValue(mockDialogRef);
        component.openUnavailablePopUp();

        expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should display hidden popUp when quiz has been hidden', () => {
        const popUpInstanceSpy = jasmine.createSpyObj('PopupMessageComponent', ['']);
        mockDialogRef.componentInstance = popUpInstanceSpy;
        mockDialog.open.and.returnValue(mockDialogRef);
        component['openHiddenPopUp']();

        expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should show the unavailable quiz popUp with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Le jeu a été supprimé. Veuillez en choisir un autre dans la liste.',
            hasCancelButton: false,
        };

        component.openUnavailablePopUp();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });

    it('should show the hidden quiz popUp with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: "Le jeu n'est plus disponible. Veuillez en choisir un autre dans la liste.",
            hasCancelButton: false,
        };

        component['openHiddenPopUp']();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });

    it('should show the openConnection popUp with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: "Vous n'êtes pas connecté. Veuillez réessayer.",
            hasCancelButton: false,
        };

        component['openConnectionPopUp']();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).not.toBeDefined();
    });
});
