import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatEvents } from '@app/events/chat.events';
import { GameEvents } from '@app/events/game.events';
import { ChatMessage } from '@app/interfaces/chat-message';
import { SocketClientService } from '@app/services/socket-client.service';

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
    private isTestGame: boolean;

    constructor(
        public socketService: SocketClientService,
        private route: ActivatedRoute,
    ) {
        this.maxInputLength = 200;
        this.currentInputLength = 0;
        this.characterCounterDisplay = `${this.currentInputLength} / ${this.maxInputLength}`;
        this.roomMessages = [];
        this.userMessage = '';
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
    }

    ngOnInit() {
        if (!this.isTestGame) {
            this.configureChatSocketFeatures();
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
