/* eslint-disable @typescript-eslint/no-explicit-any */
import { Room } from '@app/interfaces/room';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { TimeGateway } from './time.gateway';
import { TimeEvents } from './time.gateway.events';

describe('TimeGateway', () => {
    let roomId: string;
    let room: Room;
    let gateway: TimeGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let roomManagerServiceMock: RoomManagerService;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TimeGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
                RoomManagerService,
            ],
        }).compile();

        roomId = 'roomId';
        room = {
            id: roomId,
            quizId: '1',
            organizer: { socketId: 'organizerId', name: 'Organisateur' },
            players: [
                { socketId: 'playerId1', name: 'name1', points: 50, bonusCount: 0 },
                { socketId: 'playerId2', name: 'name2', points: 200, bonusCount: 1 },
            ],
            isLocked: false,
            bannedNames: [],
            answerTimes: [],
        };
        gateway = module.get<TimeGateway>(TimeGateway);
        roomManagerServiceMock = module.get<RoomManagerService>(RoomManagerService);
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should handle starting the timer and emitting updates', async () => {
        const timeToAdvance = 60000;
        const data = { initialTime: 60, tickRate: 1000, roomId };
        gateway['counter'] = data.initialTime;
        gateway['tickRate'] = data.tickRate;

        stub(socket, 'rooms').value(new Set([roomId]));
        const serverEmitSpy = new Promise<void>((resolve) => {
            server.to.returns({
                emit: (event: string) => {
                    if (event === TimeEvents.TimerFinished) {
                        expect(event).toEqual(event);
                    }
                    if (event === TimeEvents.CurrentTimer) {
                        expect(event).toEqual(TimeEvents.CurrentTimer);
                    }
                    resolve();
                },
            } as BroadcastOperator<unknown, unknown>);
        });
        gateway.handleStartTimer(socket, data);
        await serverEmitSpy;

        jest.useFakeTimers();
        jest.advanceTimersByTime(timeToAdvance);
    });

    it('should handle stopping the timer', () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        gateway.handleStopTimer();
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit the updated time', async () => {
        gateway['counter'] = 42;
        roomManagerServiceMock.rooms.push(room);

        const serverEmitSpy = new Promise<void>((resolve) => {
            server.to.returns({
                emit: (event: string, counter: number) => {
                    expect(event).toEqual(TimeEvents.CurrentTimer);
                    expect(counter).toEqual(gateway['counter']);
                    resolve();
                },
            } as BroadcastOperator<unknown, unknown>);
        });

        gateway['emitUpdatedTime'](roomId);
        await serverEmitSpy;
    });

    it('should handle starting the timer and emitting updates', async () => {
        const timeToAdvance = 10;
        roomManagerServiceMock.rooms.push(room);
        const data = { initialTime: 0, tickRate: 1000, roomId };
        const emitUpdatedTimeSpy = jest.spyOn(gateway as any, 'emitUpdatedTime');
        gateway['counter'] = 0;
        gateway['tickRate'] = data.tickRate;
        stub(socket, 'rooms').value(new Set([roomId]));

        const serverEmitSpy = new Promise<void>((resolve) => {
            server.to.returns({
                emit: (event: string, counter: number) => {
                    expect(event).toEqual(TimeEvents.CurrentTimer);
                    expect(counter).toEqual(gateway['counter']);
                    resolve();
                },
            } as BroadcastOperator<unknown, unknown>);
        });
        gateway.handleStartTimer(socket, data);
        await serverEmitSpy;

        jest.useFakeTimers();
        jest.advanceTimersByTime(timeToAdvance);

        expect(emitUpdatedTimeSpy).toHaveBeenCalled();
    });
});
