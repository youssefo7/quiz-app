// Ce fichier contient tous les évévements du compte à rebours de la partie
/* eslint-disable max-lines */
// On a besoin du any pour espionner sur les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
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
                text: "Expliquez l'utilité des spy dans les tests ? ",
                points: 80,
            },
        ],
    };

    const roomId = '123';

    beforeEach(() => {
        timeServiceMock = jasmine.createSpyObj('TimeService', ['startTimer', 'getTime', 'isTimerFinished']);
        timeServiceMock.getTime.and.returnValue(of(0));
        timeServiceMock.isTimerFinished.and.returnValue(of(true));
        routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists', 'send']);
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
        component['isTestGame'] = true;
        component['reactToTimerEvents']();
        const timerSpy = spyOn<any>(component['timerSubscription'], 'unsubscribe');
        const timerFinishedSpy = spyOn<any>(component['timerFinishedSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(timerSpy).toHaveBeenCalled();
        expect(timerFinishedSpy).toHaveBeenCalled();
    });

    it('should display the question transitioning timer with the correct message and style', waitForAsync(() => {
        const transitionTime = 3;
        component['isTestGame'] = true;
        component['startTransitionClock']();

        expect(component.message).toEqual('Préparez-vous!');
        expect(component.clockStyle).toEqual({ backgroundColor: '#ffff36' });
        expect(timeServiceMock.startTimer).toHaveBeenCalledWith(transitionTime, true);
    }));

    it('should display the question clock with the correct message, style and questionTime', waitForAsync(() => {
        component['isTestGame'] = true;
        component['startQuestionClock']();
        expect(component.message).toEqual('Temps Restant');
        expect(component.clockStyle).toEqual({ backgroundColor: '' });
        expect(timeServiceMock.startTimer).toHaveBeenCalledWith(mockQuiz.duration, false);
    }));

    it('should call switch setColorToRed if timer has 3 seconds remaining or less', waitForAsync(() => {
        const setClockColorToRedSpy = spyOn<any>(component, 'setClockColorToRed').and.callThrough();
        const switchColorTime = 4;
        const currentTime = 3;
        timeServiceMock.getTime.and.returnValue(of(currentTime));
        component['isTestGame'] = true;
        component['reactToTimerEvents']();
        expect(timeServiceMock.getTime).toHaveBeenCalled();
        expect(setClockColorToRedSpy).toHaveBeenCalledWith(currentTime, switchColorTime);
    }));

    it('should return the correct panic time for QCM questions', () => {
        component['currentQuestionIndex'] = 0;
        component['setPanicTime'](component['currentQuestionIndex']);
        const questionTypeQCM = component['quiz'].questions[0].type;

        expect(component['panicTime']).toBe(Constants.MIN_TIME_TO_PANIC_QCM);
        expect(questionTypeQCM).toBe(QTypes.QCM);
    });

    it('should return the correct panic time for QRL questions', () => {
        component['quiz'] = mockQuiz;
        component['currentQuestionIndex'] = 1;
        component['setPanicTime'](component['currentQuestionIndex']);
        const questionTypeQRL = component['quiz'].questions[1].type;

        expect(questionTypeQRL).toBe(QTypes.QRL);
        expect(component['panicTime']).toBe(Constants.MIN_TIME_TO_PANIC_QRL);
    });

    it('should switch the clock color to red when three seconds left on the timer', waitForAsync(() => {
        const switchToRedTime = 3;
        const currentTime = 2;
        component.isTransitionTimerRunning = false;
        component['setClockColorToRed'](currentTime, switchToRedTime);
        expect(component.clockStyle).toEqual({ backgroundColor: '#FF4D4D' });
    }));

    it('should display the leave Game clock with the correct message and style', waitForAsync(() => {
        const exitTime = 3;
        component['isTestGame'] = true;
        component['leaveGameClock']();

        expect(component.message).toEqual('Redirection vers «Créer une Partie»');
        expect(component.clockStyle).toEqual({ backgroundColor: 'white' });
        expect(timeServiceMock.startTimer).toHaveBeenCalledWith(exitTime, true);
    }));

    it('should display the test game clock when testing a game', waitForAsync(() => {
        const questionClockSpy = spyOn<any>(component, 'startQuestionClock').and.returnValue(Promise.resolve());
        const transitionClockSpy = spyOn<any>(component, 'startTransitionClock').and.returnValue(Promise.resolve());
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
        const reactToTimerEventsSpy = spyOn<any>(component, 'reactToTimerEvents');
        const reactToNextQuestionEvent = spyOn<any>(component, 'reactToNextQuestionEvent');
        const questionClockSpy = spyOn<any>(component, 'startQuestionClock');
        component['isTestGame'] = false;

        component['loadTimer']();
        expect(reactToTimerEventsSpy).toHaveBeenCalled();
        expect(reactToNextQuestionEvent).toHaveBeenCalled();
        expect(questionClockSpy).toHaveBeenCalled();
        expect(component['currentQuestionIndex']).toEqual(0);
    });

    it('should send StartTimer event with MAX_DURATION seconds during QRL questions in non-test game', () => {
        component['quiz'] = mockQuiz;
        component['currentQuestionIndex'] = 1;
        const oneSecondInterval = 1000;
        const isTransitionTimer = false;
        component['isTestGame'] = false;
        component['roomId'] = roomId;
        const sendSpy = spyOn(component['socketClientService'], 'send');
        component['startQuestionClock']();
        expect(sendSpy).toHaveBeenCalledWith(TimeEvents.StartTimer, {
            initialTime: Constants.MAX_DURATION,
            roomId,
            tickRate: oneSecondInterval,
            isTransitionTimer,
        });
    });

    it('should send StartTimer event with 3 seconds during question transitions in non-test game', () => {
        const transitionTime = 3;
        const oneSecondInterval = 1000;
        const isTransitionTimer = true;
        component['isTestGame'] = false;
        component['roomId'] = roomId;
        const sendSpy = spyOn(component['socketClientService'], 'send');
        component['startTransitionClock']();
        expect(sendSpy).toHaveBeenCalledWith(TimeEvents.StartTimer, {
            initialTime: transitionTime,
            roomId,
            tickRate: oneSecondInterval,
            isTransitionTimer,
        });
    });

    it('should listen on CurrentTimer event and set canTogglePanicMode to true when there is less than the minimum panic time left', () => {
        const time = 3;
        component['isTestGame'] = false;
        component['reactToTimerEvents']();
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer, time);
        expect(component['socketTime']).toEqual(time);
        expect(component['canTogglePanicMode']).toBeTrue();
    });

    it('should listen on CurrentTimer event and set canTogglePanicMode to false when there is no time left', () => {
        const time = 0;
        component['isTestGame'] = false;

        component['reactToTimerEvents']();
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer, time);
        expect(component['socketTime']).toEqual(time);
    });

    it('should react to CurrentTimer event and update the timer color when there is more time left than the minimum panic time', waitForAsync(() => {
        const time = 15;
        component['isTestGame'] = false;
        const setClockColorToRedSpy = spyOn<any>(component, 'setClockColorToRed');

        component['reactToTimerEvents']();
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer, time);
        expect(component['socketTime']).toEqual(time);
        expect(setClockColorToRedSpy).toHaveBeenCalled();
    }));

    it('should react to TimerFinished event and start next question when the transitioning timer has ended', () => {
        const initialQuestionIndex = 0;
        const questionClockSpy = spyOn<any>(component, 'startQuestionClock');
        component['currentQuestionIndex'] = initialQuestionIndex;
        socketHelper.peerSideEmit(TimeEvents.TimerFinished, true);

        expect(component['currentQuestionIndex']).toEqual(initialQuestionIndex + 1);
        expect(questionClockSpy).toHaveBeenCalled();
    });

    it('should set time to 0 when listening to the TimerInterrupted event', () => {
        component['socketTime'] = 15;
        component['reactToTimerEvents']();
        socketHelper.peerSideEmit(TimeEvents.TimerInterrupted);
        expect(component['socketTime']).toEqual(0);
    });

    it('should listen on NextQuestion event and prepare the transition clock when the event is received', () => {
        component['currentQuestionIndex'] = 0;
        component['lastQuestionIndex'] = 3;
        const transitionClockSpy = spyOn<any>(component, 'startTransitionClock');

        component['reactToNextQuestionEvent']();
        socketHelper.peerSideEmit(GameEvents.NextQuestion);
        expect(transitionClockSpy).toHaveBeenCalled();
    });

    it('should send StartTimer event when a new question has begun', () => {
        const oneSecondInterval = 1000;
        const isTransitionTimer = false;
        component['roomId'] = roomId;
        component['isTestGame'] = false;
        const sendSpy = spyOn(component['socketClientService'], 'send');
        component['startQuestionClock']();
        expect(sendSpy).toHaveBeenCalledWith(TimeEvents.StartTimer, {
            initialTime: mockQuiz.duration,
            roomId,
            tickRate: oneSecondInterval,
            isTransitionTimer,
        });
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
