import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ChatEvents } from '@common/chat.events';
import { Socket } from 'socket.io-client';
import { ChatComponent } from './chat.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        // vide
    }
    override socketExists() {
        return true;
    }
}

describe('ChatComponent', () => {
    let component: ChatComponent;
    let socketClientServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let fixture: ComponentFixture<ChatComponent>;
    let roomCommunicationServiceMock: RoomCommunicationService;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new SocketClientServiceMock();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;

        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['connect', 'disconnect', 'send', 'socketExists']);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getPlayerName', 'getChatMessages']);
    });

    beforeEach(waitForAsync(() => {
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
                            url: ['test'],
                        },
                    },
                },
                {
                    provide: RoomCommunicationService,
                    useValue: roomCommunicationServiceMock,
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        component.roomId = 'roomId';
        fixture.detectChanges();
    }));

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
        expect(component['currentInputLength']).toEqual(inputLength);
        expect(component.characterCounterDisplay).toBe('4 / 200');
    });

    it('should send a message to a specific room on the server and reset userMessage ', () => {
        const testRoomId = 'roomId';
        const message = 'Test Message';
        component.userMessage = message;
        component.sendMessageToRoom();
        expect(socketClientServiceMock.send).toHaveBeenCalledWith(ChatEvents.RoomMessage, { roomId: testRoomId, message });
        expect(component.userMessage).toEqual('');
    });

    // it('should add a message to roomMessages array on userMessage event when user is not the sender', fakeAsync(() => {
    //     const chatMessage = { authorName: component.playerName, timeString: '10:23:56', message: 'Test Message' };
    //     component.ngOnInit();
    //     socketHelper.emit(ChatEvents.NewRoomMessage, { roomId: component.roomId, message: chatMessage.message.trim() });
    //     socketHelper.peerSideEmit(ChatEvents.NewRoomMessage, chatMessage);
    //     expect(component.roomMessages.length).toBe(1);
    //     expect(component.roomMessages[0].authorName).toEqual(chatMessage.authorName);
    //     expect(component.roomMessages[0].time).toEqual(chatMessage.timeString);
    //     expect(component.roomMessages[0].message).toEqual(chatMessage.message);
    // }));

    // it('should add a message to roomMessages array on userMessage event when user is the sender', () => {
    //     component.playerName = 'testName';
    //     component.isOrganizer = false;
    //     component.canChat = true;
    //     component.roomMessages = [];
    //     const chatMessage = { authorName: 'TestName', timeString: '10:23:56', message: 'Test Message' };
    //     socketHelper.peerSideEmit(ChatEvents.NewRoomMessage, chatMessage);
    //     // tick();
    //     // fixture.detectChanges();
    //     console.log(component.roomMessages);
    //     expect(component.roomMessages.length).toEqual(1);
    //     expect(component.roomMessages[0].authorName).toEqual(chatMessage.authorName);
    //     expect(component.roomMessages[0].time).toEqual(chatMessage.timeString);
    //     expect(component.roomMessages[0].message).toEqual(chatMessage.message);
    // });

    // it('should warn organizer when a player has left the game', () => {
    //     component.isOrganizer = true;
    //     component.playerName = 'TestName';
    //     component.ngOnInit();
    //     socketHelper.peerSideEmit(GameEvents.PlayerAbandonedGame, component.playerName);
    //     console.log(component.roomMessages);
    //     expect(component.roomMessages.length).toEqual(1);
    //     expect(component.roomMessages[0].authorName).toEqual('System');
    //     expect(component.roomMessages[0].message).toEqual(component.playerName + ' a quitté la partie.');
    // });

    it('should call sendMessageToRoom on "Enter" key up in the textarea', () => {
        const spySendMessageToRoom = spyOn(component, 'sendMessageToRoom');
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        component.keyUpEvent(event);
        expect(spySendMessageToRoom).toHaveBeenCalled();
    });

    it('should return an empty string as placeholder when player cannot chat', () => {
        component.canChat = false;
        const res = component.getPlaceholder();
        expect(res).toEqual('');
    });

    it('should return the placeholder text for chat input area when a player can chat', () => {
        component.canChat = true;
        const res = component.getPlaceholder();
        expect(res).toEqual('Écrivez votre message...');
    });
});
