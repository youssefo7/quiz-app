import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { QuestionZoneComponent } from './question-zone.component';

describe('QuestionZoneComponent', () => {
    let component: QuestionZoneComponent;
    let fixture: ComponentFixture<QuestionZoneComponent>;
    let communicationServiceMock: jasmine.SpyObj<CommunicationService>;

    beforeEach(() => {
        communicationServiceMock = jasmine.createSpyObj('CommunicationService', ['getQuiz']);
    });

    // TODO: Changer la structure des tests et retirer la dépendance de CommunicationService et activatedRoute
    beforeEach(fakeAsync(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionZoneComponent],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceMock },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'game/123/test' }, { path: 'game/123' }] } },
                },
            ],
        });
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
});
