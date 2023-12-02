// any nécessaire pour espionner les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { ResultChartComponent } from '@app/components/result-chart/result-chart.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { Quiz } from '@app/interfaces/quiz';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { HistoryCommunicationService } from '@app/services/history-communication.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { ResultsPageComponent } from './results-page.component';

describe('ResultsPageComponent', () => {
    let component: ResultsPageComponent;
    let fixture: ComponentFixture<ResultsPageComponent>;
    let clientSocketServiceMock: jasmine.SpyObj<SocketClientService>;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;
    let historyCommunicationServiceMock: jasmine.SpyObj<HistoryCommunicationService>;
    let chartManagerServiceMock: jasmine.SpyObj<ChartDataManagerService>;
    let routerMock: jasmine.SpyObj<Router>;

    const roomIdMock = '123';

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists', 'connect', 'disconnect', 'send']);
        clientSocketServiceMock.socketExists.and.returnValue(true);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers', 'getRoomQuiz']);
        roomCommunicationServiceMock.getRoomQuiz.and.returnValue(of({} as Quiz));
        chartManagerServiceMock = jasmine.createSpyObj('ChartDataManagerService', ['resetChartData']);
        routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);
        Object.defineProperty(routerMock, 'url', { value: '' });

        TestBed.configureTestingModule({
            declarations: [
                ResultsPageComponent,
                GamePlayersListComponent,
                MatIcon,
                TopBarComponent,
                ChatComponent,
                ResultChartComponent,
                HistogramComponent,
            ],
            imports: [FormsModule, NgChartsModule],
            providers: [
                {
                    provide: SocketClientService,
                    useValue: clientSocketServiceMock,
                },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
                { provide: HistoryCommunicationService, useValue: historyCommunicationServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'results' }] } } },
                { provide: ChartDataManagerService, useValue: chartManagerServiceMock },
                { provide: Router, useValue: routerMock },
            ],
        });

        fixture = TestBed.createComponent(ResultsPageComponent);
        component = fixture.componentInstance;
        component.roomId = roomIdMock;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call handleNavigation() on beforeUnloadHandler', () => {
        const handleNavigationSpy = spyOn<any>(component, 'handleNavigation');
        component.beforeUnloadHandler();
        expect(handleNavigationSpy).toHaveBeenCalled();
    });

    it('should send EndGame event, reset charts and disconnect on handleNavigation() if user is host', () => {
        component['isHost'] = true;
        component['handleNavigation']();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.EndGame, { roomId: roomIdMock, gameAborted: false });
        expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
        expect(chartManagerServiceMock.resetChartData).toHaveBeenCalled();
    });

    it('should send PlayerLeaveGame event, reset charts and disconnect on handleNavigation() if user is not host', () => {
        component['isHost'] = false;
        component['handleNavigation']();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.PlayerLeaveGame, { roomId: roomIdMock, isInGame: false });
        expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
        expect(chartManagerServiceMock.resetChartData).toHaveBeenCalled();
    });

    it('should connect user and send EndGame event if user is host and then disconnect', async () => {
        let socketExists = false;
        clientSocketServiceMock.socketExists.and.callFake(() => socketExists);
        clientSocketServiceMock.connect.and.callFake(() => {
            socketExists = true;
        });

        component['isHost'] = true;
        await component.ngOnInit();

        expect(clientSocketServiceMock.connect).toHaveBeenCalled();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.EndGame, { roomId: roomIdMock, gameAborted: false });
        expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
        expect(routerMock.navigateByUrl).toHaveBeenCalledWith('home/');
    });

    it('should connect user and send PlayerLeaveGame event if user is not host and then disconnect', async () => {
        let socketExists = false;
        clientSocketServiceMock.socketExists.and.callFake(() => socketExists);
        clientSocketServiceMock.connect.and.callFake(() => {
            socketExists = true;
        });

        component['isHost'] = false;
        await component.ngOnInit();

        expect(clientSocketServiceMock.connect).toHaveBeenCalled();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.PlayerLeaveGame, { roomId: roomIdMock, isInGame: false });
        expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
        expect(routerMock.navigateByUrl).toHaveBeenCalledWith('home/');
    });

    it('should get room quiz', async () => {
        clientSocketServiceMock.socketExists.and.callFake(() => true);
        await component.ngOnInit();
        expect(roomCommunicationServiceMock.getRoomQuiz).toHaveBeenCalledWith(roomIdMock);
    });

    it('should change the title of the toggleButton depending of the value of shouldHideResults', () => {
        component.shouldHideResults = false;
        component.toggleResultsDisplay();
        expect(component.titleToggleButton).toEqual('Afficher le scores finales des joueurs');
        component.shouldHideResults = true;
        component.toggleResultsDisplay();
        expect(component.titleToggleButton).toEqual('Afficher les statistiques de la partie');
    });

    it('should change the title of the page depending of the value of shouldHideResults', () => {
        component.shouldHideResults = false;
        component.toggleResultsDisplay();
        expect(component.pageTitle).toEqual('Statistiques de la partie');
        component.shouldHideResults = true;
        component.toggleResultsDisplay();
        expect(component.pageTitle).toEqual('Score des joueurs');
    });
});
