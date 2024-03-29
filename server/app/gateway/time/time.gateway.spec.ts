/* La raison du disable lint du any est pour que nous puissions faire des tests et pour que nous puissions faire des spy
 des méthode privées */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { TimeGateway } from './time.gateway';

describe('TimeGateway', () => {
    let roomId: string;
    let gateway: TimeGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let roomManagerServiceMock: RoomManagerService;

    beforeEach(() => {
        roomId = 'roomId';
        logger = createStubInstance<Logger>(Logger);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TimeGateway,
                {
                    provide: RoomManagerService,
                    useValue: {
                        findRoom: jest.fn().mockReturnValue({
                            id: 'roomId',
                            timer: null,
                            organizer: { socketId: 'organizerId', name: 'Organisateur' },
                            players: [{ socketId: 'playerId1', name: 'name1', points: 50, bonusCount: 0, canChat: true, hasSubmitted: false }],
                        }),
                        rooms: [],
                    },
                },
                {
                    provide: Logger,
                    useValue: logger,
                },
            ],
        }).compile();

        gateway = module.get<TimeGateway>(TimeGateway);
        roomManagerServiceMock = module.get<RoomManagerService>(RoomManagerService);
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('handleStopTimer() should handle stopping the timer for a given room', () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        gateway.handleStopTimer(socket, roomId);
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('handleStartTimer() should handle starting the timer and emitting updates to the users in a given game', async () => {
        jest.useFakeTimers();
        const data = { initialTime: 60, tickRate: 1000, roomId };
        gateway['counter'] = data.initialTime;
        const emitMock = jest.fn();
        gateway['server'].to = jest.fn().mockReturnValue({ emit: emitMock });
        gateway.handleStartTimer(socket, data);
        jest.advanceTimersByTime(data.tickRate);
        const counter = data.initialTime - 1;
        expect(emitMock).toHaveBeenCalledWith(TimeEvents.CurrentTimer, counter);
    });

    it('handleStartTimer() should handle the timer finishing and emit TimerFinished event to the users in the room', async () => {
        jest.useFakeTimers();

        roomManagerServiceMock.findRoom = jest.fn().mockReturnValue({
            id: 'roomId',
            timer: null,
            organizer: { socketId: 'organizerId', name: 'Organisateur' },
            players: [],
        });

        const data = { initialTime: 60, tickRate: 1000, roomId, isTransitionTimer: false };
        const stopTimerSpy = jest.spyOn(gateway, 'handleStopTimer');

        server.to.returns({
            emit: (event: string) => {
                if (event === TimeEvents.TimerFinished) {
                    expect(event).toEqual(TimeEvents.TimerFinished);
                    expect(gateway['counter']).toBeUndefined();
                }
                if (event === GameEvents.AllPlayersSubmitted) {
                    expect(event).toEqual(GameEvents.AllPlayersSubmitted);
                }
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.handleStartTimer(socket, data);
        for (let i = data.initialTime; i >= 0; i--) {
            jest.advanceTimersByTime(data.tickRate);
        }
        expect(stopTimerSpy).toHaveBeenCalledTimes(1);
    });

    it('handleStartTimer() should not start the timer if it is already counting down', () => {
        jest.useFakeTimers();

        const data = { initialTime: 60, tickRate: 1000, roomId };
        const timerMock = 123;
        roomManagerServiceMock.findRoom = jest.fn().mockReturnValue({
            id: data.roomId,
            timer: timerMock,
            organizer: { socketId: 'organizerId', name: 'Organisateur' },
        });

        const emitMock = jest.fn();
        gateway['server'].to = jest.fn().mockReturnValue({ emit: emitMock });

        gateway.handleStartTimer(socket, data);
        expect(roomManagerServiceMock.findRoom(data.roomId).timer).toBe(timerMock);
        jest.advanceTimersByTime(data.tickRate);
        expect(emitMock).not.toHaveBeenCalled();
    });

    it('handleTimerInterrupted() should be called upon when the time on timer has been suddenly modified', () => {
        const stopTimerSpy = jest.spyOn(gateway, 'handleStopTimer');
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(TimeEvents.TimerInterrupted);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleTimerInterrupted(socket, roomId);
        expect(stopTimerSpy).toHaveBeenCalledTimes(1);
    });

    it('handleToggleTimer() should start the timer if isPaused is false', () => {
        const timer = { isPaused: false, roomId, initialTime: 60, tickRate: 1000 };
        const startTimerSpy = jest.spyOn(gateway, 'handleStartTimer');
        const emitMock = jest.fn();
        gateway['server'].to = jest.fn().mockReturnValue({ emit: emitMock });

        gateway.handleToggleTimer(socket, timer);
        expect(startTimerSpy).toHaveBeenCalledWith(socket, timer);
    });

    it('handleToggleTimer() should stop the timer if isPaused is true', () => {
        const timer = { isPaused: true, roomId: 'roomId', initialTime: 60, tickRate: 1000 };
        const stopTimerSpy = jest.spyOn(gateway, 'handleStopTimer');

        gateway.handleToggleTimer(socket, timer);
        expect(stopTimerSpy).toHaveBeenCalledWith(socket, timer.roomId);
    });

    it('handlePanicTimer() should restart timer and emit PanicMode event', () => {
        const timer = { roomId: 'roomId', initialTime: 60, tickRate: 1000 };
        const stopTimerSpy = jest.spyOn(gateway, 'handleStopTimer');
        const startTimerSpy = jest.spyOn(gateway, 'handleStartTimer');
        const emitMock = jest.fn();
        gateway['server'].to = jest.fn().mockReturnValue({ emit: emitMock });

        gateway.handlePanicTimer(socket, timer);
        expect(stopTimerSpy).toHaveBeenCalledWith(socket, timer.roomId);
        expect(startTimerSpy).toHaveBeenCalledWith(socket, timer);
        expect(emitMock).toHaveBeenCalledWith(TimeEvents.PanicMode);
    });
});
