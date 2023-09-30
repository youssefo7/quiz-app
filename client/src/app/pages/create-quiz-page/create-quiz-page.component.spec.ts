// import SpyObj = jasmine.SpyObj;

// describe('CreateQuizPageComponent', () => {
//     let component: CreateQuizPageComponent;
//     let fixture: ComponentFixture<CreateQuizPageComponent>;
//     let matDialogSpy: SpyObj<MatDialog>;
//     let quizManagerServiceSpy: SpyObj<NewQuizManagerService>;
//     let activatedRouteSpy: SpyObj<ActivatedRoute>;

//     beforeEach(() => {
//         matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
//         quizManagerServiceSpy = jasmine.createSpyObj('NewQuizManagerService', [
//             'fetchQuiz',
//             'deleteQuestion',
//             'moveQuestionUp',
//             'moveQuestionDown',
//             'saveQuiz',
//         ]);
//         activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', []);
//     });

//     beforeEach(waitForAsync(() => {
//         TestBed.configureTestingModule({
//             declarations: [CreateQuizPageComponent, QuizGeneralInfoComponent, QuizQuestionInfoComponent, TopBarComponent],
//             imports: [HttpClientTestingModule],
//             providers: [
//                 { provide: MatDialog, useValue: matDialogSpy },
//                 { provide: ActivatedRoute, useValue: activatedRouteSpy },
//                 { provide: NewQuizManagerService, useValue: quizManagerServiceSpy },
//             ],
//         }).compileComponents();
//     }));

//     beforeEach(() => {
//         fixture = TestBed.createComponent(CreateQuizPageComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });
// });
