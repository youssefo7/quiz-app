import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { TimeService } from '@app/services/time.service';
import { CountdownComponent } from './countdown.component';
import SpyObj = jasmine.SpyObj;

describe('CountdownComponent', () => {
    let component: CountdownComponent;
    let fixture: ComponentFixture<CountdownComponent>;
    let timeServiceSpy: SpyObj<TimeService>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let routerSpy: SpyObj<Router>;
    let gameServiceSpy: SpyObj<GameService>;

    const quizzMock = {
        $schema: 'quiz-schema.json',
        id: '123',
        title: 'mock quiz',
        duration: 60,
        lastModification: '2018-11-13T20:20:39+00:00',
        visibility: true,
        description: 'mock quiz description',
        questions: [
            {
                type: 'QCM',
                text: 'Parmi les mots suivants, lesquels sont des mots clés réservés en JS?',
                points: 40,
                choices: [],
            },
            {
                type: 'QCM',
                text: 'En quelle année Javascript fut créé? ',
                points: 60,
                choices: [],
            },
        ],
    };

    beforeEach(() => {
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['startTimer', 'stopTimer']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['setGameEndState', 'getQuizById']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CountdownComponent],
            providers: [
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'test' }] } } },
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CountdownComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get the quiz ', waitForAsync(() => {
        const id = '123';
        component.getQuiz();
        gameServiceSpy.getQuizById.and.returnValue(Promise.resolve(quizzMock));
        expect(gameServiceSpy.getQuizById).toHaveBeenCalledWith(id);
    }));

    it('should display the transition clock with the correct message and style', waitForAsync(() => {
        const transitionTime = 3;
        component.transitionClock();

        expect(component.message).toEqual('Préparez-vous!');
        expect(component.clockStyle).toEqual({ backgroundColor: '#E5E562' });
        expect(timeServiceSpy.startTimer).toHaveBeenCalledWith(transitionTime);
    }));

    it('should display the question clock with the correct message and style', waitForAsync(() => {
        component.quiz = quizzMock;
        component.questionClock();

        expect(component.message).toEqual('Temps Restant');
        expect(component.clockStyle).toEqual({ backgroundColor: 'lightblue' });
        expect(timeServiceSpy.startTimer).toHaveBeenCalledWith(quizzMock.duration);
    }));

    it('should display the leave Game clock with the correct message and style', waitForAsync(() => {
        const exitTime = 3;
        component.leaveGameClock();

        expect(component.message).toEqual('Redirection vers «Créer une Partie»');
        expect(component.clockStyle).toEqual({ backgroundColor: 'white' });
        expect(timeServiceSpy.startTimer).toHaveBeenCalledWith(exitTime);
    }));

    it('should display the game clock', waitForAsync(() => {
        component.quiz = quizzMock;
        const questionClockSpy = spyOn(component, 'questionClock').and.returnValue(Promise.resolve());
        const transitionClockSpy = spyOn(component, 'transitionClock').and.returnValue(Promise.resolve());
        const leaveSpy = spyOn(component, 'leaveGame').and.callThrough();
        component.gameClock();

        fixture.whenStable().then(() => {
            expect(questionClockSpy).toHaveBeenCalled();
            expect(transitionClockSpy).toHaveBeenCalled();
            expect(leaveSpy).toHaveBeenCalled();
        });
    }));

    it('should display the leave game clock', waitForAsync(() => {
        const leaveClockSpy = spyOn(component, 'leaveGameClock').and.returnValue(Promise.resolve());
        component.leaveGame();

        fixture.whenStable().then(() => {
            expect(gameServiceSpy.setGameEndState).toBe(true);
            expect(leaveClockSpy).toHaveBeenCalled();
            expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/game/new');
        });
    }));

    it('should load the timer', waitForAsync(() => {
        const getQuizSpy = spyOn(component, 'getQuiz').and.returnValue(Promise.resolve());
        const gameClockSpy = spyOn(component, 'gameClock').and.returnValue(Promise.resolve());
        component.loadTimer();

        fixture.whenStable().then(() => {
            expect(getQuizSpy).toHaveBeenCalled();
            expect(gameClockSpy).toHaveBeenCalled();
        });
    }));
});
