import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { CountdownComponent } from '@app/components/countdown/countdown.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { ProfileComponent } from '@app/components/profile/profile.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { of } from 'rxjs';
import { HostGamePageComponent } from './host-game-page.component';
import SpyObj = jasmine.SpyObj;

describe('HostGamePageComponent', () => {
    let component: HostGamePageComponent;
    let fixture: ComponentFixture<HostGamePageComponent>;
    let communicationServiceMock: SpyObj<CommunicationService>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    let gameService: GameService;
    let router: Router;
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
        communicationServiceMock = jasmine.createSpyObj('CommunicationService', ['getQuiz']);
        communicationServiceMock.getQuiz.and.returnValue(of(mockedQuiz));
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef<PopupMessageComponent>', ['componentInstance']);
        mockDialog.open.and.returnValue(mockDialogRef);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [HostGamePageComponent, TopBarComponent, CountdownComponent, ProfileComponent, ChatComponent, MatIcon],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'host' }] } } },
                { provide: CommunicationService, useValue: communicationServiceMock },
                { provide: MatDialog, useValue: mockDialog },
                { provide: MatDialogRef, useValue: mockDialogRef },
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
        component.getQuiz();
        expect(getQuizByIdSpy).toHaveBeenCalledWith(mockedQuiz.id);
    });

    it('clicking the exit icon should redirect to "game/new" page', () => {
        const navigateSpy = spyOn(router, 'navigateByUrl');
        component.leaveGamePage();
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