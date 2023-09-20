import { HttpClientTestingModule } from '@angular/common/http/testing'; // Import HttpClientTestingModule
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CreateGameListComponent } from './create-game-list.component';
import SpyObj = jasmine.SpyObj;

describe('CreateGameListComponent', () => {
    let component: CreateGameListComponent;
    let fixture: ComponentFixture<CreateGameListComponent>;
    let routerSpy: SpyObj<Router>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CreateGameListComponent],
            imports: [HttpClientTestingModule],
            providers: [{ provide: Router, useValue: routerSpy }],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateGameListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch all available quizzes', () => {
        // TODO
    });

    it('should only get visible quizzes', () => {
        // TODO
    });

    it('create game button should redirect to game page', () => {
        const quizId = 'ab123';
        component.selectedQuizId = quizId;
        const createGameButton = fixture.debugElement.nativeElement.querySelector('.createButton');

        expect(createGameButton).toBeNull();
        component.toggleDetails(quizId);

        if (createGameButton) {
            createGameButton.click();
            fixture.detectChanges();
            expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`game/${quizId}`);
        }
    });

    it('test game button should redirect to test page', () => {
        const quizId = 'ab123';
        component.selectedQuizId = quizId;
        const testGameButton = fixture.debugElement.nativeElement.querySelector('.testButton');
        expect(testGameButton).toBeNull();
        component.toggleDetails(quizId);

        if (testGameButton) {
            testGameButton.click();
            fixture.detectChanges();
            expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`game/${quizId}/test`);
        }
    });

    it('should only show visible games', () => {
        // TODO
        /* component.ngOnInit();
        const visibleQuizzes = ;
        expect(visibleQuizzes).toEqual(component.quizzes); */
    });

    it('toggle button should toggle details', () => {
        const toggleButton = fixture.debugElement.nativeElement.querySelector('.toggleButton');
        const selectedQuizBefore = component.selectedQuiz.value;
        const toggleDetailsVisibilitySpy = spyOn(component, 'toggleDetails');

        if (toggleButton) {
            toggleButton.click();
            fixture.detectChanges();
            const selectedQuizAfter = component.selectedQuiz.value;

            expect(toggleButton.classList.contains('active')).toBe(true);
            expect(selectedQuizAfter).not.toEqual(selectedQuizBefore);
            expect(toggleDetailsVisibilitySpy).toHaveBeenCalled();
        } else {
            expect(toggleButton).toBeNull();
        }
    });

    it('should get questions', () => {
        // TODO
    });
});
