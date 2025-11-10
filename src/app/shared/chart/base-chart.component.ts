import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables,
} from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'ds-base-chart',
  template: `
    <div class="chart-container" [style.height]="height">
      <canvas [attr.data-test]="testId" [id]="chartId"></canvas>
    </div>
  `,
  styleUrls: ['./base-chart.component.scss'],
  standalone: true,
})
export class BaseChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: any;
  @Input() type: ChartType = 'bar';
  @Input() options: any = {};
  @Input() height = '400px';
  @Input() testId?: string;

  chart: Chart | null = null;
  chartId = `chart-${Math.random().toString(36).substring(2, 11)}`;

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data || changes.type || changes.options) {
      if (this.chart) {
        this.updateChart();
      } else {
        setTimeout(() => this.createChart(), 0);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    if (!this.data) return;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const canvas = document.getElementById(this.chartId) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: this.type,
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false,
          },
        },
        ...this.options,
      },
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    // For simplicity, recreate the chart to avoid canvas reuse issues
    this.createChart();
  }
}