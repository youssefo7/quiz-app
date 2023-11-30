// any est nécessaire pour espionner les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CountdownComponent } from '@app/components/countdown/countdown.component';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { ProfileComponent } from '@app/components/profile/profile.component';
import { QuestionZoneStatsComponent } from '@app/components/question-zone-stats/question-zone-stats.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { HostGamePageComponent } from './host-game-page.component';
import SpyObj = jasmine.SpyObj;

// La raison du lint disable est que le code vient d'un exemple de stub du professeur et le connect est vide dans l'exemple qu'il utilise.
@Component({
    selector: 'app-chat',
    template: '<p>Template Needed</p>',
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class ChatComponentStub {}

describe('HostGamePageComponent', () => {
    let component: HostGamePageComponent;
    let fixture: ComponentFixture<HostGamePageComponent>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    let router: Router;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;
    let clientSocketServiceMock: jasmine.SpyObj<SocketClientService>;

    const mockedQuiz = {
        id: '123',
        title: 'Test quiz',
        description: 'Test quiz description',
        visibility: true,
        duration: 60,
        lastModification: '2018-11-13T20:20:39+00:00',
        questions: [],
    };

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists', 'connect', 'disconnect', 'send']);
        clientSocketServiceMock.socketExists.and.returnValue(true);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers', 'getRoomQuiz']);
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(
            of([
                /* liste mock de joueur d'une salle */
            ]),
        );
        roomCommunicationServiceMock.getRoomQuiz.and.returnValue(of(mockedQuiz));
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef<PopupMessageComponent>', ['componentInstance']);
        mockDialog.open.and.returnValue(mockDialogRef);
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
            imports: [NgChartsModule, RouterTestingModule.withRoutes([{ path: 'home/', component: MainPageComponent }])],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'host' }] } } },
                { provide: MatDialog, useValue: mockDialog },
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
                { provide: SocketClientService, useValue: clientSocketServiceMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(HostGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router = TestBed.inject(Router);
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch the quiz of a given game', () => {
        component['getQuiz']();
        expect(roomCommunicationServiceMock.getRoomQuiz).toHaveBeenCalledWith(mockedQuiz.id);
    });

    it('should call handleNavigation on beforeunload', () => {
        const handleNavigationSpy = spyOn<any>(component, 'handleNavigation');
        component.beforeUnloadHandler();
        expect(handleNavigationSpy).toHaveBeenCalled();
    });

    it('should handle socket connections, events and navigation correctly if user is a host on ngOnInit', async () => {
        let socketExists = false;
        clientSocketServiceMock.socketExists.and.callFake(() => socketExists);
        clientSocketServiceMock.connect.and.callFake(() => {
            socketExists = true;
        });
        // Redirection dans le ngOnInit nécessite de mettre l'appel dans Angular zone pour éviter un avertissement
        await fixture.ngZone?.run(async () => component.ngOnInit());

        expect(clientSocketServiceMock.connect).toHaveBeenCalled();
        expect(clientSocketServiceMock.send).toHaveBeenCalled();
        expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
    });

    it('should redirect to "/game/new" page when clicking the exit icon', () => {
        const navigateSpy = spyOn(router, 'navigateByUrl');
        component['leaveGamePage']();
        expect(navigateSpy).toHaveBeenCalledWith('/game/new');
    });

    it('should display a message when the user tries to exit a game with the correct configuration', () => {
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
