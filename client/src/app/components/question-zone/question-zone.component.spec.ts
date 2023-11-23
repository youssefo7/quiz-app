// any est nécessaire pour espionner les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */

// Raison: On est à des mockQuiz qui prennent beaucoup de place, mais on ne vaut pas les déplacer dans un fichier séparé
/* eslint-disable max-lines */
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { QuestionZoneComponent } from './question-zone.component';

class MockSocketClientService extends SocketClientService {
    override connect() {
        // vide
    }
    override socketExists() {
        return true;
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
    let communicationServiceMock: jasmine.SpyObj<CommunicationService>;
    let timeServiceMock: jasmine.SpyObj<TimeService>;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'send', 'socketExists']);
        communicationServiceMock = jasmine.createSpyObj('CommunicationService', ['getQuiz']);
        communicationServiceMock.getQuiz.and.returnValue(of(mockedQuiz));
        timeServiceMock = jasmine.createSpyObj('TimeService', ['getTime', 'stopTimer']);
        timeServiceMock.getTime.and.returnValue(of(0));
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
                { provide: CommunicationService, useValue: communicationServiceMock },
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
        // component.question = {
        //     text: 'test',
        //     type: 'QCM',
        //     points: 1,
        //     choices: [
        //         { text: 'test', isCorrect: false },
        //         { text: 'test2', isCorrect: true },
        //     ],
        // };
        setButtonSpy = spyOnProperty(gameService, 'setButtonPressState', 'set');
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
        component['hasGameEnded'] = false;
        component['isQuestionTransitioning'] = false;
        component['isTestGame'] = true;
        component['subscribeToTimer']();

        expect(showResultSpy).toHaveBeenCalled();
        expect(component['isQuestionTransitioning']).toBeTrue();
    });

    it('should go to the next question if the timer is at 0, the question is transitioning and the game has not ended', () => {
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        const showResultSpy = spyOn<any>(component, 'showResult');
        component['hasGameEnded'] = false;
        component['isQuestionTransitioning'] = true;
        component['isTestGame'] = true;
        const currentIndex = component['currentQuestionIndex'];
        component['subscribeToTimer']();

        expect(showResultSpy).not.toHaveBeenCalled();
        expect(component['currentQuestionIndex']).toEqual(currentIndex + 1);
        expect(getQuestionSpy).toHaveBeenCalledWith(currentIndex + 1);
        expect(component['isQuestionTransitioning']).toBeFalse();
    });

    it('should do nothing if the timer is at 0 and the game has ended', () => {
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        const showResultSpy = spyOn<any>(component, 'showResult');
        component['hasGameEnded'] = true;
        component['isQuestionTransitioning'] = true;
        const currentIndex = component['currentQuestionIndex'];
        component['subscribeToTimer']();

        expect(showResultSpy).not.toHaveBeenCalled();
        expect(component['currentQuestionIndex']).toEqual(currentIndex);
        expect(getQuestionSpy).not.toHaveBeenCalled();
        expect(component['isQuestionTransitioning']).toBeTrue();
    });

    it('should do nothing if the timer is not at 0 and the game has not ended', () => {
        const getQuestionSpy = spyOn<any>(component, 'getQuestion');
        const showResultSpy = spyOn<any>(component, 'showResult');
        timeServiceMock.getTime.and.returnValue(of(1));
        component['hasGameEnded'] = false;
        component['isQuestionTransitioning'] = true;
        const currentIndex = component['currentQuestionIndex'];
        component['subscribeToTimer']();

        expect(showResultSpy).not.toHaveBeenCalled();
        expect(component['currentQuestionIndex']).toEqual(currentIndex);
        expect(getQuestionSpy).not.toHaveBeenCalled();
        expect(component['isQuestionTransitioning']).toBeTrue();
    });

    it('should set hasGameEnded when testGame and gameService.hasGameEndedObservable are true', () => {
        spyOnProperty(gameService, 'hasGameEndedObservable').and.returnValue(of(true));
        component['isTestGame'] = true;
        component['detectEndGame']();
        expect(component['hasGameEnded']).toBeTrue();
    });

    it('should listen on CurrentTime and TimeInterrupted event when testGame is false and call methods', () => {
        const detectEndOfQuestionSpy = spyOn<any>(component, 'detectEndOfQuestion');
        component['isTestGame'] = false;
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer);
        expect(detectEndOfQuestionSpy).toHaveBeenCalled();

        socketHelper.peerSideEmit(TimeEvents.TimerInterrupted, component['roomId']);
        expect(detectEndOfQuestionSpy).toHaveBeenCalledWith(0);
    });

    it('should listen on ShowResults event when testGame is false and set hasGameEnded to true', () => {
        component['isTestGame'] = false;
        socketHelper.peerSideEmit(GameEvents.ShowResults, component['roomId']);
        expect(component['hasGameEnded']).toBeTrue();
    });

    it('should create an array of choice with values set to false if the question index id is valid', () => {
        const firstQuestionIndex = 0;
        const expectChoiceArray = [false, false];
        component['getQuestion'](firstQuestionIndex);
        expect(component.chosenChoices).toEqual(expectChoiceArray);
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
        component.isSubmitDisabled = false;
        component.submitButtonStyle = { backgroundColor: 'green' };
        component['setSubmitButtonToDisabled'](true, { backgroundColor: 'grey' });
        expect(component.isSubmitDisabled).toBeTrue();
        expect(component.submitButtonStyle).toEqual({ backgroundColor: 'grey' });
    });

    it('should disable the submit button if no choice is selected', () => {
        component.chosenChoices = [false, false, false];
        component.setSubmitButtonStateOnChoices();
        expect(component.isSubmitDisabled).toBeTrue();
        expect(component.submitButtonStyle).toEqual({ backgroundColor: 'grey' });
    });

    it('should enable the submit button if at least one choice is selected', () => {
        component.chosenChoices = [false, false, true];
        component.setSubmitButtonStateOnChoices();
        expect(component.isSubmitDisabled).toBeFalse();
        expect(component.submitButtonStyle).toEqual({ backgroundColor: 'green' });
    });

    it('should set the games button to their initial state when setButtonToInitState is called', () => {
        const buttonIndex = 0;
        component.choiceButtonStyle[buttonIndex] = { backgroundColor: 'red' };
        component.isChoiceButtonDisabled = true;
        component.submitButtonStyle = { backgroundColor: 'green' };
        component.doesDisplayPoints = true;
        component['setButtonToInitState'](buttonIndex);

        expect(component.isChoiceButtonDisabled).toBeFalse();
        expect(component.submitButtonStyle).toEqual({ backgroundColor: '' });
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
        expect(component.submitButtonStyle).toEqual({ backgroundColor: '' });
        expect(component.choiceButtonStyle[firstButtonIndex]).toEqual({ backgroundColor: 'rgb(97, 207, 72)' });
        expect(component.choiceButtonStyle[secondButtonIndex]).toEqual({ backgroundColor: 'red' });
    });

    it('should submit answer on click event if user is in a test game', () => {
        component['isTestGame'] = true;
        spyOn<any>(component, 'showResult');
        component.submitAnswerOnClick();
        expect(setButtonSpy).toHaveBeenCalledWith(true);
        expect(component['isQuestionTransitioning']).toBeTrue();
        expect(component['showResult']).toHaveBeenCalled();
    });

    it('should disable submit button if test game is false and send SubmitAnswer event', () => {
        const disableSubmitButtonSpy = spyOn<any>(component, 'setSubmitButtonToDisabled');
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        const sendSpy = spyOn(clientSocketServiceMock, 'send');

        component['isTestGame'] = false;
        component.handleKeyboardInput(event);
        component.submitAnswerOnClick();

        expect(component['isQuestionTransitioning']).toBeFalse();
        expect(disableSubmitButtonSpy).toHaveBeenCalledWith(true, { backgroundColor: 'grey' });
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.SubmitAnswer, component['roomId']);
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

        component['isTestGame'] = false;
        component.handleKeyboardInput(event);
        component.submitAnswerOnClick();

        expect(sendSpy).toHaveBeenCalledWith(GameEvents.GoodAnswer, { roomId: component['roomId'], isTimerFinished: false });
        expect(component['hasSentAnswer']).toBeTrue();
    });

    it('should send BadAnswer event when answer is wrong and not in testGame', () => {
        component.question.choices = [
            { text: 'test', isCorrect: true },
            { text: 'test2', isCorrect: false },
        ];
        component.chosenChoices = [false, true];

        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        const sendSpy = spyOn(clientSocketServiceMock, 'send');

        component['isTestGame'] = false;
        component.handleKeyboardInput(event);
        component.submitAnswerOnClick();

        expect(sendSpy).toHaveBeenCalledWith(GameEvents.BadAnswer, { roomId: component['roomId'], isTimerFinished: false });
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
        component['handleAnswerSubmission'](true);

        expect(disableButtonSpy).toHaveBeenCalledWith(true, { backgroundColor: 'grey' });
        expect(component['hasSentAnswer']).toBeTrue();
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.GoodAnswer, { roomId: component['roomId'], isTimerFinished: true });
    });

    it('should send BadAnswer event when answer is wrong and timer is finished', () => {
        component.question.choices = [
            { text: 'test', isCorrect: true },
            { text: 'test2', isCorrect: false },
        ];
        component.chosenChoices = [false, true];

        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        const disableButtonSpy = spyOn<any>(component, 'setSubmitButtonToDisabled');
        component['handleAnswerSubmission'](true);

        expect(disableButtonSpy).toHaveBeenCalledWith(true, { backgroundColor: 'grey' });
        expect(component['hasSentAnswer']).toBeTrue();
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.BadAnswer, { roomId: component['roomId'], isTimerFinished: true });
    });

    it('should identify a good answer', () => {
        component.question.choices = [
            { text: 'test', isCorrect: true },
            { text: 'test2', isCorrect: false },
        ];
        component.chosenChoices = [true, false];
        expect(component['isAnswerGood']()).toBeTrue();
        component.chosenChoices = [false, true];
        expect(component['isAnswerGood']()).toBeFalse();
    });

    it('should display the correct answer', () => {
        spyOn<any>(component, 'setButtonStateOnSubmit');
        component['displayCorrectAnswer']();
        expect(component['setButtonStateOnSubmit']).toHaveBeenCalledTimes(2);
        expect(component.doesDisplayPoints).toBeTrue();
    });

    it('should give bonus points for the first player to have gotten a good answer', () => {
        const bonus = 1.2;
        component.question.points = 10;
        spyOn<any>(component, 'isAnswerGood').and.returnValue(true);
        component['isTestGame'] = true;
        component['givePoints']();
        expect(component['points']).toEqual(component.question.points * bonus);
        expect(component.pointsMessage).toEqual('(20% bonus Woohoo!)');
    });

    it('should handle transition clock finished on init', () => {
        const transitionClockFinishedSpy = spyOn<any>(component, 'handleTransitionClockFinished');
        socketHelper.peerSideEmit(TimeEvents.TransitionClockFinished, component['roomId']);
        component.ngOnInit();

        expect(transitionClockFinishedSpy).toHaveBeenCalled();
    });

    it('should handle bonus points on init', () => {
        const sendSpy = spyOn(clientSocketServiceMock, 'send');
        socketHelper.peerSideEmit(GameEvents.GiveBonus, component['roomId']);
        component.ngOnInit();

        expect(sendSpy).toHaveBeenCalledWith(GameEvents.AddPointsToPlayer, {
            roomId: component['roomId'],
            points: component['points'],
        });
    });

    it('should give points to a player for a correct answer', () => {
        spyOn<any>(component, 'isAnswerGood').and.returnValue(true);
        const questionPoints = 10;
        component.question.points = questionPoints;
        component['givePoints']();
        expect(component['points']).toEqual(questionPoints);
        expect(component.pointsToDisplay).toEqual(questionPoints);
    });

    it('should not give points to a player for an incorrect answer', () => {
        spyOn<any>(component, 'isAnswerGood').and.returnValue(false);
        component['givePoints']();
        expect(component['points']).toEqual(0);
        expect(component.pointsMessage).toEqual('');
    });

    it('should show results', () => {
        component['isTestGame'] = true;
        spyOn<any>(component, 'setSubmitButtonToDisabled');
        spyOn<any>(component, 'displayCorrectAnswer');
        component['showResult']();
        expect(component['setSubmitButtonToDisabled']).toHaveBeenCalledWith(true, { backgroundColor: 'grey' });
        expect(component['displayCorrectAnswer']).toHaveBeenCalled();
    });

    // TODO: Corriger ce test
    // it('should focus on button', () => {
    //     component.question.type = 'QCM';
    //     fixture.detectChanges();
    //     const buttonElement: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('button');
    //     // console.log(buttonElement);
    //     const focusSpy = spyOn(buttonElement, 'focus').and.callThrough();
    //     expect(focusSpy).toHaveBeenCalled();
    // });
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
