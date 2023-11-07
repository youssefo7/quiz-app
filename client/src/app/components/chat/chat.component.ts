import { SocketClientService } from './../../services/socket-client.service';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatEvents } from '@app/events/chat.events';
import { GameEvents } from '@app/events/game.events';
import { ChatMessage } from '@app/interfaces/chat-message';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
    @Input() isOrganizer: boolean;
    @Input() roomId: string | null;
    chatMessage: ChatMessage;
    characterCounterDisplay: string;
    currentInputLength: number;
    maxInputLength: number;
    roomMessages: ChatMessage[];
    userMessage: string;
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
    }

    async ngOnInit() {
        if (!this.isTestGame) {
            this.configureChatSocketFeatures();
        }
        if (this.isResultsRoute) {
            this.roomMessages = await firstValueFrom(this.roomCommunicationService.getChatMessages(this.roomId as string));
        }
    }

    configureChatSocketFeatures() {
        const addMessage = (data: { authorName: string; timeString: string; message: string; sentByUser: boolean }) => {
            const chatMessage: ChatMessage = {
                authorName: data.authorName,
                time: data.timeString,
                message: data.message,
                sentByUser: data.sentByUser,
            };
            this.roomMessages.push(chatMessage);
        };

        this.socketService.on(ChatEvents.NewRoomMessage, addMessage);

        this.socketService.on(GameEvents.PlayerAbandonedGame, (playerName: string) => {
            if (this.isOrganizer) {
                const leftTime = new Date();
                const playerLeftMessage: ChatMessage = {
                    authorName: 'System',
                    time: leftTime.getHours() + ':' + leftTime.getMinutes() + ':' + leftTime.getSeconds(),
                    message: playerName + ' a quitté la partie.',
                    sentByUser: false,
                };
                this.roomMessages.push(playerLeftMessage);
            }
        });

        this.socketService.on(GameEvents.ShowResults, async () => {
            await firstValueFrom(this.roomCommunicationService.sendChatMessages(this.roomId, this.roomMessages));
        });
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
}
