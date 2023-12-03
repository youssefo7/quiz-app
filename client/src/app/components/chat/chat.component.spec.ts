// any est necessaire pour pouvoir tester les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ChatMessage } from '@common/chat-message';
import { ChatEvents } from '@common/chat.events';
import { GameEvents } from '@common/game.events';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ChatComponent } from './chat.component';

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

describe('ChatComponent', () => {
    let component: ChatComponent;
    let mockSocketClientService: MockSocketClientService;
    let socketHelper: SocketTestHelper;
    let fixture: ComponentFixture<ChatComponent>;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;

    const chatMessageMock: ChatMessage = {
        authorName: 'authorMock',
        time: '00:00:00',
        message: 'testing chat messages',
        fromSystem: false,
    };

    beforeEach(() => {
        mockSocketClientService = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists', 'send']);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getPlayerName', 'getChatMessages', 'sendChatMessages']);
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        mockSocketClientService = new MockSocketClientService();
        mockSocketClientService.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [ChatComponent, MatIcon],
            imports: [FormsModule],
            providers: [
                { provide: SocketClientService, useValue: mockSocketClientService },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ roomId: 'roomId' }),
                            url: ['test'],
                        },
                    },
                },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        component.roomId = 'roomId';
        mockSocketClientService.setSocketExists(true);
        roomCommunicationServiceMock.getChatMessages.and.returnValue(of([chatMessageMock]));
        roomCommunicationServiceMock.getPlayerName.and.returnValue(of('playerName'));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set playerName if the user is not a host', async () => {
        component['isOrganizer'] = false;

        await component.ngOnInit();
        expect(component.playerName).toBe('playerName');
        expect(component.playerName).not.toBe('Organisateur');
    });

    it("should set playerName to 'Organisateur' only if the user is the host", async () => {
        component['isOrganizer'] = true;

        await component.ngOnInit();
        expect(component.playerName).not.toBe('playerName');
        expect(component.playerName).toBe('Organisateur');
    });

    it('should correctly initialize component if not in results page', async () => {
        component['isResultsRoute'] = false;

        await component.ngOnInit();

        expect(component.roomMessages).toEqual([]);
        expect(component.playerName).toBe('playerName');
    });

    it('should correctly initialize component and filter over room messages if in Results page', async () => {
        component['isResultsRoute'] = true;
        component['isOrganizer'] = false;
        const systemMessage: ChatMessage = {
            authorName: 'Système',
            time: '00:00:00',
            message: 'testing chat messages',
            fromSystem: true,
        };
        component.roomMessages.push(systemMessage);

        await component.ngOnInit();

        expect(component.roomMessages).not.toContain(systemMessage);
        expect(component.roomMessages.length).toEqual(2);
        expect(component.roomMessages[0]).toEqual(chatMessageMock);
        expect(component.roomMessages[1].authorName).toBe('Système');
        expect(component.roomMessages[1].message).toBe(component.giveChattingRightsToAll);
        expect(component.roomMessages[1].fromSystem).toBeTruthy();
        expect(component.playerName).toBe('playerName');
    });

    it('should not call functions when initializing component without an existing socket in Results page', async () => {
        const configureSpy = spyOn<any>(component, 'configureChatSocketFeatures');
        mockSocketClientService.setSocketExists(false);
        component['isResultsRoute'] = true;
        component['isTestGame'] = false;

        await component.ngOnInit();
        expect(roomCommunicationServiceMock.getChatMessages).not.toHaveBeenCalled();
        expect(configureSpy).not.toHaveBeenCalled();
    });

    it('should call scrollToBottom() and changeDetector() when enableScroll is true and ngAfterViewChecked() is called', () => {
        const scrollToBottomSpy = spyOn<any>(component, 'scrollToBottom');
        const detectSpy = spyOn<any>(component['changeDetector'], 'detectChanges');
        component['enableScroll'] = true;
        component.ngAfterViewChecked();

        expect(detectSpy).toHaveBeenCalled();
        expect(scrollToBottomSpy).toHaveBeenCalled();
        expect(component['enableScroll']).toBeFalsy();
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
        component.userMessage = 'test';
        component.detectCharacterLengthOnInput();
        expect(component.characterCounterDisplay).toBe('4 / 200');
    });

    it('should send a message to a specific room on the server and reset userMessage when sendMessageToRoom() is called ', () => {
        const testRoomId = 'roomId';
        const message = 'Test Message';
        const sendSpy = spyOn(mockSocketClientService, 'send');
        component.userMessage = message;
        component.sendMessageToRoom();
        expect(sendSpy).toHaveBeenCalledWith(ChatEvents.RoomMessage, { roomId: testRoomId, message });
        expect(component.userMessage).toEqual('');
    });

    it('should listen on NewRoomMessage event and add the message to the room messages', () => {
        component['configureChatSocketFeatures']();
        socketHelper.peerSideEmit(ChatEvents.NewRoomMessage, chatMessageMock);

        expect(component.roomMessages).toContain(chatMessageMock);
        expect(component['enableScroll']).toBeTruthy();
    });

    it('should listen on PlayerAbandonedGame event and send a message to warn host of the game', () => {
        component['isOrganizer'] = true;

        spyOn<any>(component, 'addSystemMessage').and.callThrough();
        socketHelper.peerSideEmit(GameEvents.PlayerAbandonedGame, 'abandonedPlayer');

        expect(component['addSystemMessage']).toHaveBeenCalledWith('abandonedPlayer a quitté la partie.');
        expect(component.roomMessages.length).toBe(1);
    });

    it('should react to ToggleChattingRights event and modify properties when user can write', () => {
        const canWriteMock = true;
        spyOn<any>(component, 'addSystemMessage').and.callThrough();

        socketHelper.peerSideEmit(ChatEvents.ToggleChattingRights, canWriteMock);

        expect(component.canChat).toBe(canWriteMock);
        expect(component.roomMessages.length).toBe(1);
        expect(component['addSystemMessage']).toHaveBeenCalledWith(component.grantedChatPermissionMessage);
    });

    it("should react to ToggleChattingRights event and modify properties when user can't write", () => {
        const canWriteMock = false;
        spyOn<any>(component, 'addSystemMessage').and.callThrough();

        socketHelper.peerSideEmit(ChatEvents.ToggleChattingRights, canWriteMock);

        expect(component.canChat).toBe(canWriteMock);
        expect(component.roomMessages.length).toBe(1);
        expect(component['addSystemMessage']).toHaveBeenCalledWith(component.lostChatPermissionMessage);
    });

    it('should listen on SendResults event and call sendChatMessages() when the event is received', () => {
        component['isOrganizer'] = true;
        roomCommunicationServiceMock.sendChatMessages.and.returnValue(of(component.roomMessages));
        socketHelper.peerSideEmit(GameEvents.SendResults);

        expect(roomCommunicationServiceMock.sendChatMessages).toHaveBeenCalledWith('roomId', component.roomMessages);
    });

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

    it('should add a system message to a room when addSystemMessage is called', () => {
        component['addSystemMessage'](component.grantedChatPermissionMessage);
        expect(component.roomMessages.length).toEqual(1);
        expect(component.roomMessages[0].authorName).toBe('Système');
        expect(component.roomMessages[0].message).toBe(component.grantedChatPermissionMessage);
        expect(component.roomMessages[0].fromSystem).toBeTruthy();
        expect(component['enableScroll']).toBeTruthy();
    });
});
