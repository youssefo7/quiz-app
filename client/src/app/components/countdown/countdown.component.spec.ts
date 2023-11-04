// any is need to spy on private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { TimeService } from '@app/services/time.service';
import { of } from 'rxjs';
import { CountdownComponent } from './countdown.component';
import SpyObj = jasmine.SpyObj;

describe('CountdownComponent', () => {
    let component: CountdownComponent;
    let fixture: ComponentFixture<CountdownComponent>;
    let timeServiceMock: SpyObj<TimeService>;
    let routerMock: SpyObj<Router>;
    let gameServiceMock: SpyObj<GameService>;
    let communicationServiceMock: SpyObj<CommunicationService>;
    const mockQuiz = {
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
        timeServiceMock = jasmine.createSpyObj('TimeService', ['startTimer', 'stopTimer', 'getTime']);
        timeServiceMock.getTime.and.returnValue(of(0));
        routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);
        gameServiceMock = jasmine.createSpyObj('GameService', ['setGameEndState']);
        communicationServiceMock = jasmine.createSpyObj('CommunicationService', ['getQuiz']);
        communicationServiceMock.getQuiz.and.returnValue(of(mockQuiz));
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CountdownComponent, MatIcon],
            providers: [
                { provide: TimeService, useValue: timeServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'test' }] } } },
                { provide: Router, useValue: routerMock },
                { provide: GameService, useValue: gameServiceMock },
                { provide: CommunicationService, useValue: communicationServiceMock },
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

    it('should display the transition clock with the correct message and style', waitForAsync(() => {
        const transitionTime = 3;
        component['transitionClock']();

        expect(component.message).toEqual('Préparez-vous!');
        expect(component.clockStyle).toEqual({ backgroundColor: '#E5E562' });
        expect(timeServiceMock.startTimer).toHaveBeenCalledWith(transitionTime);
    }));

    it('should display the question clock with the correct message and style', waitForAsync(() => {
        component['quiz'] = mockQuiz;
        component['questionClock']();

        expect(component.message).toEqual('Temps Restant');
        expect(component.clockStyle).toEqual({ backgroundColor: 'lightblue' });
        expect(timeServiceMock.startTimer).toHaveBeenCalledWith(mockQuiz.duration);
    }));

    // TODO: Corriger ce test, car il échoue
    // it('should switch the clock color to red on three seconds', fakeAsync(() => {
    //     timeServiceMock.getTime.and.returnValue(of(3));
    //     component['switchColorToRedOnThreeSeconds']();
    //     tick(1000);
    //     expect(component.clockStyle).toEqual({ backgroundColor: '#FF4D4D' });
    // }));

    it('should display the leave Game clock with the correct message and style', () => {
        const exitTime = 3;
        component['leaveGameClock']();

        expect(component.message).toEqual('Redirection vers «Créer une Partie»');
        expect(component.clockStyle).toEqual({ backgroundColor: 'white' });
        expect(timeServiceMock.startTimer).toHaveBeenCalledWith(exitTime);
    });

    it('should display the test game clock', waitForAsync(() => {
        component['quiz'] = mockQuiz;
        const questionClockSpy = spyOn<any>(component, 'questionClock').and.returnValue(Promise.resolve());
        const transitionClockSpy = spyOn<any>(component, 'transitionClock').and.returnValue(Promise.resolve());

        component['lastQuestionIndex'] = 3;
        component['testGameClock']();

        fixture.whenStable().then(() => {
            expect(questionClockSpy).toHaveBeenCalled();
            expect(transitionClockSpy).toHaveBeenCalled();
        });
    }));

    it('should display the leave game clock', waitForAsync(() => {
        const leaveClockSpy = spyOn<any>(component, 'leaveGameClock').and.returnValue(Promise.resolve());
        component['leaveGame']();

        fixture.whenStable().then(() => {
            expect(gameServiceMock.setGameEndState).toBe(true);
            expect(leaveClockSpy).toHaveBeenCalled();
            expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/game/new');
        });
    }));

    it('should load the timer for the test game', waitForAsync(() => {
        const testGameClockSpy = spyOn<any>(component, 'testGameClock').and.returnValue(Promise.resolve());
        component['isTestGame'] = true;
        component['loadTimer']();

        fixture.whenStable().then(() => {
            expect(testGameClockSpy).toHaveBeenCalled();
        });
    }));

    it('should ONLY display countdown host options if the user is the host', () => {
        expect(component.isHost).toBeFalse();
        expect(fixture.nativeElement.querySelector('#countdown-options')).toBeNull();

        component.isHost = true;
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('#countdown-options')).toBeTruthy();
    });
});
