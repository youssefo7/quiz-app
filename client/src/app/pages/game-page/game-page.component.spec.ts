import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { CountdownComponent } from '@app/components/countdown/countdown.component';
import { ProfileComponent } from '@app/components/profile/profile.component';
import { QuestionZoneComponent } from '@app/components/question-zone/question-zone.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { GameService } from '@app/services/game.service';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent in test game route', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
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
            declarations: [GamePageComponent, TopBarComponent, CountdownComponent, QuestionZoneComponent, ProfileComponent, ChatComponent],
            imports: [MatIconModule, HttpClientModule],
            providers: [{ provide: ActivatedRoute, useValue: { snapshot: { url: [{ path: '' }] } } }],
        }).compileComponents();

        router = TestBed.inject(Router);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
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
});
