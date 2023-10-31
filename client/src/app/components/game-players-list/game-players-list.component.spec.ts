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

    const response = {
        pointsToAdd: 10,
        name: 'Marc',
    };

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
        component.playersList = playersList;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call "updatePlayerScore" when "addPointsToPlayer" event is received', () => {
        const updatePayerScoreSpy = spyOn(component, 'updatePayerScore');

        const updateScoreCallback = clientSocketService.on.calls.mostRecent().args[1];
        updateScoreCallback(response);

        expect(updatePayerScoreSpy).toHaveBeenCalledWith(response);
    });

    it('should update player status when abandonedGame event is received', () => {
        const playerName = 'Marc';

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
        const newScore = 10;
        const oldScore = 0;

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
