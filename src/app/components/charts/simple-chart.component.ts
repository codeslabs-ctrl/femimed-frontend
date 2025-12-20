import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface ChartConfig {
  type: 'bar' | 'pie' | 'line' | 'doughnut';
  title?: string;
  showLegend?: boolean;
  showValues?: boolean;
  height?: number;
  width?: number;
}

@Component({
  selector: 'app-simple-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" [style.width.px]="config.width || 400" [style.height.px]="config.height || 300">
      <h3 *ngIf="config.title" class="chart-title">{{ config.title }}</h3>
      
      <!-- Gráfico de barras -->
      <div *ngIf="config.type === 'bar'" class="bar-chart">
        <div class="chart-svg" [style.height.px]="(config.height || 300) - 60">
          <svg [attr.width]="config.width || 400" [attr.height]="(config.height || 300) - 60" viewBox="0 0 400 240">
            <g *ngFor="let item of data; let i = index" class="bar-group">
              <rect 
                [attr.x]="(i * (400 / data.length)) + 10" 
                [attr.y]="240 - (item.value / maxValue) * 200" 
                [attr.width]="(400 / data.length) - 20" 
                [attr.height]="(item.value / maxValue) * 200"
                [attr.fill]="item.color || getDefaultColor(i)"
                class="bar"
                [attr.data-value]="item.value"
                [attr.data-label]="item.label">
              </rect>
              <text 
                [attr.x]="(i * (400 / data.length)) + (400 / data.length / 2)" 
                [attr.y]="250" 
                text-anchor="middle" 
                class="bar-label">
                {{ item.label }}
              </text>
              <text 
                *ngIf="config.showValues"
                [attr.x]="(i * (400 / data.length)) + (400 / data.length / 2)" 
                [attr.y]="240 - (item.value / maxValue) * 200 - 5" 
                text-anchor="middle" 
                class="bar-value">
                {{ item.value }}
              </text>
            </g>
          </svg>
        </div>
      </div>

      <!-- Gráfico circular -->
      <div *ngIf="config.type === 'pie' || config.type === 'doughnut'" class="pie-chart">
        <div class="chart-svg" [style.height.px]="(config.height || 300) - 60">
          <svg [attr.width]="config.width || 400" [attr.height]="(config.height || 300) - 60" viewBox="0 0 400 240">
            <g transform="translate(200, 120)">
              <path 
                *ngFor="let item of pieData; let i = index"
                [attr.d]="item.path"
                [attr.fill]="item.color"
                class="pie-slice"
                [attr.data-value]="item.value"
                [attr.data-label]="item.label">
              </path>
              <circle 
                *ngIf="config.type === 'doughnut'"
                cx="0" 
                cy="0" 
                r="60" 
                fill="white" 
                class="doughnut-center">
              </circle>
            </g>
          </svg>
        </div>
      </div>

      <!-- Gráfico de líneas -->
      <div *ngIf="config.type === 'line'" class="line-chart">
        <div class="chart-svg" [style.height.px]="(config.height || 300) - 60">
          <svg [attr.width]="config.width || 400" [attr.height]="(config.height || 300) - 60" viewBox="0 0 400 240">
            <g class="line-group">
              <polyline 
                [attr.points]="linePoints"
                fill="none"
                stroke="#7A9CC6"
                stroke-width="3"
                class="line">
              </polyline>
              <circle 
                *ngFor="let point of lineData; let i = index"
                [attr.cx]="point.x"
                [attr.cy]="point.y"
                r="4"
                fill="#7A9CC6"
                class="line-point"
                [attr.data-value]="point.value"
                [attr.data-label]="point.label">
              </circle>
            </g>
            <g *ngFor="let item of data; let i = index" class="line-labels">
              <text 
                [attr.x]="(i * (400 / (data.length - 1)))" 
                [attr.y]="250" 
                text-anchor="middle" 
                class="line-label">
                {{ item.label }}
              </text>
            </g>
          </svg>
        </div>
      </div>

      <!-- Leyenda -->
      <div *ngIf="config.showLegend" class="chart-legend">
        <div *ngFor="let item of data; let i = index" class="legend-item">
          <div class="legend-color" [style.background-color]="item.color || getDefaultColor(i)"></div>
          <span class="legend-label">{{ item.label }}</span>
          <span *ngIf="config.showValues" class="legend-value">({{ item.value }})</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(44, 44, 44, 0.1);
      border: 1px solid #F5F5F5;
      font-family: 'Montserrat', sans-serif;
    }

    .chart-title {
      color: #2C2C2C;
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      text-align: center;
    }

    .chart-svg {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .bar {
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .bar:hover {
      opacity: 0.8;
      transform: scale(1.05);
    }

    .bar-label, .line-label {
      font-size: 0.8rem;
      fill: #666666;
      font-weight: 500;
    }

    .bar-value {
      font-size: 0.7rem;
      fill: #2C2C2C;
      font-weight: 600;
    }

    .pie-slice {
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .pie-slice:hover {
      opacity: 0.8;
      transform: scale(1.05);
    }

    .line {
      transition: all 0.3s ease;
    }

    .line-point {
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .line-point:hover {
      r: 6;
      fill: #C2185B;
    }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
      justify-content: center;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-label {
      color: #2C2C2C;
      font-weight: 500;
    }

    .legend-value {
      color: #666666;
      font-weight: 400;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .chart-container {
        padding: 1rem;
      }

      .chart-legend {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class SimpleChartComponent implements OnInit, OnChanges {
  @Input() data: ChartData[] = [];
  @Input() config: ChartConfig = { type: 'bar' };

  maxValue = 0;
  pieData: any[] = [];
  lineData: any[] = [];
  linePoints = '';

  ngOnInit() {
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['config']) {
      this.processData();
    }
  }

  processData() {
    if (!this.data || this.data.length === 0) return;

    this.maxValue = Math.max(...this.data.map(item => item.value));

    if (this.config.type === 'pie' || this.config.type === 'doughnut') {
      this.calculatePieData();
    } else if (this.config.type === 'line') {
      this.calculateLineData();
    }
  }

  calculatePieData() {
    const total = this.data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const radius = 80;
    const innerRadius = this.config.type === 'doughnut' ? 40 : 0;

    this.pieData = this.data.map((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const x1 = Math.cos(startAngle) * radius;
      const y1 = Math.sin(startAngle) * radius;
      const x2 = Math.cos(endAngle) * radius;
      const y2 = Math.sin(endAngle) * radius;

      const x1Inner = Math.cos(startAngle) * innerRadius;
      const y1Inner = Math.sin(startAngle) * innerRadius;
      const x2Inner = Math.cos(endAngle) * innerRadius;
      const y2Inner = Math.sin(endAngle) * innerRadius;

      const largeArcFlag = angle > Math.PI ? 1 : 0;

      const path = this.config.type === 'doughnut' 
        ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x2Inner} ${y2Inner} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner} Z`
        : `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      currentAngle += angle;

      return {
        path,
        color: item.color || this.getDefaultColor(index),
        value: item.value,
        label: item.label
      };
    });
  }

  calculateLineData() {
    const width = this.config.width || 400;
    const height = (this.config.height || 300) - 60;
    const padding = 40;

    this.lineData = this.data.map((item, index) => {
      const x = padding + (index * (width - 2 * padding) / (this.data.length - 1));
      const y = height - padding - ((item.value / this.maxValue) * (height - 2 * padding));
      
      return {
        x,
        y,
        value: item.value,
        label: item.label
      };
    });

    this.linePoints = this.lineData.map(point => `${point.x},${point.y}`).join(' ');
  }

  getDefaultColor(index: number): string {
    const colors = [
      '#7A9CC6', '#2F90B0', '#EA7EC3', '#4CAF50', '#FF9800',
      '#9C27B0', '#00BCD4', '#8BC34A', '#FF5722', '#607D8B'
    ];
    return colors[index % colors.length];
  }
}