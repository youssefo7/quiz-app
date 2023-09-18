import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;

    beforeEach(() => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getQuiz']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [GamePageComponent],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch the quiz ', () => {
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
        communicationServiceSpy.getQuiz.and.returnValue(of(mockedQuiz));
        component.ngOnInit();

        expect(communicationServiceSpy.getQuiz).toHaveBeenCalledWith('123');
        expect(component.quiz).toEqual(mockedQuiz);
    });
});
