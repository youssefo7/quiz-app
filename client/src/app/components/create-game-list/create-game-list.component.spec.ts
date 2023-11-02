import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Socket } from 'socket.io-client';

import { of } from 'rxjs';
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
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    let mockSocketClientService: MockSocketClientService;
    let socketHelper: SocketTestHelper;

    const visibleQuizMock: Quiz[] = [
        {
            $schema: 'quiz-schema.json',
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
            $schema: 'quiz-schema.json',
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
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['componentInstance']);
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getQuizzes', 'checkQuizAvailability', 'checkQuizVisibility']);
        communicationServiceSpy.getQuizzes.and.returnValue(of([]));
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
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: MatDialog, useValue: mockDialog },
                { provide: SocketClientService, useValue: mockSocketClientService },
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
        communicationServiceSpy.getQuizzes.and.returnValue(of(visibleQuizMock));
        await component.getVisibleQuizListFromServer();
        fixture.detectChanges();

        const paragraphElement = fixture.nativeElement.querySelector('p');

        expect(component.visibleQuizList.length).toBeGreaterThan(0);
        expect(paragraphElement).toBeNull();
    });

    it('should show visible games', async () => {
        communicationServiceSpy.getQuizzes.and.returnValue(of(hiddenQuizMock));
        await component.getVisibleQuizListFromServer();

        expect(component.visibleQuizList).toEqual([]);
    });

    it('should show toggle button when the quiz is visible', async () => {
        communicationServiceSpy.getQuizzes.and.returnValue(of(visibleQuizMock));
        await component.getVisibleQuizListFromServer();
        fixture.detectChanges();

        const toggleButton = fixture.nativeElement.querySelector('.toggleButton');
        expect(component.visibleQuizList).not.toEqual([]);
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
        communicationServiceSpy.getQuizzes.and.returnValue(of(visibleQuizMock));
        await component.getVisibleQuizListFromServer();
        fixture.detectChanges();

        const toggleButton = fixture.nativeElement.querySelector('.toggleButton');
        component.selectedQuizId = visibleQuizMock[0].id;
        fixture.detectChanges();

        const quizDetails = fixture.nativeElement.querySelectorAll('quizDetails');
        const questions = fixture.nativeElement.querySelectorAll('.quizDetails li');

        expect(toggleButton.classList.contains('active')).toBeTruthy();
        expect(quizDetails).toBeTruthy();
        expect(questions.length).toEqual(visibleQuizMock[0].questions.length);
    });

    it('should navigate to the correct URL when calling redirectHost', () => {
        const connectSpy = spyOn(component['socketClientService'], 'connect');
        communicationServiceSpy.checkQuizAvailability.and.returnValue(of(true));
        communicationServiceSpy.checkQuizVisibility.and.returnValue(of(true));
        component.checkCanProceed(visibleQuizMock[0]);
        expect(connectSpy).toHaveBeenCalled();

        spyOn(component['socketClientService'], 'send').and.callFake((event, quizId, callback) => {
            expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`/waiting/game/${quizId}/room/${callback}/host`);
        });
    });

    it('should navigate to test game page if quiz is available and visible', () => {
        communicationServiceSpy.checkQuizAvailability.and.returnValue(of(true));
        communicationServiceSpy.checkQuizVisibility.and.returnValue(of(true));
        component.checkCanProceed(visibleQuizMock[0], true);

        expect(communicationServiceSpy.checkQuizAvailability).toHaveBeenCalled();
        expect(communicationServiceSpy.checkQuizVisibility).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledOnceWith(`game/${visibleQuizMock[0].id}/test`);
    });

    it('should display popup if quiz is hidden', () => {
        communicationServiceSpy.checkQuizAvailability.and.returnValue(of(true));
        communicationServiceSpy.checkQuizVisibility.and.returnValue(of(false));
        const hiddenPopUpSpy = spyOn(component, 'openHiddenPopUp').and.callThrough();
        component.checkCanProceed(hiddenQuizMock[0]);

        expect(communicationServiceSpy.checkQuizAvailability).toHaveBeenCalled();
        expect(communicationServiceSpy.checkQuizVisibility).toHaveBeenCalled();
        expect(hiddenPopUpSpy).toHaveBeenCalled();
    });

    it('should display popup if quiz is deleted', () => {
        communicationServiceSpy.checkQuizAvailability.and.returnValue(of(false));
        communicationServiceSpy.checkQuizVisibility.and.returnValue(of(false));
        const isUnavailableSpy = spyOn(component, 'openUnavailablePopUp').and.callThrough();
        component.checkCanProceed(hiddenQuizMock[0]);

        expect(communicationServiceSpy.checkQuizAvailability).toHaveBeenCalled();
        expect(communicationServiceSpy.checkQuizVisibility).not.toHaveBeenCalled();
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
        component.openHiddenPopUp();

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

        component.openHiddenPopUp();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });
});
