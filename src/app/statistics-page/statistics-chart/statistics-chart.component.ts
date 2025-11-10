import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {
  ChartType,
} from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UsageReport } from '../../core/statistics/models/usage-report.model';
import { BaseChartComponent } from '../../shared/chart/base-chart.component';

@Component({
  selector: 'ds-statistics-chart',
  templateUrl: './statistics-chart.component.html',
  styleUrls: ['./statistics-chart.component.scss'],
  standalone: true,
  imports: [
    BaseChartComponent,
    TranslateModule,
  ],
})
export class StatisticsChartComponent implements OnInit {
  @Input() report: UsageReport;
  @Input() chartType: ChartType = 'bar';

  chartData: any;
  chartOptions: any;
  hasData = false;
  hasMultipleDataPoints = false;

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.processChartData();
  }

  /**
   * Truncate text to maximum length with ellipsis
   * @param text the text to truncate
   * @param maxLength maximum length before truncation
   * @returns truncated text
   */
  private truncateText(text: string, maxLength: number = 60): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  private processChartData(): void {
    if (!this.report || !this.report.points || this.report.points.length === 0) {
      this.hasData = false;
      this.hasMultipleDataPoints = false;
      return;
    }

    this.hasData = true;
    this.hasMultipleDataPoints = this.report.points.length > 1;
    
    const labels = this.report.points.map(point => this.truncateText(point.label));
    const datasets = this.createDatasets();

    this.chartData = {
      labels,
      datasets,
    };

    this.chartOptions = this.createChartOptions();
  }

  private createDatasets(): any[] {
    const headers = this.getHeaders();
    
    return headers.map((header, index) => {
      const colors = this.getColors(index);
      return {
        label: this.getDatasetLabel(header),
        data: this.report.points.map(point => {
          // Values is an object based on table component usage
          if (point.values && typeof point.values === 'object') {
            return point.values[header] || 0;
          }
          return 0;
        }),
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
      };
    });
  }

  private getHeaders(): string[] {
    if (this.report.points.length === 0) return [];
    const firstPoint = this.report.points[0];
    if (firstPoint.values && typeof firstPoint.values === 'object') {
      return Object.keys(firstPoint.values);
    }
    return [];
  }

  private getDatasetLabel(header: string): string {
    return this.translateService.instant(`statistics.table.header.${header}`);
  }

  private getColors(index: number): { background: string, border: string } {
    const backgroundColors = [
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
    ];
    
    const borderColors = [
      'rgba(54, 162, 235, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)',
    ];
    
    return {
      background: backgroundColors[index % backgroundColors.length],
      border: borderColors[index % borderColors.length],
    };
  }

  private createChartOptions(): any {
    const translatedTitle = this.translateService.instant(`statistics.table.title.${this.report.reportType}`);
    
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: translatedTitle,
        },
      },
      scales: {
        x: {
          type: 'category',
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 20,
          },
        },
        y: {
          type: 'linear',
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    };

    return baseOptions;
  }
}