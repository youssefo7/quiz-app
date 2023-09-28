import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { of, throwError } from 'rxjs';
import { CreateGameListComponent } from './create-game-list.component';
import SpyObj = jasmine.SpyObj;

describe('CreateGameListComponent', () => {
    let component: CreateGameListComponent;
    let fixture: ComponentFixture<CreateGameListComponent>;
    let routerSpy: SpyObj<Router>;
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;

    const visibleQuizzMock: Quiz[] = [
        {
            $schema: 'quiz-schema.json',
            id: '1',
            title: 'mock1',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: true,
            description: 'mock1 quiz description',
            questions: [
                {
                    type: 'QCM',
                    text: 'Ceci est la première question du mock quiz1?',
                    points: 40,
                    choices: [],
                },
            ],
        },
    ];

    const hiddenQuizzMock: Quiz[] = [
        {
            $schema: 'quiz-schema.json',
            id: '2',
            title: 'mock2',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: false,
            description: 'mock2 quiz description',
            questions: [],
        },
    ];

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getQuizzes']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('mockDialogRef', ['componentInstance']);
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getQuizzes', 'checkQuizAvailability', 'checkQuizVisibility']);
        communicationServiceSpy.getQuizzes.and.returnValue(of([]));
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreateGameListComponent],
            imports: [HttpClientTestingModule],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: MatDialog, useValue: mockDialog },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        mockDialog.open.and.returnValue(mockDialogRef);
        fixture = TestBed.createComponent(CreateGameListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should handle error when getting quizzes', () => {
        const errorMessage = 'erreur du get';
        communicationServiceSpy.getQuizzes.and.returnValue(throwError(() => new Error(errorMessage)));
        component.getVisibleQuizListFromServer();
        fixture.detectChanges();

        expect(component.message.value).toEqual(`Le serveur ne répond pas et a retourné : ${errorMessage}`);
    });

    it('should show visible games', () => {
        communicationServiceSpy.getQuizzes.and.returnValue(of(hiddenQuizzMock));
        component.getVisibleQuizListFromServer();

        expect(component.visibleQuizList.value).toEqual([]);
    });

    it('should show toggle button when the quiz is visible', () => {
        communicationServiceSpy.getQuizzes.and.returnValue(of(visibleQuizzMock));
        component.getVisibleQuizListFromServer();
        fixture.detectChanges();

        const toggleButton = fixture.nativeElement.querySelector('.toggleButton');

        expect(component.visibleQuizList.value).not.toBeNull();
        expect(toggleButton).toBeTruthy();
    });

    it('should toggle the selected quiz id ', () => {
        const quizId = '1';
        expect(component.selectedQuizId).toBeNull();

        component.toggleDetails(quizId);
        fixture.detectChanges();

        expect(component.selectedQuizId).toEqual(quizId);

        component.toggleDetails(quizId);
        expect(component.selectedQuizId).toBeNull();
    });

    it('should toggle the quiz details when the toggle button is clicked', () => {
        communicationServiceSpy.getQuizzes.and.returnValue(of(visibleQuizzMock));
        component.getVisibleQuizListFromServer();
        fixture.detectChanges();

        const toggleButton = fixture.nativeElement.querySelector('.toggleButton');
        component.selectedQuizId = visibleQuizzMock[0].id;
        fixture.detectChanges();

        const quizDetails = fixture.nativeElement.querySelectorAll('quizDetails');
        const questions = fixture.nativeElement.querySelectorAll('.quizDetails li');

        expect(toggleButton.classList.contains('active')).toBeTruthy();
        expect(quizDetails).toBeTruthy();
        expect(questions.length).toEqual(visibleQuizzMock[0].questions.length);
    });

    it('should navigate to create game page if quiz is available and visible', () => {
        communicationServiceSpy.checkQuizAvailability.and.returnValue(of(true));
        communicationServiceSpy.checkQuizVisibility.and.returnValue(of(true));
        component.checkCanProceed(visibleQuizzMock[0]);

        expect(communicationServiceSpy.checkQuizAvailability).toHaveBeenCalled();
        expect(communicationServiceSpy.checkQuizVisibility).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['waiting/']);
    });

    it('should navigate to test game page if quiz is available and visible', () => {
        communicationServiceSpy.checkQuizAvailability.and.returnValue(of(true));
        communicationServiceSpy.checkQuizVisibility.and.returnValue(of(true));
        component.checkCanProceed(visibleQuizzMock[0], true);

        expect(communicationServiceSpy.checkQuizAvailability).toHaveBeenCalled();
        expect(communicationServiceSpy.checkQuizVisibility).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['game/', visibleQuizzMock[0].id, 'test']);
    });

    it('should display popup if quiz is hidden', () => {
        communicationServiceSpy.checkQuizAvailability.and.returnValue(of(true));
        communicationServiceSpy.checkQuizVisibility.and.returnValue(of(false));
        const hiddenPopUpSpy = spyOn(component, 'isHiddenPopUp').and.callThrough();
        component.checkCanProceed(hiddenQuizzMock[0]);

        expect(communicationServiceSpy.checkQuizAvailability).toHaveBeenCalled();
        expect(communicationServiceSpy.checkQuizVisibility).toHaveBeenCalled();
        expect(hiddenPopUpSpy).toHaveBeenCalled();
    });

    it('should display popup if quiz is deleted', () => {
        communicationServiceSpy.checkQuizAvailability.and.returnValue(of(false));
        communicationServiceSpy.checkQuizVisibility.and.returnValue(of(false));
        const isUnavailableSpy = spyOn(component, 'isUnavailablePopUp').and.callThrough();
        component.checkCanProceed(hiddenQuizzMock[0]);

        expect(communicationServiceSpy.checkQuizAvailability).toHaveBeenCalled();
        expect(communicationServiceSpy.checkQuizVisibility).not.toHaveBeenCalled();
        expect(isUnavailableSpy).toHaveBeenCalled();
    });

    it('should display unavailable popUp when quiz has been deleted', () => {
        const popUpInstanceSpy = jasmine.createSpyObj('PopupMessageComponent', ['']);
        mockDialogRef.componentInstance = popUpInstanceSpy;
        mockDialog.open.and.returnValue(mockDialogRef);
        component.isUnavailablePopUp();

        expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should display hidden popUp when quiz has been hidden', () => {
        const popUpInstanceSpy = jasmine.createSpyObj('PopupMessageComponent', ['']);
        mockDialogRef.componentInstance = popUpInstanceSpy;
        mockDialog.open.and.returnValue(mockDialogRef);
        component.isHiddenPopUp();

        expect(mockDialog.open).toHaveBeenCalled();
    });
});
