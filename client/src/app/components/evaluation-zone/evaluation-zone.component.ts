import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { QRLAnswer } from '@common/qrl-answer';

@Component({
    selector: 'app-evaluation-zone',
    templateUrl: './evaluation-zone.component.html',
    styleUrls: ['./evaluation-zone.component.scss'],
})
export class EvaluationZoneComponent {
    @Input() answers: QRLAnswer[];
    @Input() questionPoints: number;
    @Input() roomId: string;
    @Output() enableNextQuestionButton: EventEmitter<null>;
    currentAnswerIndex: number;
    isEvaluationFinished: boolean;

    constructor(private socketClientService: SocketClientService) {
        this.enableNextQuestionButton = new EventEmitter<null>();
        this.currentAnswerIndex = 0;
        this.isEvaluationFinished = false;
    }

    givePoints(grade: number) {
        this.socketClientService.send(GameEvents.AddPointsToPlayer, {
            roomId: this.roomId,
            points: grade * this.questionPoints,
            name: this.answers[this.currentAnswerIndex].playerName,
        });
        if (this.currentAnswerIndex === this.answers.length - 1) {
            this.isEvaluationFinished = true;
            this.enableNextQuestionButton.emit();
        } else {
            this.currentAnswerIndex++;
        }
    }
}
