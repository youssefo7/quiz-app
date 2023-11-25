// Nous avons besoin du any pour spy sur les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { QuestionZoneStatsComponent } from './question-zone-stats.component';

class MockSocketClientService extends SocketClientService {
    override connect() {
        // vide
    }

    override socketExists() {
        return true;
    }
}

describe('QuestionZoneStatsComponent', () => {
    let component: QuestionZoneStatsComponent;
    let fixture: ComponentFixture<QuestionZoneStatsComponent>;
    let clientSocketServiceMock: MockSocketClientService;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;
    let socketHelper: SocketTestHelper;
    const mockedQuiz = {
        id: '123',
        title: 'Test quiz',
        description: 'Test quiz description',
        visibility: true,
        duration: 60,
        lastModification: '2018-11-13T20:20:39+00:00',
        questions: [{ type: 'QCM', text: 'Q1', points: 10, choices: [] }],
    };

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'send']);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers', 'sendQuestionsChartData']);
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(
            of([
                /* liste vide de joueur */
            ]),
        );
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(
            of([
                /* liste vide de chart */
            ]),
        );
        roomCommunicationServiceMock.sendQuestionsChartData.and.returnValue(
            of([
                /* liste vide de chart data */
            ]),
        );
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        clientSocketServiceMock = new MockSocketClientService();
        clientSocketServiceMock.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [QuestionZoneStatsComponent, HistogramComponent, GamePlayersListComponent],
            imports: [NgChartsModule, HttpClientTestingModule],
            providers: [
                { provide: SocketClientService, useValue: clientSocketServiceMock },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ roomId: 'roomId' }),
                            url: ['host'],
                        },
                    },
                },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(QuestionZoneStatsComponent);
        component = fixture.componentInstance;

        component.quiz = mockedQuiz;
        component.roomId = '123';
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should send NextQuestion or SendResults event when clicking next question button', () => {
        const roomId = '123';
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        component.roomId = roomId;
        component['currentQuestionIndex'] = 0;
        component['lastQuestionIndex'] = 1;

        component.goToNextQuestion();
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.NextQuestion, roomId);

        component['currentQuestionIndex'] = 1;
        component.goToNextQuestion();
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.SendResults, roomId);
    });

    it('should prepare for next question on NextQuestion event', () => {
        socketHelper.peerSideEmit(GameEvents.NextQuestion);
        expect(component['isNextQuestionButtonDisable']).toBeTrue();
        expect(component.nextQuestionButtonStyle).toEqual({ backgroundColor: '' });
    });

    it('should change button text if is at last question', () => {
        component.quiz = mockedQuiz;
        component['currentQuestionIndex'] = 0;
        component['getQuestion'](0);

        expect(component.question).toEqual(mockedQuiz.questions[0]);
        expect(component.nextQuestionButtonText).toEqual('Voir les résultats');
    });

    it('should update time and detect end of question on CurrentTimer event', () => {
        const time = 15;
        const detectEndOfQuestionSpy = spyOn<any>(component, 'detectEndOfQuestion');
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer, time);
        expect(detectEndOfQuestionSpy).toHaveBeenCalledWith(time);
        expect(component['socketTime']).toEqual(time);
    });

    it('should interrupt timer and detect end of question on TimerInterrupted event', () => {
        const detectEndOfQuestionSpy = spyOn<any>(component, 'detectEndOfQuestion');
        socketHelper.peerSideEmit(TimeEvents.TimerInterrupted);
        expect(detectEndOfQuestionSpy).toHaveBeenCalledWith(0);
    });

    it('should show next question on TransitionClockFinished event', () => {
        const showNextQuestionSpy = spyOn<any>(component, 'showNextQuestion');
        // socketHelper.peerSideEmit(TimeEvents.TransitionClockFinished);
        expect(showNextQuestionSpy).toHaveBeenCalled();
    });

    it('should show the next question', () => {
        const currentQuestionIndex = 0;
        const resetAnswerCountSpy = spyOn<any>(component, 'resetAnswerCount');
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        component.quiz = mockedQuiz;
        component['currentQuestionIndex'] = currentQuestionIndex;

        component['showNextQuestion']();
        expect(component['currentQuestionIndex']).toEqual(currentQuestionIndex + 1);
        expect(resetAnswerCountSpy).toHaveBeenCalled();
        expect(getQuestionSpy).toHaveBeenCalledWith(currentQuestionIndex + 1);
    });

    it('should call detectEndOfQuestion with time = 0 at end of timer', () => {
        component['socketTime'] = 0;
        const detectEndOfQuestionSpy = spyOn<any>(component, 'detectEndOfQuestion');
        expect(detectEndOfQuestionSpy).toHaveBeenCalledWith(0);
    });
});
