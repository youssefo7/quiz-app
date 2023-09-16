import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivatedRoute } from '@angular/router';
import { LiveGamePageComponent } from './live-game-page.component';

// TODO: Find a way to make this test into only one describe block
describe('LiveGamePageComponent', () => {
    let component: LiveGamePageComponent;
    let fixture: ComponentFixture<LiveGamePageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [LiveGamePageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            url: [{ path: '' }],
                        },
                    },
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LiveGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set link to /home if route doesn\'\t contains "test"', () => {
        component.ngOnInit();
        expect(component.link).toEqual('/home');
    });
});

describe('LiveGamePageComponent', () => {
    let component: LiveGamePageComponent;
    let fixture: ComponentFixture<LiveGamePageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [LiveGamePageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            url: [{ path: 'test' }],
                        },
                    },
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LiveGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should link to /game if route does not contain "test"', () => {
        component.ngOnInit();
        expect(component.link).toEqual('/game'); // TODO: Change with create-game route
    });
});
