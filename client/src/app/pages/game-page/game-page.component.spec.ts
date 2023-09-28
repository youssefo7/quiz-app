import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { CountdownComponent } from '@app/components/countdown/countdown.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { ProfileComponent } from '@app/components/profile/profile.component';
import { QuestionZoneComponent } from '@app/components/question-zone/question-zone.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { GamePageComponent } from './game-page.component';
import SpyObj = jasmine.SpyObj;
// import { PopupMessageConfig } from '@app/interfaces/popup-message-config';

describe('GamePageComponent in test game route', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let communicationServiceMock: jasmine.SpyObj<CommunicationService>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
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
        mockDialog = jasmine.createSpyObj('mockDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('mockDialogRef', ['componentInstance']);
    let router: Router;
    let gameService: GameService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [GamePageComponent, TopBarComponent, CountdownComponent, QuestionZoneComponent, ProfileComponent, ChatComponent],
            imports: [MatIconModule, HttpClientModule],
            providers: [{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'test' }] } } }],
        }).compileComponents();

        router = TestBed.inject(Router);
        gameService = TestBed.inject(GameService);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set page title to "Partie - Test"', () => {
        expect(component.title).toEqual('Partie - Test');
    });

    it('clicking the exit icon should redirect to "game/new" page', () => {
        const navigateSpy = spyOn(router, 'navigateByUrl');
        const exitClickEvent = new Event('click');
        component.leaveGamePage(exitClickEvent);
        expect(navigateSpy).toHaveBeenCalledWith('/game/new');
    });

    it('should give points to the player', () => {
        const pointsWon = 42;
        component.givePoints(pointsWon);
        expect(component.playerPoints).toEqual(pointsWon);
    });

    it('should fetch the quiz ', fakeAsync(() => {
        const id = '123';
        spyOn(gameService, 'getQuizById').and.returnValue(Promise.resolve(mockedQuiz));
        component.getQuiz();
        tick();

        expect(gameService.getQuizById).toHaveBeenCalledWith(id);
        expect(component.quiz).toEqual(mockedQuiz);
    }));
});
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

describe('GamePageComponent in regular game route', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let router: Router;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [GamePageComponent, TopBarComponent, ProfileComponent, ChatComponent, QuestionZoneComponent, CountdownComponent],
            imports: [MatIconModule, RouterModule, MatDialogModule, HttpClientModule],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceMock },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'game/123/test' }, { path: 'game/123' }] } },
                },
                { provide: MatDialog, useValue: mockDialog },
                { provide: MatDialogRef, useValue: mockDialogRef },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        mockDialog.open.and.returnValue(mockDialogRef);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set page title to "Partie"', () => {
        expect(component.title).toEqual('Partie');
    });

    it('clicking the exit icon should redirect to "/home" page', () => {
        const navigateSpy = spyOn(router, 'navigateByUrl');
        const exitClickEvent = new Event('click');
        component.leaveGamePage(exitClickEvent);
        expect(navigateSpy).toHaveBeenCalledWith('/home');
    });

    it('should popup a message when the user tries to delete a quiz with the correct configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter la partie?',
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

    it('should popup a message when the user tries to delete a quiz with the correct configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter la partie?',
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
