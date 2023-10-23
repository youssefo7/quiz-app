import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { CountdownComponent } from '@app/components/countdown/countdown.component';
import { ProfileComponent } from '@app/components/profile/profile.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { of } from 'rxjs';
import { HostGamePageComponent } from './host-game-page.component';
import SpyObj = jasmine.SpyObj;

describe('HostGamePageComponent', () => {
    let component: HostGamePageComponent;
    let fixture: ComponentFixture<HostGamePageComponent>;
    let communicationServiceMock: SpyObj<CommunicationService>;
    let gameService: GameService;
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
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [HostGamePageComponent, TopBarComponent, CountdownComponent, ProfileComponent, ChatComponent, MatIcon],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'host' }] } } },
                { provide: CommunicationService, useValue: communicationServiceMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(HostGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        gameService = TestBed.inject(GameService);
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch the quiz ', () => {
        const id = '123';
        const getQuizByIdSpy = spyOn(gameService, 'getQuizById');
        component.getQuiz();
        expect(getQuizByIdSpy).toHaveBeenCalledWith(id);
    });
});
