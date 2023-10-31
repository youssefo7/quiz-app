import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerInfo } from '@app/interfaces/player-info';
import { SocketClientService } from '@app/services/socket-client.service';
import { GamePlayersListComponent } from './game-players-list.component';

describe('GamePlayersListComponent', () => {
    let component: GamePlayersListComponent;
    let fixture: ComponentFixture<GamePlayersListComponent>;
    let clientSocketService: jasmine.SpyObj<SocketClientService>;

    const playersList: PlayerInfo[] = [
        { name: 'Marc', hasAbandoned: false, score: 0 },
        { name: 'Liam', hasAbandoned: false, score: 0 },
    ];

    beforeEach(() => {
        clientSocketService = jasmine.createSpyObj('SocketClientService', ['on']);
        TestBed.configureTestingModule({
            declarations: [GamePlayersListComponent],
            providers: [
                {
                    provide: SocketClientService,
                    useValue: clientSocketService,
                },
            ],
        });
        fixture = TestBed.createComponent(GamePlayersListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update player status when abandonedGame event is received', () => {
        const playerName = 'Marc';

        component.playersList = playersList;

        clientSocketService.on.and.callFake((eventName) => {
            if (eventName === 'abandonedGame') {
                component.updatePlayerStatus(playerName);
            }
        });

        clientSocketService.on.calls.reset();
        component.listenToSocketEvents();

        expect(component.playersList[0].hasAbandoned).toBe(true);
        expect(component.playersList[1].hasAbandoned).toBe(false);
    });

    it('should update player status when abandonedGame event is received', () => {
        const response = {
            pointsToAdd: 10,
            name: 'Marc',
        };
        const newScore = 10;
        const oldScore = 0;

        component.playersList = playersList;

        clientSocketService.on.and.callFake((eventName) => {
            if (eventName === 'addPointsToPlayer') {
                component.updatePayerScore(response);
            }
        });

        clientSocketService.on.calls.reset();
        component.listenToSocketEvents();

        expect(component.playersList[0].score).toBe(newScore);
        expect(component.playersList[1].score).toBe(oldScore);
    });
});
