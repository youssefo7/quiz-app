// any est nécessaire pour espionner les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */

// Raison: On est à des mockQuiz qui prennent beaucoup de place, mais on ne veut pas les déplacer dans un fichier séparé
/* eslint-disable max-lines */
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { GameService } from '@app/services/game.service';
import { QuizCommunicationService } from '@app/services/quiz-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { Constants, QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { PlayerPoints } from '@common/player-points';
import { PlayerSubmission } from '@common/player-submission';
import { TimeEvents } from '@common/time.events';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { QuestionZoneComponent } from './question-zone.component';

class MockSocketClientService extends SocketClientService {
    private mockSocketExists = true;

    override connect() {
        // vide
    }

    override socketExists() {
        return this.mockSocketExists;
    }

    setSocketExists(value: boolean) {
        this.mockSocketExists = value;
    }
}

describe('QuestionZoneComponent', () => {
    let component: QuestionZoneComponent;
    let fixture: ComponentFixture<QuestionZoneComponent>;
    let gameService: GameService;
    let elementRef: HTMLElement;
    let debugElement: DebugElement;
    let setButtonSpy: jasmine.Spy;
    let clientSocketServiceMock: MockSocketClientService;
    let quizCommunicationServiceMock: jasmine.SpyObj<QuizCommunicationService>;
    let timeServiceMock: jasmine.SpyObj<TimeService>;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'send', 'socketExists']);
        quizCommunicationServiceMock = jasmine.createSpyObj('QuizCommunicationService', ['getQuiz']);
        quizCommunicationServiceMock.getQuiz.and.returnValue(of(mockedQuiz));
        timeServiceMock = jasmine.createSpyObj('TimeService', ['getTime', 'stopTimer', 'isTimerFinished']);
        timeServiceMock.getTime.and.returnValue(of(0));
        timeServiceMock.isTimerFinished.and.returnValue(of(false));
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        clientSocketServiceMock = new MockSocketClientService();
        clientSocketServiceMock.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [QuestionZoneComponent],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: ['test'] } } },
                { provide: SocketClientService, useValue: clientSocketServiceMock },
                { provide: QuizCommunicationService, useValue: quizCommunicationServiceMock },
                { provide: TimeService, useValue: timeServiceMock },
            ],
        }).compileComponents();
        gameService = TestBed.inject(GameService);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(QuestionZoneComponent);
        component = fixture.componentInstance;
        debugElement = fixture.debugElement;
        elementRef = debugElement.nativeElement;
        component.quiz = validMockQuiz;
        component['roomId'] = '123';
        setButtonSpy = spyOnProperty(gameService, 'setSubmitButtonPressState', 'set');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should prevent default propagation of the enter key', () => {
        const event = new KeyboardEvent('keypress', { key: 'Enter' });
        const preventDefaultSpy = spyOn(event, 'preventDefault');
        component.preventDefaultEnter(event);
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not submit the answer when enter key is pressed if the submit button is disabled', () => {
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        component.isSubmitDisabled = true;
        const submitAnswerSpy = spyOn(component, 'submitAnswerOnClick');
        component.handleKeyboardInput(event);
        expect(submitAnswerSpy).not.toHaveBeenCalled();
    });

    it('should submit the answer when enter key is pressed', () => {
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        component.isSubmitDisabled = false;
        const submitAnswerSpy = spyOn(component, 'submitAnswerOnClick');
        component.handleKeyboardInput(event);
        expect(submitAnswerSpy).toHaveBeenCalled();
    });

    it('should not call methods on initialization when socket does not exist', () => {
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        const subscribeToTimerSpy = spyOn<any>(component, 'subscribeToTimer');
        const handleBonusSpy = spyOn<any>(component, 'handleBonusPoints');
        const reactToQRLSpy = spyOn<any>(component, 'reactToQRLEvaluation');
        clientSocketServiceMock.setSocketExists(false);
        component.ngOnInit();

        expect(getQuestionSpy).not.toHaveBeenCalled();
        expect(subscribeToTimerSpy).not.toHaveBeenCalled();
        expect(handleBonusSpy).not.toHaveBeenCalled();
        expect(reactToQRLSpy).not.toHaveBeenCalled();
    });

    it('should unsubscribe from subscriptions when in a test game', () => {
        component['isTestGame'] = true;
        component['subscribeToTimer']();
        const timerUnsubscribeSpy = spyOn<any>(component['isTimerFinishedSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(timerUnsubscribeSpy).toHaveBeenCalled();
    });

    it('should call stopPropagation for QCM questions', () => {
        component.question.type = QTypes.QCM;
        const event = new Event('test');
        spyOn(event, 'stopPropagation');
        component.stopPropagation(event);
        expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should focus on the button element for QCM questions', () => {
        // On a besoin de créer un bouton mock afin de tester l'appel de l'attribut focus
        const mockButton = document.createElement('button');
        spyOn(mockButton, 'focus');
        spyOn(component['elementRef'].nativeElement, 'querySelector').and.returnValue(mockButton);
        component.focusOnButtons();
        expect(mockButton.focus).toHaveBeenCalled();
    });

    it('should toggle choices and change the submit button state when other keys are pressed', () => {
        const event = new KeyboardEvent('keyup', { key: '1' });
        const toggleChoicesSpy = spyOn(component, 'toggleChoice');
        const changeSubmitButtonStateSpy = spyOn(component, 'setSubmitButtonStateOnChoices');
        component.handleKeyboardInput(event);
        expect(toggleChoicesSpy).toHaveBeenCalled();
        expect(changeSubmitButtonStateSpy).toHaveBeenCalled();
    });

    it('should fetch the first question of the quiz for a given game', () => {
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        component.ngOnInit();
        expect(getQuestionSpy).toHaveBeenCalled();
    });

    it('should focus on the buttons when the question zone container is clicked', () => {
        const focusOnButtonSpy = spyOn(component, 'focusOnButtons');
        const questionZoneContainer = elementRef.querySelector('#question-zone-container') as HTMLElement;
        if (questionZoneContainer) {
            questionZoneContainer.addEventListener('click', () => {
                focusOnButtonSpy();
            });
            questionZoneContainer.click();
            expect(focusOnButtonSpy).toHaveBeenCalled();
        }
    });

    it('should submit answers if the timer is at 0, the question is not transitioning and the game has not ended', () => {
        const showResultSpy = spyOn<any>(component, 'showResult');
        component['isTestGame'] = true;
        component['subscribeToTimer']();
        expect(showResultSpy).toHaveBeenCalled();
    });

    it('should go to the next question if the timer is at 0, the question is transitioning and the game has not ended', () => {
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        const showResultSpy = spyOn<any>(component, 'showResult');
        const currentIndex = component['currentQuestionIndex'];
        const handleEndOfTimerSpy = spyOn<any>(component, 'handleEndOfTimer').and.callThrough();
        const isTransitionTimer = true;
        component['isTestGame'] = true;
        timeServiceMock.isTimerFinished.and.returnValue(of(isTransitionTimer));
        component['subscribeToTimer']();

        expect(handleEndOfTimerSpy).toHaveBeenCalledWith(isTransitionTimer);
        expect(showResultSpy).not.toHaveBeenCalled();
        expect(component['currentQuestionIndex']).toEqual(currentIndex + 1);
        expect(getQuestionSpy).toHaveBeenCalledWith(currentIndex + 1);
    });

    it('should do nothing if the timer is at 0 and the game has ended', () => {
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        const showResultSpy = spyOn<any>(component, 'showResult');
        const currentIndex = component['currentQuestionIndex'];
        component['subscribeToTimer']();

        expect(showResultSpy).not.toHaveBeenCalled();
        expect(component['currentQuestionIndex']).toEqual(currentIndex);
        expect(getQuestionSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if the timer is not at 0 and the game has not ended', () => {
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        const showResultSpy = spyOn<any>(component, 'showResult');
        timeServiceMock.getTime.and.returnValue(of(1));
        const currentIndex = component['currentQuestionIndex'];
        component['subscribeToTimer']();

        expect(showResultSpy).not.toHaveBeenCalled();
        expect(component['currentQuestionIndex']).toEqual(currentIndex);
        expect(getQuestionSpy).not.toHaveBeenCalled();
    });

    it('should update character counter display and set submit button state based on user input', () => {
        component.userAnswer = 'Test Answer';
        const setSubmitButtonToDisabledSpy = spyOn<any>(component, 'setSubmitButtonToDisabled');
        const handleFieldInteractionSpy = spyOn<any>(component, 'handleFieldInteraction');
        component.detectCharacterLengthOnInput();

        expect(component.characterCounterDisplay).toBe('11 / ' + Constants.MAX_TEXTAREA_LENGTH);
        expect(setSubmitButtonToDisabledSpy).toHaveBeenCalledWith(false);

        component.isTestGame = false;
        component.detectCharacterLengthOnInput();
        expect(handleFieldInteractionSpy).toHaveBeenCalledWith(component['hasInteractedOnce']);
    });

    it('should send FieldInteraction event and update hasInteractedOnce if has not interacted before', () => {
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        component['hasInteractedOnce'] = false;
        component['handleFieldInteraction'](component['hasInteractedOnce']);

        expect(sendSpy).toHaveBeenCalledWith(GameEvents.FieldInteraction, component.roomId);
        expect(component['hasInteractedOnce']).toBeTrue();
    });

    it('should send QRLAnswerUpdate event when handleFieldInteraction is called with hasInteractedOnce being true', () => {
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        component['hasModifiedText'] = false;
        component['question'] = validMockQuiz.questions[1];
        component['handleFieldInteraction'](true);

        expect(component['hasModifiedText']).toBeTruthy();
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.QRLAnswerUpdate, { roomId: component.roomId, hasModifiedText: component['hasModifiedText'] });
    });

    it('should listen to TimerInterrupted event when testGame is false and call methods', () => {
        const handleEndOfTimerSpy = spyOn<any>(component, 'handleEndOfTimer');
        component['isTestGame'] = false;
        component['question'].type = QTypes.QCM;
        socketHelper.peerSideEmit(TimeEvents.TimerInterrupted);
        expect(handleEndOfTimerSpy).toHaveBeenCalled();
    });

    it('should react to TimerFinished event by calling handleEndOfTimer', () => {
        const isTransitionTimer = true;
        const handleEndOfTimerSpy = spyOn<any>(component, 'handleEndOfTimer');
        socketHelper.peerSideEmit(TimeEvents.TimerFinished, isTransitionTimer);
        expect(handleEndOfTimerSpy).toHaveBeenCalledWith(isTransitionTimer);
    });

    it('should update correctly when transition timer is finished and it is not a test game', () => {
        const isTransitionTimer = true;
        const resetPointsManagerSpy = spyOn(gameService, 'resetPointsManager').and.callThrough();
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        const initialIndex = component['currentQuestionIndex'];
        component['handleEndOfTimer'](isTransitionTimer);

        expect(component['hasReceivedBonus']).toBeFalsy();
        expect(component['hasInteractedOnce']).toBeFalsy();
        expect(resetPointsManagerSpy).toHaveBeenCalled();
        expect(component['currentQuestionIndex']).toBe(initialIndex + 1);
        expect(getQuestionSpy).toHaveBeenCalledWith(initialIndex + 1);
        expect(component['hasSentAnswer']).toBeFalse();
    });

    it('should listen to CurrentTimer event and handle correctly when the event is received', () => {
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const time = 5;
        component['socketTime'] = time;
        const textChangePeriod = Constants.TEXT_CHANGE_PERIOD;
        component['textDetectionTime'] = time + textChangePeriod;
        component['question'] = validMockQuiz.questions[1];
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer, time);
        expect(component['hasModifiedText']).toBeFalsy();
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.QRLAnswerUpdate, {
            roomId: component['roomId'],
            hasModifiedText: component['hasModifiedText'],
        });
    });

    it('should call handleAnswerSubmission and givePointsRealGame when not in transition and in a real game', () => {
        const handleAnswerSubmissionSpy = spyOn<any>(component, 'handleAnswerSubmission');
        const givePointsRealGameSpy = spyOn<any>(component, 'givePointsRealGame');
        component['hasSentAnswer'] = false;
        const isTransitionTimer = false;
        component['handleEndOfTimer'](isTransitionTimer);

        expect(handleAnswerSubmissionSpy).toHaveBeenCalledWith(true);
        expect(givePointsRealGameSpy).toHaveBeenCalled();
    });

    it('should send AddPointsToPlayer event when givePointsRealGame() is called with hasReceivedBonus being false', () => {
        const expectedPoints = 100;
        component.pointsManager = { points: 0, pointsToDisplay: 0, pointsMessage: '', doesDisplayPoints: false };
        component.question = validMockQuiz.questions[0];
        component.chosenChoices = [true, false];
        component.roomId = '123';

        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const showResultSpy = spyOn<any>(component, 'showResult');

        spyOn(component['gameService'], 'givePointsQCM').and.returnValue({
            ...component.pointsManager,
            points: expectedPoints,
        });

        component['hasReceivedBonus'] = false;
        component['givePointsRealGame']();

        expect(sendSpy).toHaveBeenCalledWith(GameEvents.AddPointsToPlayer, {
            pointsToAdd: expectedPoints,
            roomId: '123',
        });
        expect(showResultSpy).toHaveBeenCalled();
    });

    it('should handle QRL question answer submission correctly', () => {
        const setSubmitButtonToDisabledSpy = spyOn<any>(component, 'setSubmitButtonToDisabled');
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const isTimerFinished = false;
        component['question'] = validMockQuiz.questions[1];
        component['handleAnswerSubmission'](isTimerFinished);

        expect(component.isTextareaDisabled).toBeTrue();
        expect(component['hasSentAnswer']).toBeTrue();
        expect(setSubmitButtonToDisabledSpy).toHaveBeenCalledWith(true);

        expect(sendSpy).toHaveBeenCalledWith(GameEvents.SubmitAnswer, {
            roomId: '123',
            answer: '',
            hasSubmittedBeforeEnd: !isTimerFinished,
            questionType: QTypes.QRL,
        });
    });

    it('should create an array of choice with values set to false if the question index id is valid', () => {
        const firstQuestionIndex = 0;
        const expectChoiceArray = [false, false];
        component['getQuestion'](firstQuestionIndex);
        expect(component.chosenChoices).toEqual(expectChoiceArray);
    });

    it('should properly initialize properties for non-QCM questions', () => {
        const indexQRL = 1;
        component['getQuestion'](indexQRL);

        expect(component['hasModifiedText']).toBeFalse();
        expect(component['textDetectionTime']).toBe(0);
        expect(component.isTextareaDisabled).toBeFalse();
        expect(component.userAnswer).toBe('');
        expect(component.characterCounterDisplay).toBe(`0 / ${Constants.MAX_TEXTAREA_LENGTH}`);
    });

    it('should not create an array of choice if the question index is invalid', () => {
        const invalidIndex = 2;
        const setButtonToInitStateSpy = spyOn<any>(component, 'setButtonToInitState');
        component.quiz = invalidMockedQuiz;
        component.chosenChoices = [];
        component['getQuestion'](invalidIndex);
        expect(component.chosenChoices.length).toEqual(0);
        expect(setButtonToInitStateSpy).not.toHaveBeenCalled();
    });

    it('should toggle the choice if the index is valid', () => {
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const validIndex = 1;
        component.chosenChoices = [false, false, false];

        component.toggleChoice(validIndex);
        expect(component.chosenChoices).toEqual([false, true, false]);
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.ToggleSelect, {
            roomId: component['roomId'],
            questionChoiceIndex: validIndex,
            isSelect: true,
        });

        component.toggleChoice(validIndex);
        expect(component.chosenChoices).toEqual([false, false, false]);
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.ToggleSelect, {
            roomId: component['roomId'],
            questionChoiceIndex: validIndex,
            isSelect: false,
        });
    });

    it('should not toggle the choice if the index is invalid', () => {
        const invalidIndex1 = 3;
        const invalidIndex2 = -1;
        component.chosenChoices = [false, false, false];
        component.toggleChoice(invalidIndex1);
        component.toggleChoice(invalidIndex2);
        expect(component.chosenChoices).toEqual([false, false, false]);
    });

    it('should disable or enable the submit button if setSubmitButtonToDisabled is called', () => {
        component.isSubmitDisabled = true;
        component['setSubmitButtonToDisabled'](false);
        expect(component.isSubmitDisabled).toBeFalse();

        component['setSubmitButtonToDisabled'](true);
        expect(component.isSubmitDisabled).toBeTrue();
    });

    it('should disable the submit button if no choice is selected', () => {
        component.chosenChoices = [false, false, false];
        component.setSubmitButtonStateOnChoices();
        expect(component.isSubmitDisabled).toBeTrue();
    });

    it('should enable the submit button if at least one choice is selected', () => {
        component.chosenChoices = [false, false, true];
        component.setSubmitButtonStateOnChoices();
        expect(component.isSubmitDisabled).toBeFalse();
    });

    it('should set the games button to their initial state when setButtonToInitState is called', () => {
        const buttonIndex = 0;
        component.choiceButtonStyle[buttonIndex] = { backgroundColor: 'red' };
        component.isChoiceButtonDisabled = true;
        component['setButtonToInitState'](buttonIndex);

        expect(component.isChoiceButtonDisabled).toBeFalse();
        expect(component.choiceButtonStyle[buttonIndex]).toEqual({ backgroundColor: '' });
    });

    it('should change the buttons state when setButtonStateOnSubmit is called', () => {
        const firstButtonIndex = 0;
        const secondButtonIndex = 1;
        component.choiceButtonStyle[firstButtonIndex] = { backgroundColor: '' };
        component.choiceButtonStyle[secondButtonIndex] = { backgroundColor: '' };
        component.isChoiceButtonDisabled = false;
        component['setButtonStateOnSubmit'](firstButtonIndex);
        component['setButtonStateOnSubmit'](secondButtonIndex);

        expect(component.isChoiceButtonDisabled).toBeTrue();
        expect(component.choiceButtonStyle[firstButtonIndex]).toEqual({ backgroundColor: 'rgb(97, 207, 72)' });
        expect(component.choiceButtonStyle[secondButtonIndex]).toEqual({ backgroundColor: 'red' });
    });

    it('should submit answer on click event if user is in a test game', () => {
        component['isTestGame'] = true;
        const showResultSpy = spyOn<any>(component, 'showResult');
        const handleEndOfTimerSpy = spyOn<any>(component, 'handleEndOfTimer').and.callThrough();
        const isTransitionTimer = false;
        component.submitAnswerOnClick();
        expect(setButtonSpy).toHaveBeenCalledWith(true);

        timeServiceMock.isTimerFinished.and.returnValue(of(isTransitionTimer));
        component['subscribeToTimer']();

        expect(handleEndOfTimerSpy).toHaveBeenCalledWith(isTransitionTimer);
        expect(showResultSpy).toHaveBeenCalled();
    });

    it('should disable submit button if test game is false and send SubmitAnswer event', () => {
        const disableSubmitButtonSpy = spyOn<any>(component, 'setSubmitButtonToDisabled');
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const submission: PlayerSubmission = { roomId: component['roomId'], hasSubmittedBeforeEnd: true, questionType: QTypes.QCM };

        component['isTestGame'] = false;
        component.handleKeyboardInput(event);
        component.submitAnswerOnClick();

        expect(disableSubmitButtonSpy).toHaveBeenCalledWith(true);
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.SubmitAnswer, submission);
        expect(component['hasSentAnswer']).toBeTrue();
    });

    it('should send GoodAnswer event when answer is right and not in testGame', () => {
        component.question.choices = [
            { text: 'test', isCorrect: true },
            { text: 'test2', isCorrect: false },
        ];
        component.chosenChoices = [true, false];

        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const submission: PlayerSubmission = { roomId: component['roomId'], hasSubmittedBeforeEnd: true, questionType: QTypes.QCM };

        component['isTestGame'] = false;
        component.handleKeyboardInput(event);
        component.submitAnswerOnClick();

        expect(sendSpy).toHaveBeenCalledWith(GameEvents.SubmitAnswer, submission);
        expect(component['hasSentAnswer']).toBeTrue();
    });

    it('should send GoodAnswer event when answer is good and timer is finished', () => {
        component.question.choices = [
            { text: 'test', isCorrect: true },
            { text: 'test2', isCorrect: false },
        ];
        component.chosenChoices = [true, false];

        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const disableButtonSpy = spyOn<any>(component, 'setSubmitButtonToDisabled');
        const submission: PlayerSubmission = { roomId: component['roomId'], hasSubmittedBeforeEnd: false, questionType: QTypes.QCM };
        component['handleAnswerSubmission'](true);

        expect(disableButtonSpy).toHaveBeenCalledWith(true);
        expect(component['hasSentAnswer']).toBeTrue();
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.GoodAnswer, submission);
    });

    it('should display the correct answer', () => {
        spyOn<any>(component, 'setButtonStateOnSubmit');
        component['displayCorrectAnswer']();
        expect(component['setButtonStateOnSubmit']).toHaveBeenCalledTimes(2);
        expect(component['pointsManager'].doesDisplayPoints).toBeTrue();
    });

    it('should handle bonus points on init', () => {
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const bonus = 0.2;
        const pointsToAdd: PlayerPoints = { pointsToAdd: component.question.points * bonus, roomId: component['roomId'] };
        socketHelper.peerSideEmit(GameEvents.GiveBonus, component['roomId']);
        component.ngOnInit();

        expect(sendSpy).toHaveBeenCalledWith(GameEvents.AddPointsToPlayer, pointsToAdd);
    });

    it('should show results', () => {
        component['isTestGame'] = true;
        spyOn<any>(component, 'setSubmitButtonToDisabled');
        spyOn<any>(component, 'displayCorrectAnswer');
        component['showResult']();
        expect(component['setSubmitButtonToDisabled']).toHaveBeenCalledWith(true);
        expect(component['displayCorrectAnswer']).toHaveBeenCalled();
    });

    it('should listen to AddPointsToPlayer event when reactToQRLEvaluation() is called', () => {
        const playerPoints = 100;
        component.question = validMockQuiz.questions[1];
        const givePointsQRLSpy = spyOn(component['gameService'], 'givePointsQRL');
        const showResultSpy = spyOn<any>(component, 'showResult');
        socketHelper.peerSideEmit(GameEvents.AddPointsToPlayer, playerPoints);
        expect(givePointsQRLSpy).toHaveBeenCalled();
        expect(showResultSpy).toHaveBeenCalled();
    });
});

const invalidMockedQuiz = {
    id: '123',
    title: 'Test quiz',
    description: 'Test quiz description',
    visibility: true,
    duration: 60,
    lastModification: '2018-11-13T20:20:39+00:00',
    questions: [],
};

const validMockQuiz = {
    id: '123',
    title: 'Test quiz',
    description: 'Test quiz description',
    visibility: true,
    duration: 60,
    lastModification: '2018-11-13T20:20:39+00:00',
    questions: [
        {
            type: 'QCM',
            text: 'Quel événement a marqué le début de la Première Guerre mondiale en 1914 ?',
            points: 40,
            choices: [
                {
                    text: "L'assassinat de l'archiduc François-Ferdinand d'Autriche",
                    isCorrect: true,
                },
                {
                    text: 'Le krach boursier de 1929',
                    isCorrect: false,
                },
            ],
        },
        {
            type: 'QRL',
            text: "Expliquez l'utilité des spy dans les tests ? ",
            points: 80,
        },
    ],
};

const mockedQuiz = {
    id: '123',
    title: 'Test quiz',
    description: 'Test quiz description',
    visibility: true,
    duration: 60,
    lastModification: '2018-11-13T20:20:39+00:00',
    questions: [],
};
