import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { NgChartsModule } from 'ng2-charts';
import { ResultChartComponent } from './result-chart.component';

describe('ResultChartComponent', () => {
    let component: ResultChartComponent;
    let fixture: ComponentFixture<ResultChartComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ResultChartComponent, HistogramComponent, MatIcon],
            imports: [NgChartsModule, HttpClientTestingModule],
        });
        fixture = TestBed.createComponent(ResultChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
