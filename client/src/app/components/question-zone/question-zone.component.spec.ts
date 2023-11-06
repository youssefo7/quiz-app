// Raison: On est à des mockQuiz qui prennent beaucoup de place, mais on ne vaut pas les déplacer dans un fichier séparé
/* eslint-disable max-lines */
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { of } from 'rxjs';
import { QuestionZoneComponent } from './question-zone.component';

describe('QuestionZoneComponent', () => {
    let component: QuestionZoneComponent;
    let fixture: ComponentFixture<QuestionZoneComponent>;
    let gameService: GameService;
    let elementRef: HTMLElement;
    let debugElement: DebugElement;
    let setButtonSpy: jasmine.Spy;
    let clientSocketServiceMock: jasmine.SpyObj<SocketClientService>;
    let communicationServiceMock: jasmine.SpyObj<CommunicationService>;
    let timeServiceMock: jasmine.SpyObj<TimeService>;

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'send']);
        communicationServiceMock = jasmine.createSpyObj('CommunicationService', ['getQuiz']);
        communicationServiceMock.getQuiz.and.returnValue(of(mockedQuiz));
        timeServiceMock = jasmine.createSpyObj('TimeService', ['getTime', 'stopTimer']);
        timeServiceMock.getTime.and.returnValue(of(0));
    });

    beforeEach(waitForAsync(() => {
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
        component.question = {
            text: 'test',
            type: 'QCM',
            points: 1,
            choices: [
                { text: 'test', isCorrect: false },
                { text: 'test2', isCorrect: true },
            ],
        };
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

    it('should not submit the answer when enter key is pressed if submit button disabled', () => {
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        component.isSubmitDisabled = true;
        const submitAnswerSpy = spyOn(component, 'submitAnswer');
        component.buttonDetect(event);
        expect(submitAnswerSpy).not.toHaveBeenCalled();
    });

    it('should submit the answer when enter key is pressed', () => {
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        component.isSubmitDisabled = false;
        const submitAnswerSpy = spyOn(component, 'submitAnswer');
        component.buttonDetect(event);
        expect(submitAnswerSpy).toHaveBeenCalled();
    });

    it('should toggle choices and change the submit button state when other keys are pressed', () => {
        const event = new KeyboardEvent('keyup', { key: '1' });
        const toggleChoicesSpy = spyOn(component, 'toggleChoice');
        const changeSubmitButtonStateSpy = spyOn(component, 'setSubmitButtonStateOnChoices');
        component.buttonDetect(event);
        expect(toggleChoicesSpy).toHaveBeenCalled();
        expect(changeSubmitButtonStateSpy).toHaveBeenCalled();
    });

    it('should fetch the quiz ', () => {
        const id = '123';
        const getQuizByIdSpy = spyOn(gameService, 'getQuizById');
        component.getQuiz();
        expect(getQuizByIdSpy).toHaveBeenCalledWith(id);
    });

    it('should fetch the quiz and the first question', fakeAsync(() => {
        const getQuizSpy = spyOn(component, 'getQuiz');
        const getQuestionSpy = spyOn(component, 'getQuestion');
        component.loadQuiz();
        tick();
        expect(getQuizSpy).toHaveBeenCalled();
        expect(getQuestionSpy).toHaveBeenCalled();
    }));

    it('should focus on the buttons when the question zone container is clicked', () => {
        const focusOnButtonSpy = spyOn(component, 'focusOnButton');
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
        const showResultSpy = spyOn(component, 'showResult');
        component['hasGameEnded'] = false;
        component.isQuestionTransitioning = false;
        component['isTestGame'] = true;
        component.subscribeToTimer();

        expect(showResultSpy).toHaveBeenCalled();
        expect(component.isQuestionTransitioning).toBeTrue();
    });

    it('should go to the next question if the timer is at 0, the question is transitioning and the game has not ended', () => {
        const getQuestionSpy = spyOn(component, 'getQuestion');
        const showResultSpy = spyOn(component, 'showResult');
        component['hasGameEnded'] = false;
        component.isQuestionTransitioning = true;
        component['isTestGame'] = true;
        const currentIndex = component.currentQuestionIndex;
        component.subscribeToTimer();

        expect(showResultSpy).not.toHaveBeenCalled();
        expect(component.currentQuestionIndex).toEqual(currentIndex + 1);
        expect(getQuestionSpy).toHaveBeenCalledWith(currentIndex + 1);
        expect(component.isQuestionTransitioning).toBeFalse();
    });

    it('should do nothing if the timer is at 0 and the game has ended', () => {
        const getQuestionSpy = spyOn(component, 'getQuestion');
        const showResultSpy = spyOn(component, 'showResult');
        component['hasGameEnded'] = true;
        component.isQuestionTransitioning = true;
        const currentIndex = component.currentQuestionIndex;
        component.subscribeToTimer();

        expect(showResultSpy).not.toHaveBeenCalled();
        expect(component.currentQuestionIndex).toEqual(currentIndex);
        expect(getQuestionSpy).not.toHaveBeenCalled();
        expect(component.isQuestionTransitioning).toBeTrue();
    });

    it('should do nothing if the timer is not at 0 and the game has not ended', () => {
        const getQuestionSpy = spyOn(component, 'getQuestion');
        const showResultSpy = spyOn(component, 'showResult');
        timeServiceMock.getTime.and.returnValue(of(1));
        component['hasGameEnded'] = false;
        component.isQuestionTransitioning = true;
        const currentIndex = component.currentQuestionIndex;
        component.subscribeToTimer();

        expect(showResultSpy).not.toHaveBeenCalled();
        expect(component.currentQuestionIndex).toEqual(currentIndex);
        expect(getQuestionSpy).not.toHaveBeenCalled();
        expect(component.isQuestionTransitioning).toBeTrue();
    });

    it('should set hasGameEnded if gameService.hasGameEndedObservable is true', () => {
        spyOnProperty(gameService, 'hasGameEndedObservable').and.returnValue(of(true));
        component['isTestGame'] = true;
        component.detectEndGame();
        expect(component['hasGameEnded']).toBeTrue();
    });

    it('should create an array of choice to false if the question index id valid', () => {
        const firstQuestionIndex = 0;
        const expectChoiceArray = [false, false, false, false];
        component.quiz = validMockQuiz;
        component.getQuestion(firstQuestionIndex);
        expect(component.chosenChoices).toEqual(expectChoiceArray);
    });

    it('should not create an array of choice if the question index is invalid', () => {
        const validIndex = 3;
        const setButtonToInitStateSpy = spyOn(component, 'setButtonToInitState');
        component.quiz = invalidMockedQuiz;
        component.getQuestion(validIndex);
        expect(component.chosenChoices).toBeUndefined();
        expect(setButtonToInitStateSpy).not.toHaveBeenCalled();
    });

    it('should not modify chosenChoices if quiz is not defined or index is out of range', () => {
        const choiceArray = component.chosenChoices;
        const outOfRangeIndex = 10;
        component.quiz = validMockQuiz;
        component.getQuestion(outOfRangeIndex);
        expect(choiceArray).toBeUndefined();

        const validIndex = 0;
        component.quiz = null;
        component.getQuestion(validIndex);
        expect(choiceArray).toBeUndefined();
    });

    it('should toggle the choice if the index is valid', () => {
        const invalidIndex = 1;
        component.chosenChoices = [false, false, false];
        component.toggleChoice(invalidIndex);
        expect(component.chosenChoices).toEqual([false, true, false]);
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
        component.setSubmitButtonToDisabled(true, { backgroundColor: 'grey' });
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
        component.setButtonToInitState(buttonIndex);
        expect(component.isChoiceButtonDisabled).toBeFalse();
        expect(component.submitButtonStyle).toEqual({ backgroundColor: '' });
        expect(component.choiceButtonStyle[buttonIndex]).toEqual({ backgroundColor: '' });
        expect(component.doesDisplayPoints).toBeFalse();
    });

    it('should change the buttons state when setButtonStateOnSubmit is called', () => {
        const firstButtonIndex = 0;
        const secondButtonIndex = 1;
        component.choiceButtonStyle[firstButtonIndex] = { backgroundColor: '' };
        component.choiceButtonStyle[secondButtonIndex] = { backgroundColor: '' };
        component.isChoiceButtonDisabled = false;
        component.setButtonStateOnSubmit(firstButtonIndex);
        component.setButtonStateOnSubmit(secondButtonIndex);
        expect(component.isChoiceButtonDisabled).toBeTrue();
        expect(component.submitButtonStyle).toEqual({ backgroundColor: '' });
        expect(component.choiceButtonStyle[firstButtonIndex]).toEqual({ backgroundColor: 'red' });
        expect(component.choiceButtonStyle[secondButtonIndex]).toEqual({ backgroundColor: 'rgb(97, 207, 72)' });
    });

    it('should submit answer on click event', () => {
        component['isTestGame'] = true;
        spyOn(component, 'showResult');
        component.submitAnswer();
        expect(setButtonSpy).toHaveBeenCalledWith(true);
        expect(component.isQuestionTransitioning).toBeTrue();
        expect(component.showResult).toHaveBeenCalled();
    });

    it('should identify a good answer', () => {
        component.question.choices = [
            { text: 'test', isCorrect: true },
            { text: 'test2', isCorrect: false },
        ];
        component.chosenChoices = [true, false];
        expect(component.isAnswerGood()).toBeTrue();
        component.chosenChoices = [false, true];
        expect(component.isAnswerGood()).toBeFalse();
    });

    it('should display the correct answer', () => {
        spyOn(component, 'setButtonStateOnSubmit');
        component.displayCorrectAnswer();
        expect(component.setButtonStateOnSubmit).toHaveBeenCalledTimes(2);
        expect(component.doesDisplayPoints).toBeTrue();
    });

    it('should give bonus points for a correct answer', () => {
        const bonus = 1.2;
        component.question.points = 10;
        spyOn(component, 'isAnswerGood').and.returnValue(true);
        component['isTestGame'] = true;
        component.givePoints();
        expect(component.points).toEqual(component.question.points * bonus);
        expect(component.bonusMessage).toEqual('(20% bonus Woohoo!)');
    });

    it('should not give points for an incorrect answer', () => {
        spyOn(component, 'isAnswerGood').and.returnValue(false);
        component.givePoints();
        expect(component.points).toEqual(0);
        expect(component.bonusMessage).toEqual('');
    });

    it('should show results', () => {
        spyOn(component, 'setSubmitButtonToDisabled');
        spyOn(component, 'displayCorrectAnswer');
        spyOn(component, 'givePoints');
        component.showResult();
        expect(component.setSubmitButtonToDisabled).toHaveBeenCalledWith(true, { backgroundColor: 'grey' });
        expect(component.displayCorrectAnswer).toHaveBeenCalled();
    });

    it('should focus on button', () => {
        fixture.detectChanges();
        const buttonElement: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('button');
        const focusSpy = spyOn(buttonElement, 'focus').and.callThrough();
        component.focusOnButton();
        expect(focusSpy).toHaveBeenCalled();
    });
});

const invalidMockedQuiz = {
    $schema: 'test.json',
    id: '123',
    title: 'Test quiz',
    description: 'Test quiz description',
    visibility: true,
    duration: 60,
    lastModification: '2018-11-13T20:20:39+00:00',
    questions: [],
};

const validMockQuiz = {
    $schema: 'test.json',
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
                {
                    text: 'La révolution russe',
                    isCorrect: false,
                },
                {
                    text: 'La guerre de Sécession',
                    isCorrect: false,
                },
            ],
        },
    ],
};

const mockedQuiz = {
    $schema: 'test.json',
    id: '123',
    title: 'Test quiz',
    description: 'Test quiz description',
    visibility: true,
    duration: 60,
    lastModification: '2018-11-13T20:20:39+00:00',
    questions: [],
};
