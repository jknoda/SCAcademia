import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentProgressChartComponent } from './student-progress-chart.component';
import { StudentProgressWeekly } from '../../types';

describe('StudentProgressChartComponent', () => {
  let component: StudentProgressChartComponent;
  let fixture: ComponentFixture<StudentProgressChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentProgressChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentProgressChartComponent);
    component = fixture.componentInstance;
  });

  describe('Data Validation', () => {
    it('should show insufficient data message when weeklyData is empty', () => {
      component.weeklyData = [];
      component.ngOnInit();

      expect(component.showInsufficientData).toBe(true);
    });

    it('should show insufficient data message when weeklyData has only 1 item', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 45 },
      ];
      component.ngOnInit();

      expect(component.showInsufficientData).toBe(true);
    });

    it('should render chart when weeklyData has >= 2 items', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 45 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 52 },
      ];
      component.ngOnInit();

      expect(component.showInsufficientData).toBe(false);
      expect(component.points.length).toBe(2);
      expect(component.visibleData.length).toBe(2);
    });
  });

  describe('Trend Calculation', () => {
    it('should calculate UP trend when final > initial by more than 5%', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 45 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 52 },
        { weekNumber: 3, date: '2026-02-15', proficiencyPercent: 60 },
        { weekNumber: 4, date: '2026-02-22', proficiencyPercent: 68 },
      ];
      component.visibleData = component.weeklyData;
      component.calculateTrend();

      expect(component.trend).toBe('up');
      expect(component.trendMessage).toContain('crescendo');
      expect(component.trendMessage).toContain('+23% em 4 semanas');
    });

    it('should calculate DOWN trend when final < initial by more than 5%', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 68 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 60 },
      ];
      component.visibleData = component.weeklyData;
      component.calculateTrend();

      expect(component.trend).toBe('down');
      expect(component.trendMessage).toContain('queda');
    });

    it('should calculate DOWN trend when any single point dips below previous (AC7)', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 45 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 52 },
        { weekNumber: 3, date: '2026-02-15', proficiencyPercent: 48 },
        { weekNumber: 4, date: '2026-02-22', proficiencyPercent: 68 },
      ];
      component.visibleData = component.weeklyData;
      component.calculateTrend();

      expect(component.trend).toBe('down');
      expect(component.trendMessage).toContain('queda');
    });

    it('should calculate FLAT trend when change is within 5%', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 50 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 52 },
      ];
      component.visibleData = component.weeklyData;
      component.calculateTrend();

      expect(component.trend).toBe('flat');
      expect(component.trendMessage).toContain('estável');
    });
  });

  describe('Point Color Logic', () => {
    it('should return orange for normal progression', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 45 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 52 },
      ];

      component.visibleData = component.weeklyData;
      const color = component.getPointColor(1);
      expect(color).toBe('#FF6B35');
    });

    it('should return red for point lower than previous', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 52 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 45 },
      ];

      component.visibleData = component.weeklyData;
      const color = component.getPointColor(1);
      expect(color).toBe('#D32F2F');
    });
  });

  describe('Chart Rendering', () => {
    it('should generate correct number of points', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 45 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 52 },
        { weekNumber: 3, date: '2026-02-15', proficiencyPercent: 60 },
      ];
      component.visibleData = component.weeklyData;
      component.renderChart();

      expect(component.points.length).toBe(3);
    });

    it('should calculate correct SVG path', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 45 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 52 },
      ];
      component.visibleData = component.weeklyData;
      component.renderChart();

      expect(component.svgPath).toContain('M');
      expect(component.svgPath).toContain('L');
    });

    it('should scale points correctly', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 0 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 100 },
      ];
      component.visibleData = component.weeklyData;
      component.renderChart();

      const firstPoint = component.points[0];
      const secondPoint = component.points[1];

      expect(firstPoint.y).toBeGreaterThan(secondPoint.y);
    });

    it('should slide week window when navigating previous and next period', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-01-01', proficiencyPercent: 40 },
        { weekNumber: 2, date: '2026-01-08', proficiencyPercent: 42 },
        { weekNumber: 3, date: '2026-01-15', proficiencyPercent: 44 },
        { weekNumber: 4, date: '2026-01-22', proficiencyPercent: 46 },
        { weekNumber: 5, date: '2026-01-29', proficiencyPercent: 50 },
      ];

      component.prepareChart();
      expect(component.visibleData[0].weekNumber).toBe(2);
      expect(component.canGoToPreviousPeriod()).toBeTrue();

      component.goToPreviousPeriod();
      expect(component.visibleData[0].weekNumber).toBe(1);

      expect(component.canGoToNextPeriod()).toBeTrue();
      component.goToNextPeriod();
      expect(component.visibleData[0].weekNumber).toBe(2);
    });

    it('should show tooltip for hovered point', () => {
      component.weeklyData = [
        { weekNumber: 1, date: '2026-02-01', proficiencyPercent: 45 },
        { weekNumber: 2, date: '2026-02-08', proficiencyPercent: 52 },
      ];
      component.visibleData = component.weeklyData;
      component.renderChart();

      component.onPointHover(1);

      expect(component.activeTooltip?.label).toContain('Semana 2: 52%');
    });
  });
});
