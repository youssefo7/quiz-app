import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { PlayerSubmission } from '@common/player-submission';
import { PointsToAdd } from '@common/points-to-add';

interface GradeButtonState {
    isZeroGradePressed: boolean;
    is50GradePressed: boolean;
    is100GradePressed: boolean;
}

@Component({
    selector: 'app-evaluation-zone',
    templateUrl: './evaluation-zone.component.html',
    styleUrls: ['./evaluation-zone.component.scss'],
})
export class EvaluationZoneComponent implements OnInit {
    @Input() answers: PlayerSubmission[];
    @Input() questionPoints: number;
    @Input() roomId: string;
    @Output() enableNextQuestionButton: EventEmitter<null>;
    currentAnswerIndex: number;
    isEvaluationFinished: boolean;
    grade: number;
    isSubmitEvaluationDisabled: boolean;
    gradeButtonState: GradeButtonState;
    private playersPoints: PointsToAdd[];

    constructor(private socketClientService: SocketClientService) {
        this.enableNextQuestionButton = new EventEmitter<null>();
        this.currentAnswerIndex = 0;
        this.isEvaluationFinished = false;
        this.playersPoints = [];
        this.grade = 0;
        this.isSubmitEvaluationDisabled = true;
        this.gradeButtonState = {
            isZeroGradePressed: false,
            is50GradePressed: false,
            is100GradePressed: false,
        };
    }

    ngOnInit() {
        this.answers.sort((player1, player2) => (player1.name as string).localeCompare(player2.name as string));
    }

    setGrade(grade: number) {
        const halfPoints = 0.5;
        this.grade = grade;
        this.isSubmitEvaluationDisabled = false;

        switch (grade) {
            case 0:
                this.setGradeButtonState(true, false, false);
                break;
            case halfPoints:
                this.setGradeButtonState(false, true, false);
                break;
            case 1:
                this.setGradeButtonState(false, false, true);
                break;
        }
    }

    givePoints() {
        this.playersPoints.push({
            name: this.answers[this.currentAnswerIndex].name,
            pointsToAdd: this.grade * this.questionPoints,
            roomId: this.roomId,
        });

        if (this.currentAnswerIndex === this.answers.length - 1) {
            this.playersPoints.forEach((playerPoints) => {
                this.socketClientService.send(GameEvents.AddPointsToPlayer, playerPoints);
            });
            this.isEvaluationFinished = true;
            this.enableNextQuestionButton.emit();
        } else {
            this.currentAnswerIndex++;
            this.gradeButtonState = {
                isZeroGradePressed: false,
                is50GradePressed: false,
                is100GradePressed: false,
            };
            this.isSubmitEvaluationDisabled = true;
        }
    }

    private setGradeButtonState(isZeroGradePressed: boolean, is50GradePressed: boolean, is100GradePressed: boolean) {
        this.gradeButtonState.isZeroGradePressed = isZeroGradePressed;
        this.gradeButtonState.is50GradePressed = is50GradePressed;
        this.gradeButtonState.is100GradePressed = is100GradePressed;
    }
}
