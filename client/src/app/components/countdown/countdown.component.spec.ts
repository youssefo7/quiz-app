// import SpyObj = jasmine.SpyObj;

/* describe('CountdownComponent', () => {
    let component: CountdownComponent;
    let fixture: ComponentFixture<CountdownComponent>;
    let timeServiceSpy: SpyObj<TimeService>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;

    beforeEach(async () => {
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['startTimer', 'stopTimer']);
        await TestBed.configureTestingModule({
            declarations: [CountdownComponent],
            providers: [
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CountdownComponent],
        });
        fixture = TestBed.createComponent(CountdownComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // TODO: Implémenter les tests unitaires
});
