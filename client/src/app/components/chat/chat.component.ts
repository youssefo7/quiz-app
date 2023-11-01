import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatMessage } from '@app/interfaces/chat-message';
import { SocketClientService } from '@app/services/socket-client.service';
import { Socket } from 'socket.io-client';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
    socket: Socket;
    chatMessage: ChatMessage;
    characterCounterDisplay: string;
    roomMessages: ChatMessage[];
    roomMessage: string;
    roomId: string;
    private currentInputLength: number;

    constructor(
        public socketService: SocketClientService,
        private route: ActivatedRoute,
    ) {
        this.maxInputLength = 200;
        this.currentInputLength = 0;
        this.characterCounterDisplay = `${this.currentInputLength} / 200`;
        this.roomMessages = [];
        this.roomMessage = '';
        this.roomId = '';
    }

    ngOnInit(): void {
        this.roomId = this.route.snapshot.paramMap.get('room') as string;
        this.configureChatSocketFeatures();
    }

    configureChatSocketFeatures() {
        this.socketService.on('newRoomMessage', (data: { name: string; timeString: string; message: string; sentByYou: boolean }) => {
            const chatMessage: ChatMessage = { name: data.name, time: data.timeString, message: data.message, sentByYou: data.sentByYou };
            this.roomMessages.push(chatMessage);
        });

        this.socketService.on('sentByYou', (data: { name: string; timeString: string; message: string; sentByYou: boolean }) => {
            const chatMessage: ChatMessage = { name: data.name, time: data.timeString, message: data.message, sentByYou: data.sentByYou };
            this.roomMessages.push(chatMessage);
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
        this.characterCounterDisplay = `${this.currentInputLength} / 200`;
    }

    sendMessageToRoom() {
        this.socketService.send('roomMessage', { roomId: this.roomId, message: this.roomMessage });
        this.roomMessage = '';
    }
}
