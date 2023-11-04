import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client.service';
import { Socket } from 'socket.io-client';
import { ChatComponent } from './chat.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        // vide
    }
}

describe('ChatComponent', () => {
    let component: ChatComponent;
    let socketClientServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let fixture: ComponentFixture<ChatComponent>;

    beforeEach(() => {
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['connect', 'disconnect', 'send', 'on']);
    });

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new SocketClientServiceMock();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;
    });

    beforeEach(async () => {
        TestBed.configureTestingModule({
            declarations: [ChatComponent, MatIcon],
            imports: [FormsModule],
            providers: [
                { provide: SocketClientService, useValue: socketClientServiceMock },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ roomId: 'roomId' }),
                        },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
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

    it('should send a message to a specific room on the server and reset userMessage ', () => {
        const spy = spyOn(component.socketService, 'send');
        const event = 'roomMessage';
        const testRoomId = 'roomId';
        const message = 'Test Message';
        component.userMessage = message;
        component.sendMessageToRoom();
        expect(spy).toHaveBeenCalledWith(event, { roomId: testRoomId, message });
        expect(component.userMessage).toEqual('');
    });

    it('should add a message to roomMessages array on userMessage event when user is not the sender', () => {
        const chatMessage = { authorName: 'TestName', timeString: '10:23:56', message: 'Test Message', sentByUser: false };
        socketHelper.peerSideEmit('newRoomMessage', chatMessage);
        expect(component.roomMessages.length).toBe(1);
        expect(component.roomMessages[0].authorName).toEqual(chatMessage.authorName);
        expect(component.roomMessages[0].time).toEqual(chatMessage.timeString);
        expect(component.roomMessages[0].message).toEqual(chatMessage.message);
        expect(component.roomMessages[0].sentByUser).toEqual(false);
    });

    it('should add a message to roomMessages array on userMessage event when user is the sender', () => {
        const chatMessage = { authorName: 'TestName', timeString: '10:23:56', message: 'Test Message', sentByUser: true };
        socketHelper.peerSideEmit('newRoomMessage', chatMessage);
        expect(component.roomMessages.length).toEqual(1);
        expect(component.roomMessages[0].authorName).toEqual(chatMessage.authorName);
        expect(component.roomMessages[0].time).toEqual(chatMessage.timeString);
        expect(component.roomMessages[0].message).toEqual(chatMessage.message);
        expect(component.roomMessages[0].sentByUser).toEqual(true);
    });

    it('should warn organizer when a player has left the game', () => {
        component.isOrganizer = true;
        const playerName = 'TestName';
        socketHelper.peerSideEmit('AbandonedGame', playerName);
        expect(component.roomMessages.length).toEqual(1);
        expect(component.roomMessages[0].authorName).toEqual('System');
        expect(component.roomMessages[0].message).toEqual(playerName + ' has left the game.');
        expect(component.roomMessages[0].sentByUser).toEqual(false);
    });
});
