import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProfileComponent } from '@app/components/profile/profile.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { CommunicationService } from '@app/services/communication.service';
import { of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let communicationServiceMock: jasmine.SpyObj<CommunicationService>;
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
            declarations: [GamePageComponent, TopBarComponent, ProfileComponent],
            imports: [MatIconModule, RouterModule],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceMock },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'game/123/test' }, { path: 'game/123' }] } },
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set link to /home if route doesn\'\t contain "test"', () => {
        component.checkGameRoute(false);
        expect(component.title).toEqual('Partie');
        expect(component.link).toEqual('/home');
    });

    // TODO: Change /admin with create-game route
    it('should link to /admin if route does contain "test"', () => {
        component.checkGameRoute(true);
        expect(component.title).toEqual('Partie - Test');
        expect(component.link).toEqual('/admin');
    });

    it('should fetch the quiz ', () => {
        expect(communicationServiceMock.getQuiz).toHaveBeenCalledWith('123');
        expect(component.quiz).toEqual(mockedQuiz);
    });
});
