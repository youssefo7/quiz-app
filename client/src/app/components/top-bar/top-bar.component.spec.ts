import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopBarComponent } from './top-bar.component';

describe('TopBarComponent', () => {
    let component: TopBarComponent;
    let fixture: ComponentFixture<TopBarComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TopBarComponent],
        });
        fixture = TestBed.createComponent(TopBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display title given as input', () => {
        component.title = 'What a wonderful test!';
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('h1').innerText).toEqual('What a wonderful test!');
    });
});
