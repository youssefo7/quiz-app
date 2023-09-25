import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { TimeService } from '@app/services/time.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-question-zone',
    templateUrl: './question-zone.component.html',
    styleUrls: ['./question-zone.component.scss'],
})
export class QuestionZoneComponent implements OnInit, OnDestroy {
    @Output() pointsEarned: EventEmitter<number>;
    timerTime: number;
    isQuestionTransition: boolean;
    currentQuestionIndex: number;
    points: number;
    quiz: Quiz;
    question: Question;
    choicesChosen: boolean[];
    buttonStyle: { backgroundColor: string }[];
    bonusMessage: string;
    pointsDisplay: { display: string };
    bonusDisplay: { display: string };
    keyPressed: string;
    private mySubscription: Subscription;

    // Raison: J'injecte 5 services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
        private elementRef: ElementRef,
        private gameService: GameService,
        private readonly timeService: TimeService,
    ) {
        this.pointsEarned = new EventEmitter<number>();
        this.isQuestionTransition = false;
        // this.isQuestionDone = new BehaviorSubject<boolean>(false);
        // this.currentQuestion = new BehaviorSubject<number>(0);
        this.currentQuestionIndex = 0;
        this.points = 0;
        this.bonusMessage = '';
        this.pointsDisplay = { display: 'none' };
        this.buttonStyle = [{ backgroundColor: '' }];
    }

    @HostListener('keypress', ['$event'])
    preventDefaultEnter(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    }

    @HostListener('keyup', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        this.keyPressed = event.key;
        if (this.keyPressed === 'Enter') {
            this.submitAnswerOnClickEvent();
        } else {
            const keyNumber = parseInt(this.keyPressed, 10) - 1;
            this.toggleChoice(keyNumber);
        }
    }

    focusOnButton() {
        this.elementRef.nativeElement.querySelector('input[type="button"]')?.focus();
    }

    async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            return new Promise<void>((resolve) => {
                this.communicationService.getQuiz(id).subscribe((quiz) => {
                    this.quiz = quiz;
                    resolve();
                });
            });
        }
    }

    toggleChoice(index: number) {
        if (isNaN(index) || index < 0 || index >= this.choicesChosen.length) return;
        this.choicesChosen[index] = !this.choicesChosen[index];
    }

    getQuestion(index: number = 0) {
        if (index >= this.quiz.questions.length) return;
        this.question = this.quiz.questions[index];
        this.choicesChosen = new Array(this.question.choices.length).fill(false);
        this.question.choices.forEach((choice, buttonIndex) => {
            this.setButtonsToInitState(buttonIndex);
        });
    }

    async loadQuestions() {
        await this.getQuiz();
        this.getQuestion();
    }

    showPoints() {
        this.pointsDisplay = { display: 'block' };
    }

    hidePoints() {
        this.pointsDisplay = { display: 'none' };
    }

    isAnswerGood() {
        const isAnswerGood = this.choicesChosen.every((answer, index) => answer === this.question.choices[index].isCorrect);
        return isAnswerGood;
    }

    async submitAnswerOnClickEvent() {
        this.gameService.setButtonPressState = true;
        this.elementRef.nativeElement.querySelector('input[type="button"]')?.setAttribute('disabled', 'true');
        this.elementRef.nativeElement.querySelector('input[type="button"]')?.setAttribute('style', 'background-color: grey');
        this.displayCorrectAnswer();
        this.givePoints();
        this.isQuestionTransition = true;
    }

    async submitAnswerOnCountdownEvent() {
        this.elementRef.nativeElement.querySelector('input[type="button"]')?.setAttribute('disabled', 'true');
        this.elementRef.nativeElement.querySelector('input[type="button"]')?.setAttribute('style', 'background-color: grey');
        this.displayCorrectAnswer();
        this.givePoints();
    }

    displayCorrectAnswer() {
        this.question.choices.forEach((choice, index) => {
            this.setButtonsStateOnSubmit(index);
        });
        this.showPoints();
    }

    givePoints() {
        if (!this.isAnswerGood()) {
            this.points = 0;
            this.bonusMessage = '';
        } else {
            const bonus = 1.2;
            this.points = this.question.points * bonus;
            this.bonusMessage = '(20% bonus Woohoo!)';
        }
        this.pointsEarned.emit(this.points);
    }

    setButtonsToInitState(index: number) {
        this.buttonStyle[index] = {
            backgroundColor: '',
        };
        this.elementRef.nativeElement.querySelectorAll('button').forEach((button: HTMLButtonElement) => button.removeAttribute('disabled'));
        this.elementRef.nativeElement.querySelector('input[type="button"]')?.removeAttribute('disabled');
        this.elementRef.nativeElement.querySelector('input[type="button"]').style.removeProperty('background-color');
        this.hidePoints();
    }

    setButtonsStateOnSubmit(index: number) {
        this.buttonStyle[index] = {
            backgroundColor: this.question.choices[index].isCorrect ? 'rgb(97, 207, 72)' : 'red',
        };
        this.elementRef.nativeElement.querySelectorAll('button').forEach((button: HTMLButtonElement) => button.setAttribute('disabled', 'true'));
    }

    subscribeToTimer() {
        this.mySubscription = this.timeService.getTime().subscribe((time: number) => {
            this.timerTime = time;
            if (this.timerTime === 0) {
                if (!this.isQuestionTransition) {
                    this.submitAnswerOnCountdownEvent();
                    this.isQuestionTransition = true;
                } else {
                    this.isQuestionTransition = false;
                    ++this.currentQuestionIndex;
                    this.getQuestion(this.currentQuestionIndex);
                }
            }
        });
    }

    ngOnInit() {
        this.loadQuestions();
        this.subscribeToTimer();
    }

    ngOnDestroy() {
        this.mySubscription.unsubscribe();
    }
}
