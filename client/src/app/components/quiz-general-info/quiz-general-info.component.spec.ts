import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RangeValidatorDirective } from '@app/directives/range-validator.directive';
import { TitleExistsDirective } from '@app/directives/title-exists.directive';
import { Quiz } from '@app/interfaces/quiz';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { Constants } from '@common/constants';
import { QuizGeneralInfoComponent } from './quiz-general-info.component';

describe('QuizGeneralInfoComponent', () => {
    let component: QuizGeneralInfoComponent;
    let fixture: ComponentFixture<QuizGeneralInfoComponent>;
    let mockQuizManagerService: jasmine.SpyObj<QuizManagerService>;
    let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;

    const maxTitleLength = 150;
    const maxDescriptionLength = 300;
    const stringLength = 5;

    const mockEvent = {
        target: {
            value: '12345',
        },
    } as unknown as Event;

    const mockQuiz: Quiz = {
        id: '',
        title: '',
        description: '',
        duration: 10,
        lastModification: '',
        visibility: false,
        questions: [],
    };

    beforeEach(() => {
        mockQuizManagerService = jasmine.createSpyObj('QuizManagerService', ['updateGeneralInfo']);
        activatedRouteMock = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuizGeneralInfoComponent, TitleExistsDirective, RangeValidatorDirective],
            imports: [HttpClientTestingModule, ReactiveFormsModule],
            providers: [
                { provide: QuizManagerService, useValue: mockQuizManagerService },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuizGeneralInfoComponent);
        component = fixture.componentInstance;

        component.generalInfoForm = new FormGroup({
            title: new FormControl(''),
            description: new FormControl(''),
            duration: new FormControl(0),
        });

        component.newQuiz = {
            id: '1',
            title: 'test',
            description: 'test',
            duration: 30,
            lastModification: '',
            visibility: false,
            questions: [],
        };

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize form correctly for a new quiz', () => {
        component.newQuiz = mockQuiz;
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

    it('should emit false for the event emitter when the generalInfoForm is valid', () => {
        const blockSubmitSpy = spyOn(component.blockSubmit, 'emit');

        component.generalInfoForm.markAsDirty();
        component.generalInfoForm.setErrors(null);

        component.ngAfterViewInit();

        component.generalInfoForm.setValue({
            title: 'Test Title',
            description: 'Test Description',
            duration: 15,
        });

        expect(blockSubmitSpy).toHaveBeenCalledWith(false);
        expect(mockQuizManagerService.updateGeneralInfo).toHaveBeenCalledWith(component.newQuiz, component.generalInfoForm);
    });

    it('should emit true for the event emitter when the generalInfoForm is invalid', () => {
        const blockSubmitSpy = spyOn(component.blockSubmit, 'emit');

        component.generalInfoForm.setErrors({ someError: true });
        component.generalInfoForm.markAsDirty();

        component.ngAfterViewInit();

        component.generalInfoForm.setValue({
            title: '',
            description: 'Test Description',
            duration: 10,
        });

        expect(blockSubmitSpy).toHaveBeenCalledWith(true);
        expect(mockQuizManagerService.updateGeneralInfo).not.toHaveBeenCalledWith(component.newQuiz, component.generalInfoForm);
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
