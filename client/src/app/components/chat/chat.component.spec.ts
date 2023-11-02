/* eslint-disable max-classes-per-file */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client.service';
import { Socket } from 'socket.io-client';
import { ChatComponent } from './chat.component';

class SocketClientServiceMock extends SocketClientService {
    // This is a mock so we don't want to call the real connect method
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override connect() {}
}

describe('ChatComponent', () => {
    let component: ChatComponent;
    let socketClientServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let fixture: ComponentFixture<ChatComponent>;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new SocketClientServiceMock();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            declarations: [ChatComponent, MatIcon],
            imports: [FormsModule],
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
        expect(component['currentInputLength']).toEqual(inputLength);
        expect(component.characterCounterDisplay).toBe('4 / 200');
    });

    it('should send a message to a specific room on the server and reset roomMessage with a roomMessage event', () => {
        const spy = spyOn(component.socketService, 'send');
        const event = 'roomMessage';
        const testRoomId = 'roomid';
        const message = 'Test Message';
        component.roomMessage = message;
        component.sendMessageToRoom();
        expect(spy).toHaveBeenCalledWith(event, { roomId: testRoomId, message });
        expect(component.roomMessage).toEqual('');
    });

    it('should add a message to roomMessages array from server on roomMessage event when user is not the sender', () => {
        const chatMessage = { name: 'TestName', time: '10:23:56', message: 'Test Message', sentByYou: false };
        socketHelper.peerSideEmit('newRoomMessage', chatMessage);
        expect(component.roomMessages.length).toBe(1);
        expect(component.roomMessages[0].message).toEqual(chatMessage.message);
    });

    it('should add a message to roomMessages array from server on roomMessage event when user is the sender', () => {
        const chatMessage = { name: 'TestName', time: '10:23:56', message: 'Test Message', sentByYou: true };
        socketHelper.peerSideEmit('sentByYou', chatMessage);
        expect(component.roomMessages.length).toBe(1);
        expect(component.roomMessages[0].message).toEqual(chatMessage.message);
    });
});
