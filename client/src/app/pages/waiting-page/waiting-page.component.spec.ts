import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';

import { WaitingPageComponent } from './waiting-page.component';

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WaitingPageComponent, TopBarComponent],
        });
        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
