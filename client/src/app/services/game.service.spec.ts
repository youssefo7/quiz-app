import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CommunicationService } from './communication.service';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let communicationService: CommunicationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        }).compileComponents();
        service = TestBed.inject(GameService);
        communicationService = TestBed.inject(CommunicationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return a quiz if id is valid', () => {
        const communicationServiceSpy = spyOn(communicationService, 'getQuiz').and.returnValue(of(mockedQuiz));
        service.getQuizById('123').then((quiz) => {
            expect(quiz).toEqual(mockedQuiz);
        });
        expect(communicationServiceSpy).toHaveBeenCalledWith('123');
    });

    it('should set button presser state to the assigned value', () => {
        const spy = spyOn(service['isSubmitPressed'], 'next');
        const testValue = true;
        service.setButtonPressState = testValue;
        expect(spy).toHaveBeenCalledWith(testValue);
    });

    it('should set game end state to the assigned value', () => {
        const spy = spyOn(service['hasGameEnded'], 'next');
        const testValue = false;
        service.setGameEndState = testValue;
        expect(spy).toHaveBeenCalledWith(testValue);
    });

    it('should return null if quiz id is null', () => {
        service.getQuizById(null);
        const getQuizSpy = spyOn(communicationService, 'getQuiz');
        expect(getQuizSpy).not.toHaveBeenCalled();
    });
});

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
