import { Component } from '@angular/core';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
    charactersCounterDisplay: string;
    currentCharactersLength: number;
    maxCharactersLength: number;

    constructor() {
        this.maxCharactersLength = 200;
        this.currentCharactersLength = 0;
        this.charactersCounterDisplay = `${this.currentCharactersLength} / ${this.maxCharactersLength}`;
    }

    expandTextArea(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        const heightLimit = 150;
        textarea.style.height = '';
        textarea.style.height = Math.min(textarea.scrollHeight, heightLimit) + 'px';
    }

    detectCharacterLengthOnInput(event: Event) {
        const inputValue = (event.target as HTMLInputElement).value;
        this.currentCharactersLength = inputValue.length;
        this.charactersCounterDisplay = `${this.currentCharactersLength} / ${this.maxCharactersLength}`;
    }
}
