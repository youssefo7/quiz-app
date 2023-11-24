// On a besoin du any pour espionner sur les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { Constants, QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { CountdownComponent } from './countdown.component';
import SpyObj = jasmine.SpyObj;

class MockSocketClientService extends SocketClientService {
    private mockSocketExists = true;

    override connect() {
        // vide
    }

    override socketExists() {
        return this.mockSocketExists;
    }

    setSocketExists(value: boolean) {
        this.mockSocketExists = value;
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
                type: 'QRL',
                text: "Expliquez l'utilisé des spy dans les tests ? ",
                points: 80,
            },
        ],
    };

    const roomId = '123';

    beforeEach(() => {
        timeServiceMock = jasmine.createSpyObj('TimeService', ['startTimer', 'stopTimer', 'getTime']);
        timeServiceMock.getTime.and.returnValue(of(0));
        routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);
        gameServiceMock = jasmine.createSpyObj('GameService', ['setGameEndState', 'getQuizById']);
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists']);
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
        component['quiz'] = mockQuiz;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return the time for test game and normal game mode when get time() is called', () => {
        component['isTestGame'] = true;
        const timeInTestGame = component.time;
        const timeServiceValue = component['timeService'].time;
        expect(timeInTestGame).toEqual(timeServiceValue);

        component['isTestGame'] = false;
        const timeNotInTestGame = component.time;
        const socketTimeValue = component['socketTime'];
        expect(timeNotInTestGame).toEqual(socketTimeValue);
    });

    it('should not load timer if socket does not exist and the game is not a test game', async () => {
        const loadTimerSpy = spyOn<any>(component, 'loadTimer');
        socketClientServiceMock.setSocketExists(false);
        component['isTestGame'] = false;

        await component.ngOnInit();
        expect(loadTimerSpy).not.toHaveBeenCalled();
    });

    it('should unsubscribe from timer when ngOnDestroy() is called', () => {
        const timerSpy = spyOn<any>(component['timerSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(timerSpy).toHaveBeenCalled();
    });

    it('should display the question transitioning timer with the correct message and style', waitForAsync(() => {
        const transitionTime = 3;
        component['transitionClock']();

        expect(component.message).toEqual('Préparez-vous!');
        expect(component.clockStyle).toEqual({ backgroundColor: '#E5E562' });
        expect(timeServiceMock.startTimer).toHaveBeenCalledWith(transitionTime);
    }));

    it('should display the question clock with the correct message and style', waitForAsync(() => {
        component['questionClock']();
        expect(component.message).toEqual('Temps Restant');
        expect(component.clockStyle).toEqual({ backgroundColor: 'lightblue' });
        expect(timeServiceMock.startTimer).toHaveBeenCalledWith(mockQuiz.duration);
    }));

    it('should call switch setColorToRed if timer has 3 seconds remaining or less', waitForAsync(() => {
        const setClockColorToRedSpy = spyOn<any>(component, 'setClockColorToRed').and.callThrough();
        component['switchColorToRedOnThreeSeconds']();
        component.isQuestionTransitioning = false;
        expect(timeServiceMock.getTime).toHaveBeenCalled();
        expect(setClockColorToRedSpy).toHaveBeenCalled();
    }));

    it('should return the correct minimum panic time depending on the type of question', () => {
        component['currentQuestionIndex'] = 0;
        const questionTypeQCM = component['quiz'].questions[0].type;
        const minTimeQCM = component['getMinPanicTime']();

        expect(questionTypeQCM).toBe(QTypes.QCM);
        expect(minTimeQCM).toEqual(Constants.MIN_TIME_TO_PANIC_QCM);

        component['currentQuestionIndex'] = 1;
        const questionTypeQRL = component['quiz'].questions[1].type;
        const minTimeQRL = component['getMinPanicTime']();

        expect(questionTypeQRL).toBe(QTypes.QRL);
        expect(minTimeQRL).toEqual(Constants.MIN_TIME_TO_PANIC_QRL);
    });

    it('should switch the clock color to red when three seconds left on the timer', waitForAsync(() => {
        const switchToRedTime = 3;
        const currentTime = 2;
        component.isQuestionTransitioning = false;
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

    it('should display the test game clock when testing a game', waitForAsync(() => {
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

    it('should load the timer for a test game', waitForAsync(() => {
        const testGameClockSpy = spyOn<any>(component, 'testGameClock').and.returnValue(Promise.resolve());
        component.quiz = mockQuiz;
        component['isTestGame'] = true;
        component['loadTimer']();
        fixture.whenStable().then(() => {
            expect(testGameClockSpy).toHaveBeenCalled();
        });
    }));

    it('should ONLY display countdown host options if the user is the host of a game', () => {
        component.isHost = false;
        expect(fixture.nativeElement.querySelector('#countdown-options')).toBeNull();

        component.isHost = true;
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('#countdown-options')).toBeTruthy();
    });

    it('should set socket events and start currentQuestionIndex at 0', () => {
        const reactToTimerEventSpy = spyOn<any>(component, 'reactToTimerEvent');
        const reactToTimerFinishedEventSpy = spyOn<any>(component, 'reactToTimerFinishedEvent');
        const reactToNextQuestionEvent = spyOn<any>(component, 'reactToNextQuestionEvent');
        const reactToTimerInterruptedEvent = spyOn<any>(component, 'reactToTimerInterruptedEvent');
        const questionClockSpy = spyOn<any>(component, 'questionClock');
        component['isTestGame'] = false;

        component['loadTimer']();
        expect(reactToTimerEventSpy).toHaveBeenCalled();
        expect(reactToTimerFinishedEventSpy).toHaveBeenCalled();
        expect(reactToNextQuestionEvent).toHaveBeenCalled();
        expect(reactToTimerInterruptedEvent).toHaveBeenCalled();
        expect(questionClockSpy).toHaveBeenCalled();
        expect(component['currentQuestionIndex']).toEqual(0);
    });

    it('should send StartTimer event with 3 seconds during question transitions in non-test game', () => {
        const transitionTime = 3;
        const oneSecondInterval = 1000;
        component['isTestGame'] = false;
        component['roomId'] = roomId;
        const sendSpy = spyOn(component['socketClientService'], 'send');
        component['transitionClock']();
        expect(sendSpy).toHaveBeenCalledWith(TimeEvents.StartTimer, { initialTime: transitionTime, roomId, tickRate: oneSecondInterval });
    });

    it('should listen on CurrentTimer event and set canTogglePanicMode to false when there is less than the minimum panic time left', () => {
        const time = 3;
        component['isTestGame'] = false;
        component['reactToTimerEvent']();
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer, time);
        expect(component['socketTime']).toEqual(time);
        expect(component['canTogglePanicMode']).toBeFalsy();
    });

    it('should listen on CurrentTimer event and set canTogglePanicMode to false when there is no time left', () => {
        const time = 0;
        component['isTestGame'] = false;

        component['reactToTimerEvent']();
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer, time);
        expect(component['socketTime']).toEqual(time);
        expect(component['canTogglePanicMode']).toBeFalsy();
    });

    it('should react to CurrentTimer event and update the timer color when there is more time left than the minimum panic time', waitForAsync(() => {
        const time = 15;
        component['isTestGame'] = false;
        const setClockColorToRedSpy = spyOn<any>(component, 'setClockColorToRed');

        component['reactToTimerEvent']();
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer, time);
        expect(component['socketTime']).toEqual(time);
        expect(setClockColorToRedSpy).toHaveBeenCalled();
    }));

    it('should react to TimerFinished event and start next question when the transitioning timer has ended', () => {
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

    it('should send TransitionClockFinished event when TimerFinished event is received and is game host', () => {
        component['hasFinishedTransitionClock'] = true;
        component['roomId'] = roomId;
        component['isHost'] = true;
        const sendSpy = spyOn(component['socketClientService'], 'send');

        component['reactToTimerFinishedEvent']();
        socketHelper.peerSideEmit(TimeEvents.TimerFinished);
        expect(sendSpy).toHaveBeenCalledWith(TimeEvents.TransitionClockFinished, roomId);
    });

    it('should set time to 0 when listening to the TimerInterrupted event', () => {
        component['socketTime'] = 15;
        component['reactToTimerInterruptedEvent']();
        socketHelper.peerSideEmit(TimeEvents.TimerInterrupted);
        expect(component['socketTime']).toEqual(0);
    });

    it('should listen on NextQuestion event and prepare the transition clock when the event is received', () => {
        component['currentQuestionIndex'] = 0;
        component['lastQuestionIndex'] = 3;
        const transitionClockSpy = spyOn<any>(component, 'transitionClock');

        component['reactToNextQuestionEvent']();
        socketHelper.peerSideEmit(GameEvents.NextQuestion);
        expect(component['hasFinishedTransitionClock']).toBeTrue();
        expect(transitionClockSpy).toHaveBeenCalled();
    });

    it('should send StartTimer event when a new question has begun', () => {
        const oneSecondInterval = 1000;
        component['roomId'] = roomId;
        component['isTestGame'] = false;
        const sendSpy = spyOn(component['socketClientService'], 'send');
        component['questionClock']();
        expect(sendSpy).toHaveBeenCalledWith(TimeEvents.StartTimer, { initialTime: mockQuiz.duration, roomId, tickRate: oneSecondInterval });
    });

    it('should toggle timer', () => {
        const sendSpy = spyOn(component['socketClientService'], 'send');
        component.isPaused = false;
        component.toggleTimer();
        expect(component.isPaused).toBeTruthy();
        expect(sendSpy).toHaveBeenCalled();

        component.isPaused = true;
        component.toggleTimer();
        expect(component.isPaused).toBeFalsy();
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should trigger a panic mode', () => {
        const spyPlay = spyOn(component['panicAudio'], 'play');
        component.panicMode();

        expect(component.isInPanicMode).toBeTruthy();
        expect(component.canTogglePanicMode).toBeFalsy();
        expect(spyPlay).toHaveBeenCalled();
    });
});
