// On a besoin du any pour espionner sur les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { GameEvents } from '@app/events/game.events';
import { TimeEvents } from '@app/events/time.events';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { CountdownComponent } from './countdown.component';
import SpyObj = jasmine.SpyObj;

class MockSocketClientService extends SocketClientService {
    override connect() {
        // vide
    }
}

describe('CountdownComponent', () => {
    let component: CountdownComponent;
    let fixture: ComponentFixture<CountdownComponent>;
    let timeServiceMock: SpyObj<TimeService>;
    let routerMock: SpyObj<Router>;
    let gameServiceMock: SpyObj<GameService>;
    let socketClientServiceMock: MockSocketClientService;
    let socketHelper: SocketTestHelper;

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
        gameServiceMock = jasmine.createSpyObj('GameService', ['setGameEndState', 'getQuizById']);
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'connect', 'disconnect', 'socketExists', 'send']);
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new MockSocketClientService();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [CountdownComponent, MatIcon],
            providers: [
                { provide: TimeService, useValue: timeServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'test' }] } } },
                { provide: Router, useValue: routerMock },
                { provide: GameService, useValue: gameServiceMock },
                { provide: SocketClientService, useValue: socketClientServiceMock },
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

    it('should call switch setColorToRed if timer has 3 seconds remaining or less', waitForAsync(() => {
        const setClockColorToRedSpy = spyOn<any>(component, 'setClockColorToRed').and.callThrough();
        component['switchColorToRedOnThreeSeconds']();
        component['isQuestionTransitioning'] = false;
        expect(timeServiceMock.getTime).toHaveBeenCalled();
        expect(setClockColorToRedSpy).toHaveBeenCalled();
    }));

    it('should switch the clock color to red on three seconds', waitForAsync(() => {
        const switchToRedTime = 3;
        const currentTime = 2;
        component['isQuestionTransitioning'] = false;
        component['setClockColorToRed'](currentTime, switchToRedTime);
        expect(component.clockStyle).toEqual({ backgroundColor: '#FF4D4D' });
    }));

    it('should display the leave Game clock with the correct message and style', waitForAsync(() => {
        const exitTime = 3;
        component['leaveGameClock']();

        expect(component.message).toEqual('Redirection vers «Créer une Partie»');
        expect(component.clockStyle).toEqual({ backgroundColor: 'white' });
        expect(timeServiceMock.startTimer).toHaveBeenCalledWith(exitTime);
    }));

    it('should display the test game clock', waitForAsync(() => {
        component['quiz'] = mockQuiz;
        const questionClockSpy = spyOn<any>(component, 'questionClock').and.returnValue(Promise.resolve());
        const transitionClockSpy = spyOn<any>(component, 'transitionClock').and.returnValue(Promise.resolve());

        component['lastQuestionIndex'] = 3;
        component['isTestGame'] = true;
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
        component.quiz = mockQuiz;
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

    it('should start socket timer to 3s with transitionClock', () => {
        const roomId = '123';
        const transitionTime = 3;
        const oneSecondInterval = 1000;
        component['isTestGame'] = false;
        component['roomId'] = roomId;
        const sendSpy = spyOn(component['socketClientService'], 'send');
        component['transitionClock']();

        expect(sendSpy).toHaveBeenCalledWith(TimeEvents.StartTimer, { initialTime: transitionTime, roomId, tickRate: oneSecondInterval });
    });

    it('should react to socket current timer event and update timer color', waitForAsync(() => {
        const time = 15;
        component['isTestGame'] = false;
        const setClockColorToRedSpy = spyOn<any>(component, 'setClockColorToRed');

        component['reactToTimerEvent']();
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer, time);
        expect(component['socketTime']).toEqual(time);
        expect(setClockColorToRedSpy).toHaveBeenCalled();
    }));

    it('should react to socket timer finished event and start next question when finished transition clock', () => {
        const initialQuestionIndex = 0;
        const questionClockSpy = spyOn<any>(component, 'questionClock');
        component['hasFinishedTransitionClock'] = true;
        component['currentQuestionIndex'] = initialQuestionIndex;

        component['reactToTimerFinishedEvent']();
        socketHelper.peerSideEmit(TimeEvents.TimerFinished);
        expect(component['currentQuestionIndex']).toEqual(initialQuestionIndex + 1);
        expect(component['hasFinishedTransitionClock']).toBeFalse();
        expect(questionClockSpy).toHaveBeenCalled();
    });

    it('should react to socket timer finished event and emit transition clock finished when host', () => {
        const roomId = '123';
        component['hasFinishedTransitionClock'] = true;
        component['roomId'] = roomId;
        component['isHost'] = true;
        const sendSpy = spyOn(component['socketClientService'], 'send');

        component['reactToTimerFinishedEvent']();
        socketHelper.peerSideEmit(TimeEvents.TimerFinished);
        expect(sendSpy).toHaveBeenCalledWith(TimeEvents.TransitionClockFinished, roomId);
    });

    it('should set time to 0 when getting timer interrupted event', () => {
        component['socketTime'] = 15;

        component['reactToTimerInterruptedEvent']();
        socketHelper.peerSideEmit(TimeEvents.TimerInterrupted);
        expect(component['socketTime']).toEqual(0);
    });

    it('should start transition clock prepare next question when getting next question event', () => {
        component['currentQuestionIndex'] = 0;
        component['lastQuestionIndex'] = 3;
        const transitionClockSpy = spyOn<any>(component, 'transitionClock');

        component['reactToNextQuestionEvent']();
        socketHelper.peerSideEmit(GameEvents.NextQuestion);
        expect(component['hasFinishedTransitionClock']).toBeTrue();
        expect(transitionClockSpy).toHaveBeenCalled();
    });
});
