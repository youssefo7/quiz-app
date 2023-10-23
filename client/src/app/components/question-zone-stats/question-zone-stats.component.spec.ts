import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
import { of } from 'rxjs';
import { QuestionZoneStatsComponent } from './question-zone-stats.component';
import SpyObj = jasmine.SpyObj;

describe('QuestionZoneStatsComponent', () => {
    let component: QuestionZoneStatsComponent;
    let fixture: ComponentFixture<QuestionZoneStatsComponent>;
    let communicationServiceMock: SpyObj<CommunicationService>;
    let gameService: GameService;
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

    beforeEach(() => {
        communicationServiceMock = jasmine.createSpyObj('CommunicationService', ['getQuiz']);
        communicationServiceMock.getQuiz.and.returnValue(of(mockedQuiz));
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionZoneStatsComponent],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(QuestionZoneStatsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        gameService = TestBed.inject(GameService);
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch the quiz ', () => {
        const id = '123';
        const getQuizByIdSpy = spyOn(gameService, 'getQuizById');
        component.getQuiz();
        expect(getQuizByIdSpy).toHaveBeenCalledWith(id);
    });
});
