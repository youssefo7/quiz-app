import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ResultsPageComponent } from './results-page.component';

describe('ResultsPageComponent', () => {
    let component: ResultsPageComponent;
    let fixture: ComponentFixture<ResultsPageComponent>;
    let clientSocketServiceMock: jasmine.SpyObj<SocketClientService>;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;

    beforeEach(() => {
        const mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
        mockRouter.navigateByUrl.and.returnValue(Promise.resolve(true));
        Object.defineProperty(mockRouter, 'url', { get: () => '/host' });
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists', 'connect', 'disconnect', 'send']);
        clientSocketServiceMock.socketExists.and.returnValue(true);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers']);
        TestBed.configureTestingModule({
            declarations: [ResultsPageComponent, GamePlayersListComponent, MatIcon, TopBarComponent, ChatComponent],
            imports: [FormsModule],
            providers: [
                {
                    provide: SocketClientService,
                    useValue: clientSocketServiceMock,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'results' }] } } },
            ],
        });
        fixture = TestBed.createComponent(ResultsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the component correctly if the user has an active socket or not', async () => {
        clientSocketServiceMock.socketExists.and.returnValue(false);
        await component.ngOnInit();
        expect(clientSocketServiceMock.connect).toHaveBeenCalled();
    });

    it('should call handleNavigation on ngOnDestroy', () => {
        const handleNavigationSpy = spyOn(component, 'handleNavigation');

        component.ngOnDestroy();
        expect(handleNavigationSpy).toHaveBeenCalled();
    });

    it('should call send and disconnect on handleNavigation if it is not the host', () => {
        component.handleNavigation();
        expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
    });
});
