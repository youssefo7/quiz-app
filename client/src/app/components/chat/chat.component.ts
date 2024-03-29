import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ChatMessage } from '@common/chat-message';
import { ChatEvents } from '@common/chat.events';
import { Constants } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, AfterViewChecked {
    @Input() roomId: string | null;
    @Input() isTestGame: boolean;
    @ViewChild('scrollMe') private myScrollContainer: ElementRef;

    isOrganizer: boolean;
    chatMessage: ChatMessage;
    characterCounterDisplay: string;
    roomMessages: ChatMessage[];
    userMessage: string;
    canChat: boolean;
    playerName: string;
    lostChatPermissionMessage: string;
    grantedChatPermissionMessage: string;
    giveChattingRightsToAll: string;
    private isResultsRoute: boolean;
    private enableScroll: boolean;

    // Raison: Les 4 injections sont nécessaires  dans le constructeur
    // eslint-disable-next-line max-params
    constructor(
        public socketService: SocketClientService,
        private router: Router,
        private roomCommunicationService: RoomCommunicationService,
        private changeDetector: ChangeDetectorRef,
    ) {
        this.roomMessages = [];
        this.userMessage = '';
        this.characterCounterDisplay = `${this.userMessage.length} / ${Constants.MAX_TEXTAREA_LENGTH}`;
        this.isResultsRoute = this.router.url.includes('results');
        this.isOrganizer = this.router.url.endsWith('/host');
        this.canChat = true;
        this.lostChatPermissionMessage = "L'oganisateur a limité vos droits de clavardage";
        this.grantedChatPermissionMessage = "L'oganisateur a rétabli vos droits de clavardage";
        this.giveChattingRightsToAll = "L'organisateur a rétabli les droits de clavardage à tous les joueurs";
        this.enableScroll = false;
    }

    async ngOnInit(): Promise<void> {
        if (!this.socketService.socketExists()) {
            return;
        }
        if (!this.isTestGame) {
            this.configureChatSocketFeatures();
        }

        if (this.isResultsRoute) {
            this.roomMessages = await firstValueFrom(this.roomCommunicationService.getChatMessages(this.roomId as string));

            if (!this.isOrganizer) {
                this.roomMessages = this.roomMessages.filter((message) => !message.fromSystem);
            }
            this.addSystemMessage(this.giveChattingRightsToAll);
        }

        const player = await firstValueFrom(
            this.roomCommunicationService.getPlayerName(this.roomId as string, { socketId: this.socketService.socket.id }),
        );
        this.playerName = this.isOrganizer ? 'Organisateur' : player;
    }

    ngAfterViewChecked() {
        if (this.enableScroll) {
            this.scrollToBottom();
            this.changeDetector.detectChanges();
            this.enableScroll = false;
        }
    }

    expandTextArea(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        const heightLimit = 150;
        textarea.style.height = '';
        textarea.style.height = Math.min(textarea.scrollHeight, heightLimit) + 'px';
    }

    detectCharacterLengthOnInput() {
        this.characterCounterDisplay = `${this.userMessage.length} / ${Constants.MAX_TEXTAREA_LENGTH}`;
    }

    getPlaceholder() {
        return this.canChat ? 'Écrivez votre message...' : '';
    }

    keyUpEvent($event: KeyboardEvent) {
        $event.preventDefault();
        if ($event.key === 'Enter') {
            this.sendMessageToRoom();
        }
    }

    sendMessageToRoom() {
        if (this.userMessage.trim() && !this.isTestGame) {
            this.socketService.send(ChatEvents.RoomMessage, { roomId: this.roomId, message: this.userMessage.trim() });
            this.userMessage = '';
        }
    }

    private scrollToBottom() {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    }

    private configureChatSocketFeatures() {
        this.socketService.on(ChatEvents.NewRoomMessage, (chatMessage: ChatMessage) => {
            this.roomMessages.push(chatMessage);
            this.enableScroll = true;
        });

        this.socketService.on(GameEvents.PlayerAbandonedGame, (playerName: string) => {
            if (this.isOrganizer) {
                const newMessage = playerName + ' a quitté la partie.';
                this.addSystemMessage(newMessage);
            }
        });

        this.socketService.on(ChatEvents.ToggleChattingRights, async (canWrite: boolean) => {
            this.canChat = canWrite;
            const newMessage = !this.canChat ? this.lostChatPermissionMessage : this.grantedChatPermissionMessage;
            this.addSystemMessage(newMessage);
        });

        this.socketService.on(GameEvents.SendResults, async () => {
            if (this.isOrganizer) {
                await firstValueFrom(this.roomCommunicationService.sendChatMessages(this.roomId as string, this.roomMessages));
            }
        });
    }

    private addSystemMessage(message: string) {
        const messageTime = new Date();
        const systemMessage: ChatMessage = {
            authorName: 'Système',
            time: messageTime.getHours() + ':' + messageTime.getMinutes() + ':' + messageTime.getSeconds(),
            message,
            fromSystem: true,
        };
        this.roomMessages.push(systemMessage);
        this.enableScroll = true;
    }
}
