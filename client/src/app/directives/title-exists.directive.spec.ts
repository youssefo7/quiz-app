
// @Component({
//     template: `
//         <form [formGroup]="form">
//             <input id="title-input" type="text" [formControlName]="controlName" [appTitleExists]="quizzes"/>
//         </form>
//     `,
// })
// class TestComponent {
//     form: FormGroup;
//     controlName: string;
//     quizzes: any[];

//     constructor() {
//         this.form = new FormGroup({
//             title: new FormControl(''),
//         });
//         this.controlName = 'title';
//         this.quizzes = [];
//     }
// }

// describe('TitleExistsDirective', () => {
//     let fixture: ComponentFixture<TestComponent>;
//     let component: TestComponent;

//     beforeEach(() => {
//         TestBed.configureTestingModule({
//             declarations: [TestComponent, TitleExistsDirective],
//             imports: [ReactiveFormsModule],
//         });

//         fixture = TestBed.createComponent(TestComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create an instance', () => {
//         const directive = new TitleExistsDirective();
//         expect(directive).toBeTruthy();
//     });

    // it('Should pass the title validation when the title does not exist in the current list of quizzes', () => {
    //     component.quizzes = [{ title: 'Quiz1' }, { title: 'Quiz2' }];
    //     const titleInput = fixture.debugElement.query(By.css('input'));
    //     const inputControl = component.form.get(component.controlName) as FormControl;
    //     inputControl.setValue('New Quiz Title');
    //     titleInput.triggerEventHandler('input', { target: titleInput.nativeElement });
    //     fixture.detectChanges();
    //     expect(inputControl.valid).toBeTruthy();
//     // });
// });
