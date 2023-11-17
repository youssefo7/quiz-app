import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
export class ChatComponent implements OnInit {
    @Input() roomId: string | null;
    isOrganizer: boolean;
    chatMessage: ChatMessage;
    characterCounterDisplay: string;
    roomMessages: ChatMessage[];
    userMessage: string;
    canChat: boolean;
    playerName: string;
    lostChatPermissionMessage: string;
    grantedChatPermissionMessage: string;
    private isResultsRoute: boolean;
    private isTestGame: boolean;
    private currentInputLength: number;

    // Raison: Les 4 injections sont nécessaires  dans le constructeur
    // eslint-disable-next-line max-params
    constructor(
        public socketService: SocketClientService,
        private route: ActivatedRoute,
        private router: Router,
        private roomCommunicationService: RoomCommunicationService,
    ) {
        this.currentInputLength = 0;
        this.characterCounterDisplay = `${this.currentInputLength} / ${Constants.MAX_CHAT_MESSAGE_LENGTH}`;
        this.roomMessages = [];
        this.userMessage = '';
        this.isResultsRoute = this.router.url.includes('results');
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
        this.isOrganizer = this.router.url.endsWith('/host');
        this.canChat = true;
        this.lostChatPermissionMessage = "L'oganisateur a limité vos droits de clavardage";
        this.grantedChatPermissionMessage = "L'oganisateur a rétabli vos droits de clavardage";
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
        }

        const player = await firstValueFrom(
            this.roomCommunicationService.getPlayerName(this.roomId as string, { socketId: this.socketService.socket.id }),
        );
        this.playerName = this.isOrganizer ? 'Organisateur' : player;
    }

    expandTextArea(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        const heightLimit = 150;
        textarea.style.height = '';
        textarea.style.height = Math.min(textarea.scrollHeight, heightLimit) + 'px';
    }

    detectCharacterLengthOnInput(event: Event) {
        const inputValue = (event.target as HTMLInputElement).value;
        this.currentInputLength = inputValue.length;
        this.characterCounterDisplay = `${this.currentInputLength} / ${Constants.MAX_CHAT_MESSAGE_LENGTH}`;
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

    private configureChatSocketFeatures() {
        const addMessage = (data: { authorName: string; timeString: string; message: string; fromSystem: boolean }) => {
            const chatMessage: ChatMessage = {
                authorName: data.authorName,
                time: data.timeString,
                message: data.message,
                fromSystem: data.fromSystem,
            };
            this.roomMessages.push(chatMessage);
        };

        this.socketService.on(ChatEvents.NewRoomMessage, addMessage);

        this.socketService.on(GameEvents.PlayerAbandonedGame, (playerName: string) => {
            if (this.isOrganizer) {
                const messageTime = new Date();
                const playerLeftMessage: ChatMessage = {
                    authorName: 'Système',
                    time: messageTime.getHours() + ':' + messageTime.getMinutes() + ':' + messageTime.getSeconds(),
                    message: playerName + ' a quitté la partie.',
                    fromSystem: true,
                };
                this.roomMessages.push(playerLeftMessage);
            }
        });

        this.socketService.on(ChatEvents.ToggleChattingRights, async (canWrite: boolean) => {
            this.canChat = canWrite;
            const messageTime = new Date();
            const chatPermissionMessage: ChatMessage = {
                authorName: 'Système',
                time: messageTime.getHours() + ':' + messageTime.getMinutes() + ':' + messageTime.getSeconds(),
                message: !this.canChat ? this.lostChatPermissionMessage : this.grantedChatPermissionMessage,
                fromSystem: true,
            };
            this.roomMessages.push(chatPermissionMessage);
        });

        this.socketService.on(GameEvents.SendResults, async () => {
            await firstValueFrom(this.roomCommunicationService.sendChatMessages(this.roomId as string, this.roomMessages));
        });
    }
}
