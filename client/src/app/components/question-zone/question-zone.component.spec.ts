import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { TimeService } from '@app/services/time.service';
import { of } from 'rxjs';
import { QuestionZoneComponent } from './question-zone.component';

describe('QuestionZoneComponent', () => {
    let component: QuestionZoneComponent;
    let fixture: ComponentFixture<QuestionZoneComponent>;
    let communicationServiceMock: jasmine.SpyObj<CommunicationService>;
    let gameService: GameService;
    let timeService: TimeService;

    beforeEach(fakeAsync(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionZoneComponent],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceMock },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => '123' } } },
                },
            ],
        }).compileComponents();
        gameService = TestBed.inject(GameService);
        timeService = TestBed.inject(TimeService);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(QuestionZoneComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // TODO: Faire les tests unitaires
    it('should prevent default propagation of the enter key', () => {
        const event = new KeyboardEvent('keypress', { key: 'Enter' });
        const preventDefaultSpy = spyOn(event, 'preventDefault');
        component.preventDefaultEnter(event);
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not submit the answer when enter key is pressed if submit button disabled', () => {
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        component.isSubmitEnabled = false;
        const submitAnswerSpy = spyOn(component, 'submitAnswerOnClickEvent');
        component.buttonDetect(event);
        expect(submitAnswerSpy).not.toHaveBeenCalled();
    });

    it('should submit the answer when enter key is pressed', () => {
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        component.isSubmitEnabled = true;
        const submitAnswerSpy = spyOn(component, 'submitAnswerOnClickEvent');
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

    // TODO: Fix ce test unitaire
    it('should focus on the buttons when the question zone container is clicked', () => {
        /*  const focusOnButtonSpy = spyOn(component, 'focusOnButton');
        const questionZoneContainer = elementRef.nativeElement.querySelector('.question-zone-container');
        questionZoneContainer.click();
        expect(focusOnButtonSpy).toHaveBeenCalled(); */
    });

    it('should fetch the quiz ', () => {
        const id = '123';
        const getQuizByIdSpy = spyOn(gameService, 'getQuizById');
        component.getQuiz();
        expect(getQuizByIdSpy).toHaveBeenCalledWith(id);
    });

    it('should call nothing if hasGameEnded is true', () => {
        component.hasGameEnded = true;
        const getQuestionSpy = spyOn(component, 'getQuestion');
        component.subscribeToTimer();
        expect(getQuestionSpy).not.toHaveBeenCalled();
    });

    it('should submit answers if the timer is at 0, the question is not transitioning and the game has not ended', () => {
        const submitAnswerOnCountdownEventSpy = spyOn(component, 'submitAnswerOnCountdownEvent');
        spyOn(timeService, 'getTime').and.returnValue(of(0));
        component.hasGameEnded = false;
        component.isQuestionTransitioning = false;
        component.subscribeToTimer();

        expect(submitAnswerOnCountdownEventSpy).toHaveBeenCalled();
        expect(component.isQuestionTransitioning).toBeTrue();
    });

    it('should go to the next question if the timer is at 0, the question is transitioning and the game has not ended', () => {
        const getQuestionSpy = spyOn(component, 'getQuestion');
        const submitAnswerOnCountdownEventSpy = spyOn(component, 'submitAnswerOnCountdownEvent');
        spyOn(timeService, 'getTime').and.returnValue(of(0));
        component.hasGameEnded = false;
        component.isQuestionTransitioning = true;
        const currentIndex = component.currentQuestionIndex;
        component.subscribeToTimer();

        expect(submitAnswerOnCountdownEventSpy).not.toHaveBeenCalled();
        expect(component.currentQuestionIndex).toEqual(currentIndex + 1);
        expect(getQuestionSpy).toHaveBeenCalledWith(currentIndex + 1);
        expect(component.isQuestionTransitioning).toBeFalse();
    });

    it('should do nothing if the timer is at 0 and the game has ended', () => {
        const getQuestionSpy = spyOn(component, 'getQuestion');
        const submitAnswerOnCountdownEventSpy = spyOn(component, 'submitAnswerOnCountdownEvent');
        spyOn(timeService, 'getTime').and.returnValue(of(0));
        component.hasGameEnded = true;
        component.isQuestionTransitioning = true;
        const currentIndex = component.currentQuestionIndex;
        component.subscribeToTimer();

        expect(submitAnswerOnCountdownEventSpy).not.toHaveBeenCalled();
        expect(component.currentQuestionIndex).toEqual(currentIndex);
        expect(getQuestionSpy).not.toHaveBeenCalled();
        expect(component.isQuestionTransitioning).toBeTrue();
    });

    it('should do nothing if the timer is not at 0 and the game has not ended', () => {
        const getQuestionSpy = spyOn(component, 'getQuestion');
        const submitAnswerOnCountdownEventSpy = spyOn(component, 'submitAnswerOnCountdownEvent');
        spyOn(timeService, 'getTime').and.returnValue(of(1));
        component.hasGameEnded = false;
        component.isQuestionTransitioning = true;
        const currentIndex = component.currentQuestionIndex;
        component.subscribeToTimer();

        expect(submitAnswerOnCountdownEventSpy).not.toHaveBeenCalled();
        expect(component.currentQuestionIndex).toEqual(currentIndex);
        expect(getQuestionSpy).not.toHaveBeenCalled();
        expect(component.isQuestionTransitioning).toBeTrue();
    });

    it('should set hasGameEnded if gameService.hasGameEndedObservable is true', () => {
        spyOnProperty(gameService, 'hasGameEndedObservable').and.returnValue(of(true));
        component.subscribeToGameService();
        expect(component.hasGameEnded).toBeTrue();
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

    // TODO: Fix ce test unitaire
    /*     it('should disable or enable the submit button if setSubmitButtonToDisabled is called', () => {
        component.isSubmitEnabled = false;
        component.submitButtonStyle = { backgroundColor: 'green' };
        component.setSubmitButtonToDisabled(true, { backgroundColor: 'grey' });
        expect(component.isSubmitEnabled).toBeTrue();
        expect(component.submitButtonStyle).toEqual({ backgroundColor: 'grey' });
    }); */

    it('should disable the submit button if no choice is selected', () => {
        component.chosenChoices = [false, false, false];
        component.setSubmitButtonStateOnChoices();
        expect(component.isSubmitEnabled).toBeFalse();
        expect(component.submitButtonStyle).toEqual({ backgroundColor: 'grey' });
    });

    it('should enable the submit button if at least one choice is selected', () => {
        component.chosenChoices = [false, false, true];
        component.setSubmitButtonStateOnChoices();
        expect(component.isSubmitEnabled).toBeTrue();
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

    // TODO: fix ce test unitaire
    /*     it('should change the buttons state when setButtonStateOnSubmit is called', () => {
        const buttonIndex = 0;
        component.choiceButtonStyle[buttonIndex] = { backgroundColor: '' };
        component.isChoiceButtonDisabled = false;
        component.submitButtonStyle = { backgroundColor: '' };
        component.setButtonStateOnSubmit(buttonIndex);

        expect(component.isChoiceButtonDisabled).toBeTrue();
        expect(component.submitButtonStyle).toEqual({ backgroundColor: 'grey' });
        expect(component.choiceButtonStyle[buttonIndex]).toEqual({ backgroundColor: 'red' });
    }); */
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
