import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatMessage } from '@app/interfaces/chat-message';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ChatEvents } from '@common/chat.events';
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
    currentInputLength: number;
    maxInputLength: number;
    roomMessages: ChatMessage[];
    userMessage: string;
    canChat: boolean;
    playerName: string;
    lostChatPermissionMessage: string;
    grantedChatPermissionMessage: string;
    private isResultsRoute: boolean;
    private isTestGame: boolean;

    // Raison: Les 4 injections sont nécessaires  dans le constructeur
    // eslint-disable-next-line max-params
    constructor(
        public socketService: SocketClientService,
        private route: ActivatedRoute,
        private router: Router,
        private roomCommunicationService: RoomCommunicationService,
    ) {
        this.maxInputLength = 200;
        this.currentInputLength = 0;
        this.characterCounterDisplay = `${this.currentInputLength} / ${this.maxInputLength}`;
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
        this.characterCounterDisplay = `${this.currentInputLength} / ${this.maxInputLength}`;
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
        if (this.userMessage.trim().length !== 0 && !this.isTestGame) {
            this.socketService.send(ChatEvents.RoomMessage, { roomId: this.roomId, message: this.userMessage.trim() });
            this.userMessage = '';
        }
    }

    private configureChatSocketFeatures() {
        const addMessage = (data: { authorName: string; timeString: string; message: string }) => {
            const chatMessage: ChatMessage = {
                authorName: data.authorName,
                time: data.timeString,
                message: data.message,
            };
            this.roomMessages.push(chatMessage);
        };

        this.socketService.on(ChatEvents.NewRoomMessage, addMessage);

        this.socketService.on(GameEvents.PlayerAbandonedGame, (playerName: string) => {
            if (this.isOrganizer) {
                const messageTime = new Date();
                const playerLeftMessage: ChatMessage = {
                    authorName: 'System',
                    time: messageTime.getHours() + ':' + messageTime.getMinutes() + ':' + messageTime.getSeconds(),
                    message: playerName + ' a quitté la partie.',
                };
                this.roomMessages.push(playerLeftMessage);
            }
        });

        this.socketService.on(ChatEvents.ToggleChattingRights, async (canWrite: boolean) => {
            this.canChat = canWrite;
            const messageTime = new Date();
            const chatPermissionMessage: ChatMessage = {
                authorName: 'System',
                time: messageTime.getHours() + ':' + messageTime.getMinutes() + ':' + messageTime.getSeconds(),
                message: '',
            };

            chatPermissionMessage.message = !this.canChat ? this.lostChatPermissionMessage : this.grantedChatPermissionMessage;

            this.roomMessages.push(chatPermissionMessage);
        });

        this.socketService.on(GameEvents.SendResults, async () => {
            await firstValueFrom(this.roomCommunicationService.sendChatMessages(this.roomId as string, this.roomMessages));
        });
    }
}
