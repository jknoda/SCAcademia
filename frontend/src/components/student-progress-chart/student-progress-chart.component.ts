import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentProgressWeekly } from '../../types';

@Component({
  selector: 'app-student-progress-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-progress-chart.component.html',
  styleUrls: ['./student-progress-chart.component.scss'],
})
export class StudentProgressChartComponent implements OnInit, OnChanges {
  @Input() weeklyData: StudentProgressWeekly[] = [];
  @Input() period: 'current' | 'previous' = 'current';

  showInsufficientData = false;
  svgPath = '';
  points: Array<{ x: number; y: number; week: StudentProgressWeekly }> = [];
  visibleData: StudentProgressWeekly[] = [];
  trend: 'up' | 'down' | 'flat' = 'flat';
  trendMessage = '';
  minValue = 0;
  maxValue = 100;
  windowStartIndex = 0;
  readonly pageSize = 4;
  activeTooltip: { label: string; x: number; y: number } | null = null;
  isTransitioning = false;

  // Chart dimensions
  readonly CHART_WIDTH = 500;
  readonly CHART_HEIGHT = 300;
  readonly PADDING = { top: 30, right: 40, bottom: 50, left: 60 };
  readonly POINT_RADIUS = 4;

  ngOnInit(): void {
    this.prepareChart();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.prepareChart();
  }

  validateData(): void {
    if (!this.weeklyData || this.weeklyData.length < 2) {
      this.showInsufficientData = true;
      return;
    }
    this.showInsufficientData = false;
  }

  prepareChart(): void {
    this.validateData();
    if (this.showInsufficientData) {
      this.visibleData = [];
      this.points = [];
      this.svgPath = '';
      this.activeTooltip = null;
      return;
    }

    this.windowStartIndex = Math.max(0, this.weeklyData.length - this.pageSize);
    this.updateVisibleData();
  }

  canGoToPreviousPeriod(): boolean {
    return this.windowStartIndex > 0;
  }

  canGoToNextPeriod(): boolean {
    return this.windowStartIndex + this.pageSize < this.weeklyData.length;
  }

  goToPreviousPeriod(): void {
    if (!this.canGoToPreviousPeriod()) {
      return;
    }

    this.windowStartIndex -= 1;
    this.animatePeriodChange();
  }

  goToNextPeriod(): void {
    if (!this.canGoToNextPeriod()) {
      return;
    }

    this.windowStartIndex += 1;
    this.animatePeriodChange();
  }

  updateVisibleData(): void {
    const start = Math.max(0, this.windowStartIndex);
    const end = Math.min(this.weeklyData.length, start + this.pageSize);
    this.visibleData = this.weeklyData.slice(start, end);
    this.activeTooltip = null;
    this.renderChart();
  }

  animatePeriodChange(): void {
    this.isTransitioning = true;
    this.updateVisibleData();
    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  renderChart(): void {
    if (this.visibleData.length < 2) {
      return;
    }

    const chartWidth = this.CHART_WIDTH - this.PADDING.left - this.PADDING.right;
    const chartHeight = this.CHART_HEIGHT - this.PADDING.top - this.PADDING.bottom;

    // Calculate scale
    const xScale = this.visibleData.length > 1 ? chartWidth / (this.visibleData.length - 1) : chartWidth;
    const yScale = chartHeight / (this.maxValue - this.minValue);

    // Generate points and path
    this.points = this.visibleData.map((week, index) => ({
      x: this.PADDING.left + index * xScale,
      y: this.PADDING.top + chartHeight - (week.proficiencyPercent - this.minValue) * yScale,
      week,
    }));

    // Build SVG path for line chart
    const pathData = this.points
      .map((point, index) => {
        const cmd = index === 0 ? 'M' : 'L';
        return `${cmd} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      })
      .join(' ');

    this.svgPath = pathData;

    // Calculate trend
    this.calculateTrend();
  }

  calculateTrend(): void {
    if (this.visibleData.length < 2) {
      this.trend = 'flat';
      this.trendMessage = '';
      return;
    }

    const first = this.visibleData[0].proficiencyPercent;
    const last = this.visibleData[this.visibleData.length - 1].proficiencyPercent;
    const delta = last - first;
    const speed = Math.abs(delta).toFixed(0);

    const hasLocalDecline = this.visibleData.some(
      (week, i) => i > 0 && week.proficiencyPercent < this.visibleData[i - 1].proficiencyPercent
    );

    if (hasLocalDecline || delta < -5) {
      this.trend = 'down';
      this.trendMessage = `Ó, teve uma queda. Bora retomar? 💪`;
    } else if (delta > 5) {
      this.trend = 'up';
      this.trendMessage = `Você está crescendo! 🎉 +${speed}% em ${this.visibleData.length} semanas`;
    } else {
      this.trend = 'flat';
      this.trendMessage = `Seu desempenho se mantém estável. Continue praticando! 💪`;
    }
  }

  getPointColor(index: number): string {
    if (index > 0 && this.visibleData[index].proficiencyPercent < this.visibleData[index - 1].proficiencyPercent) {
      return '#D32F2F'; // Red for drops
    }
    return '#FF6B35'; // Orange for normal progression
  }

  onPointHover(pointIndex: number): void {
    const point = this.points[pointIndex];
    if (!point) {
      return;
    }

    this.activeTooltip = {
      label: `Semana ${point.week.weekNumber}: ${point.week.proficiencyPercent}%`,
      x: point.x,
      y: point.y - 18,
    };
  }

  onPointHoverOut(): void {
    this.activeTooltip = null;
  }
}
