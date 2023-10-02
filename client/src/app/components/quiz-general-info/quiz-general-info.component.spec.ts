import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { Constants } from '@common/constants';
import { QuizGeneralInfoComponent } from './quiz-general-info.component';

const maxTitleLength = 150;
const maxDescriptionLength = 300;
const stringLength = 5;
const mockEvent = {
    target: {
        value: '12345',
    },
} as unknown as Event;

describe('QuizGeneralInfoComponent', () => {
    let component: QuizGeneralInfoComponent;
    let fixture: ComponentFixture<QuizGeneralInfoComponent>;
    let mockQuizManagerService: jasmine.SpyObj<QuizManagerService>;

    beforeEach(() => {
        mockQuizManagerService = jasmine.createSpyObj('QuizManagerService', ['updateGeneralInfo']);
        TestBed.configureTestingModule({
            declarations: [QuizGeneralInfoComponent],
            imports: [HttpClientTestingModule, ReactiveFormsModule],
            providers: [{ provide: QuizManagerService, useValue: mockQuizManagerService }],
        }).compileComponents();
        fixture = TestBed.createComponent(QuizGeneralInfoComponent);
        component = fixture.componentInstance;
        component.generalInfoForm = new FormGroup({
            title: new FormControl(''),
            description: new FormControl(''),
            duration: new FormControl(0),
        });
        component.newQuiz = {
            $schema: 'quiz-schema.json',
            id: '1',
            title: 'test',
            duration: 30,
            lastModification: '',
            visibility: false,
            description: 'test',
            questions: [],
        };
    });

    it('should create', () => {
        component.newQuiz = {
            $schema: 'quiz-schema.json',
            id: '',
            title: '',
            duration: 0,
            lastModification: '',
            visibility: false,
            description: '',
            questions: [],
        };
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should initialize form correctly for a new quiz', () => {
        component.newQuiz = {
            $schema: 'quiz-schema.json',
            id: '',
            title: '',
            duration: 0,
            lastModification: '',
            visibility: false,
            description: '',
            questions: [],
        };
        component.ngOnInit();
        expect(component.generalInfoForm.get('title')?.value).toBe('');
        expect(component.generalInfoForm.get('description')?.value).toBe('');
        expect(component.generalInfoForm.get('duration')?.value).toBe(Constants.MIN_DURATION);
    });

    it('should initialize form correctly for an existing quiz', () => {
        component.ngOnInit();
        expect(component.generalInfoForm.get('title')?.value).toBe('test');
        expect(component.generalInfoForm.get('description')?.value).toBe('test');
        expect(component.generalInfoForm.get('duration')?.value).toBe(component.newQuiz.duration);
    });

    it('should initialize max lengths correctly', () => {
        component.initCounters();
        expect(component.maxLengthTitle).toBe(maxTitleLength);
        expect(component.maxLengthDescription).toBe(maxDescriptionLength);
    });

    it('should get title length and set counterTitle', () => {
        component.titleValue = 'test title';
        component.initCounters();
        expect(component.titleLength).toBe(component.titleValue.length);
        expect(component.counterTitle).toBe(`${component.titleLength} / ${component.maxLengthTitle}`);
    });

    it('should get description length and set counterDescription', () => {
        component.descriptionValue = 'test description';
        component.initCounters();
        expect(component.descriptionLength).toBe(component.descriptionValue.length);
        expect(component.counterDescription).toBe(`${component.descriptionLength} / ${component.maxLengthDescription}`);
    });

    it('should empty titleValue', () => {
        component.titleValue = '';
        component.initCounters();
        expect(component.titleLength).toBe(0);
        expect(component.counterTitle).toBe(`0 / ${component.maxLengthTitle}`);
    });

    it('should handle empty descriptionValue', () => {
        component.descriptionValue = '';
        component.initCounters();
        expect(component.descriptionLength).toBe(0);
        expect(component.counterDescription).toBe(`0 / ${component.maxLengthDescription}`);
    });

    it('should validate character count', () => {
        const control = { value: 'a'.repeat(maxTitleLength + 1) };
        const validationResult = component.characterCountValidator(maxTitleLength)(control as AbstractControl);
        expect(validationResult?.characterCountExceeded).toBeTruthy();
        control.value = 'a'.repeat(maxTitleLength - 1);
        const validResult = component.characterCountValidator(maxTitleLength)(control as AbstractControl);
        expect(validResult).toBeNull();
    });

    it('should validate null character value', () => {
        const control = { value: null };
        const validationResult = component.characterCountValidator(maxTitleLength)(control as AbstractControl);
        expect(validationResult).toBeNull();
    });

    it('should toggle button text', () => {
        component.toggleButtonTextAndName();
        expect(component.disableForm).toBe(true);
        expect(component.buttonText).toBe('Modifier');
        component.toggleButtonTextAndName();
        expect(component.disableForm).toBe(false);
        expect(component.buttonText).toBe('Sauvegarder');
    });

    it('should update title length and counter on character change', () => {
        component.maxLengthTitle = 100;
        component.onCharacterChangeTitle(mockEvent);
        expect(component.titleLength).toEqual(stringLength);
        expect(component.counterTitle).toBe(`${stringLength} / ${component.maxLengthTitle}`);
    });

    it('should update description length and counter on character change', () => {
        component.maxLengthDescription = 200;
        component.onCharacterChangeDescription(mockEvent);
        expect(component.descriptionLength).toEqual(stringLength);
        expect(component.counterDescription).toBe(`${stringLength} / ${component.maxLengthDescription}`);
    });

    it('should call updateGeneralInfo method of quizManagerService on submit', () => {
        component.onSubmit();
        expect(mockQuizManagerService.updateGeneralInfo).toHaveBeenCalledWith(component.newQuiz, component.generalInfoForm);
    });

    it('should adjust padding and set isTitleValid to false if title is invalid and dirty', () => {
        component.generalInfoForm.controls.title.setErrors({ invalid: true });
        component.generalInfoForm.controls.title.markAsDirty();
        component.adjustPadding();
        expect(component.isTitleValid).toBeFalse();
    });

    it('should adjust padding and set isTitleValid to false if title is invalid and touched', () => {
        component.generalInfoForm.controls.title.setErrors({ invalid: true });
        component.generalInfoForm.controls.title.markAsTouched();
        component.adjustPadding();
        expect(component.isTitleValid).toBeFalse();
    });

    it('should adjust padding and set isDescriptionValid to false if description is invalid and touched', () => {
        component.generalInfoForm.controls.description.setErrors({ invalid: true });
        component.generalInfoForm.controls.description.markAsTouched();
        component.adjustPadding();
        expect(component.isDescriptionValid).toBeFalse();
    });

    it('should adjust padding and set isDescriptionValid to false if description is invalid and dirty', () => {
        component.generalInfoForm.controls.description.setErrors({ invalid: true });
        component.generalInfoForm.controls.description.markAsDirty();
        component.adjustPadding();
        expect(component.isDescriptionValid).toBeFalse();
    });

    it('should adjust padding and set isDurationValid to false if duration is invalid', () => {
        component.generalInfoForm.controls.duration.setErrors({ invalid: true });

        component.adjustPadding();
        expect(component.isDurationValid).toBeFalse();
    });
});
