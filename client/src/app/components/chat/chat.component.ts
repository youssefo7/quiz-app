import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatMessage } from '@app/interfaces/chat-message';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
    @Input() isOrganizer: boolean;
    chatMessage: ChatMessage;
    characterCounterDisplay: string;
    currentInputLength: number;
    maxInputLength: number;
    roomMessages: ChatMessage[];
    userMessage: string;
    roomId: string;

    constructor(
        public socketService: SocketClientService,
        private route: ActivatedRoute,
    ) {
        this.maxInputLength = 200;
        this.currentInputLength = 0;
        this.characterCounterDisplay = `${this.currentInputLength} / ${this.maxInputLength}`;
        this.roomMessages = [];
        this.userMessage = '';
        this.roomId = this.route.snapshot.paramMap.get('roomId') as string;
    }

    ngOnInit() {
        this.configureChatSocketFeatures();
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

        this.socketService.on('newRoomMessage', addMessage);

        this.socketService.on('AbandonedGame', (playerName: string) => {
            if (this.isOrganizer) {
                const leftTime = new Date();
                const playerLeftMessage: ChatMessage = {
                    authorName: 'System',
                    time: leftTime.getHours() + ':' + leftTime.getMinutes() + ':' + leftTime.getSeconds(),
                    message: playerName + ' has left the game.',
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
        this.socketService.send('roomMessage', { roomId: this.roomId, message: this.userMessage });
        this.userMessage = '';
    }
}
