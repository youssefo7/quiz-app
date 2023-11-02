import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatMessage } from '@app/interfaces/chat-message';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
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
        this.roomId = '';
        this.roomId = this.route.snapshot.paramMap.get('room') as string;
    }

    ngOnInit() {
        this.configureChatSocketFeatures();
    }

    configureChatSocketFeatures() {
        const addMessage = (data: { name: string; timeString: string; message: string; sentByYou: boolean }) => {
            const chatMessage: ChatMessage = { authorName: data.name, time: data.timeString, message: data.message, sentByYou: data.sentByYou };
            this.roomMessages.push(chatMessage);
        };

        this.socketService.on('newRoomMessage', addMessage);
        this.socketService.on('sentByYou', addMessage);
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

    sendMessageToRoom() {
        this.socketService.send('roomMessage', { roomId: this.roomId, message: this.userMessage });
        this.userMessage = '';
    }
}
