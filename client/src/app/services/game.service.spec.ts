import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        }).compileComponents();
        service = TestBed.inject(GameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
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
});
