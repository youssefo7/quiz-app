/* La raison du disable lint du any est pour que nous puissions faire des tests et pour que nous puissions faire des spy
 des méthode privées */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { TimeGateway } from './time.gateway';
import { TimeEvents } from './time.gateway.events';

describe('TimeGateway', () => {
    let roomId: string;
    let gateway: TimeGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;

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
                    provide: Logger,
                    useValue: logger,
                },
                RoomManagerService,
            ],
        }).compile();

        gateway = module.get<TimeGateway>(TimeGateway);
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should handle starting the timer and emitting updates', async () => {
        jest.useFakeTimers();
        const timeToAdvance = 0;
        const data = { initialTime: 60, tickRate: 1000, roomId };
        gateway['counter'] = data.initialTime;
        gateway['tickRate'] = data.tickRate;
        const emitUpdatedTimeSpy = jest.spyOn(gateway as any, 'emitUpdatedTime');

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
        jest.advanceTimersByTime(timeToAdvance);
        expect(emitUpdatedTimeSpy).toHaveBeenCalledWith(roomId);
    });

    it('should handle stopping the timer', () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        gateway.handleStopTimer();
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle starting the timer and emitting updates to the users in a game', async () => {
        jest.useFakeTimers();

        const data = { initialTime: 60, tickRate: 1000, roomId };
        const emitUpdatedTimeSpy = jest.spyOn(gateway as any, 'emitUpdatedTime');

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
        expect(emitUpdatedTimeSpy).toHaveBeenCalledWith(roomId);

        return serverEmitSpy.then(() => {
            for (let i = 1; i <= data.initialTime; i++) {
                jest.advanceTimersByTime(data.tickRate);
                expect(emitUpdatedTimeSpy).toHaveBeenCalled();
            }
        });
    });

    it('should call handleTransitionClockFinished event when transition has finished', () => {
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(TimeEvents.TransitionClockFinished);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleTransitionClockFinished(socket, roomId);
    });

    it('should handle the timer finishing and emit TimerFinished event', async () => {
        jest.useFakeTimers();

        const data = { initialTime: 60, tickRate: 1000, roomId };
        const stopTimerSpy = jest.spyOn(gateway, 'handleStopTimer');

        server.to.returns({
            emit: (event: string) => {
                if (event === TimeEvents.TimerFinished) {
                    expect(event).toEqual(TimeEvents.TimerFinished);
                    expect(gateway['couter']).toBeUndefined();
                }
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.handleStartTimer(socket, data);
        for (let i = data.initialTime; i >= 0; i--) {
            jest.advanceTimersByTime(data.tickRate);
        }
        expect(stopTimerSpy).toHaveBeenCalledTimes(1);
    });

    it('should not start the timer if it is already running', async () => {
        jest.useFakeTimers();

        const data = { initialTime: 60, tickRate: 1000, roomId };
        // La raison du disable est pour simuler une intervalle déjà active
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        gateway['interval'] = setInterval(() => {}, data.tickRate);
        const emitUpdatedTimeSpy = jest.spyOn(gateway as any, 'emitUpdatedTime');
        stub(socket, 'rooms').value(new Set([roomId]));

        gateway.handleStartTimer(socket, data);

        expect(gateway['interval']).not.toBeNull();
        jest.advanceTimersByTime(data.initialTime * data.tickRate);

        expect(emitUpdatedTimeSpy).not.toHaveBeenCalled();
        expect(emitUpdatedTimeSpy).not.toHaveBeenCalled();
    });

    it('should call HandleTimerInterrupted when the time on timer has been suddently modified', () => {
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
});
