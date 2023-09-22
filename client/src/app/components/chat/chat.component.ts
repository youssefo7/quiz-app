import { Component, ElementRef, OnInit } from '@angular/core';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
    constructor(private elementRef: ElementRef) {}

    // Code tiré de stackOverflow: https://stackoverflow.com/questions/7745741/auto-expanding-textarea
    expandTextArea() {
        const textarea = this.elementRef.nativeElement.querySelector('#message');
        const heightLimit = 150;

        if (textarea) {
            textarea.oninput = () => {
                if (textarea) {
                    textarea.style.height = '';
                    textarea.style.height = Math.min(textarea.scrollHeight, heightLimit) + 'px';
                }
            };
        }
    }

    // TODO: Crée un indicateur du nombre de caractère inséré et restant

    ngOnInit() {
        this.expandTextArea();
    }
}
