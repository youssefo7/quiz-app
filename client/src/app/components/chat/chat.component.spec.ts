import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SocketClientService } from '@app/services/socket-client.service';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
    let component: ChatComponent;
    let socketClientServiceMock: jasmine.SpyObj<SocketClientService>;
    let fixture: ComponentFixture<ChatComponent>;

    beforeEach(() => {
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['connect', 'disconnect', 'send', 'on']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ChatComponent, MatIcon],
            providers: [
                { provide: SocketClientService, useValue: socketClientServiceMock },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ room: 'roomid' }),
                        },
                    },
                },
            ],
        });
        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('expandTextArea should set height to scrollHeight if scrollHeight is less than 150px', () => {
        const event = { target: { scrollHeight: 100, style: { height: '' } } };
        component.expandTextArea(event as unknown as Event);
        expect(event.target.style.height).toEqual('100px');
    });

    it('expandTextArea should set height to 150px if scrollHeight is  150px', () => {
        const event = { target: { scrollHeight: 150, style: { height: '' } } };
        component.expandTextArea(event as unknown as Event);
        expect(event.target.style.height).toEqual('150px');
    });

    it('expandTextArea should set height to 150px if scrollHeight is greater than 150px', () => {
        const event = { target: { scrollHeight: 200, style: { height: '' } } };
        component.expandTextArea(event as unknown as Event);
        expect(event.target.style.height).toEqual('150px');
    });

    it('detectCharacterLengthOnInput should set currentInputLength to length of input value', () => {
        const event = { target: { value: 'test' } };
        const inputLength = 4;
        component.detectCharacterLengthOnInput(event as unknown as Event);
        expect(component.currentInputLength).toEqual(inputLength);
        expect(component.characterCounterDisplay).toBe('4 / 200');
    });

    it('should send a message to a specific room on the server and reset roomMessage with a roomMessage event', () => {
        const event = 'roomMessage';
        const testRoomId = 'roomid';
        const message = 'Test Message';
        component.roomMessage = message;
        component.sendMessageToRoom();
        expect(socketClientServiceMock.send).toHaveBeenCalledWith(event, { roomId: testRoomId, message });
        expect(component.roomMessage).toEqual('');
        expect(component.configureChatSocketFeatures()).toHaveBeenCalled();
    });

    // it('should add a message to roomMessages array from server on roomMessage event', () => {
    //     const dataInfo = { name: 'Test name', time: '11:12:13', message: 'Test Message', sentByYou: false };
    //     const roomMessage = 'message 1';
    //     socketHelper.peerSideEmit('newRoomMessage', (data: dataInfo));
    //     expect(component.roomMessages.length).toBe(1);
    //     expect(component.roomMessages).toContain(roomMessage);
    // });
});
