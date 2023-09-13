import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { of } from 'rxjs';
import { LiveGamePageComponent } from './live-game-page.component';

describe('LiveGamePageComponent', () => {
    let component: LiveGamePageComponent;
    let fixture: ComponentFixture<LiveGamePageComponent>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;

    beforeEach(() => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getGame']);
        TestBed.configureTestingModule({
            declarations: [LiveGamePageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: {
                                get: () => '123',
                            },
                        },
                    },
                },
                {
                    provide: CommunicationService,
                    useValue: communicationServiceSpy,
                },
            ],
        });

        fixture = TestBed.createComponent(LiveGamePageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch the game', () => {
        const mockedGame = {
            $schema: 'test.json',
            id: 'test123',
            title: 'Test Game',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            questions: [],
        };
        communicationServiceSpy.getGame.and.returnValue(of(mockedGame));
        component.ngOnInit();

        expect(communicationServiceSpy.getGame).toHaveBeenCalledWith('123');
        expect(component.game).toEqual(mockedGame);
    });
});
