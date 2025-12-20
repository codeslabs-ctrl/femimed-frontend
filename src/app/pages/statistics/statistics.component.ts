import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultaService } from '../../services/consulta.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { SimpleChartComponent, ChartData, ChartConfig } from '../../components/charts/simple-chart.component';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, SimpleChartComponent],
  template: `
    <div class="statistics-container">
      <div class="statistics-header">
        <h2>Estadísticas Médicas</h2>
        <p class="subtitle">Análisis y visualización de datos médicos</p>
      </div>

      <!-- Gráfico de Consultas por Estado -->
      <div class="chart-section">
        <div class="chart-header">
          <div class="period-filter">
            <label>📊 Consultas Pacientes - Período:</label>
            <select [(ngModel)]="selectedPeriod" (change)="loadChartData()">
              <option value="7">Últimos 7 días</option>
              <option value="15">Últimos 15 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>

        <!-- Fechas personalizadas -->
        <div *ngIf="selectedPeriod === 'custom'" class="custom-dates">
          <div class="date-inputs">
            <div class="date-input">
              <label>Fecha inicio:</label>
              <input type="date" [(ngModel)]="fechaInicio" (change)="loadChartData()">
            </div>
            <div class="date-input">
              <label>Fecha fin:</label>
              <input type="date" [(ngModel)]="fechaFin" (change)="loadChartData()">
            </div>
            <button class="btn-apply" (click)="loadChartData()">Aplicar</button>
          </div>
        </div>

        <!-- Gráfico -->
        <div class="chart-container" *ngIf="chartData.length > 0">
          <app-simple-chart 
            [data]="chartData" 
            [config]="chartConfig">
          </app-simple-chart>
        </div>

        <!-- Mensaje cuando no hay datos -->
        <div *ngIf="chartData.length === 0 && !loading" class="no-data">
          <p>No hay datos disponibles para el período seleccionado</p>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="loading">
          <p>Cargando datos...</p>
        </div>
      </div>

      <!-- Gráfico de Consultas por Especialidad -->
      <div class="chart-section">
        <div class="chart-header">
          <div class="period-filter">
            <label>🏥 Consultas por Especialidad - Período:</label>
            <select [(ngModel)]="selectedPeriodEspecialidades" (change)="loadEspecialidadesData()">
              <option value="7">Últimos 7 días</option>
              <option value="15">Últimos 15 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>

        <!-- Fechas personalizadas para especialidades -->
        <div *ngIf="selectedPeriodEspecialidades === 'custom'" class="custom-dates">
          <div class="date-inputs">
            <div class="date-input">
              <label>Fecha inicio:</label>
              <input type="date" [(ngModel)]="fechaInicioEspecialidades" (change)="loadEspecialidadesData()">
            </div>
            <div class="date-input">
              <label>Fecha fin:</label>
              <input type="date" [(ngModel)]="fechaFinEspecialidades" (change)="loadEspecialidadesData()">
            </div>
            <button class="btn-apply" (click)="loadEspecialidadesData()">Aplicar</button>
          </div>
        </div>

        <!-- Gráfico de Especialidades -->
        <div class="chart-container" *ngIf="especialidadesData.length > 0">
          <app-simple-chart 
            [data]="especialidadesData" 
            [config]="chartConfigEspecialidades">
          </app-simple-chart>
        </div>

        <!-- Mensaje cuando no hay datos de especialidades -->
        <div *ngIf="especialidadesData.length === 0 && !loadingEspecialidades" class="no-data">
          <p>No hay datos de especialidades disponibles para el período seleccionado</p>
        </div>

        <!-- Loading especialidades -->
        <div *ngIf="loadingEspecialidades" class="loading">
          <p>Cargando datos de especialidades...</p>
        </div>
      </div>

      <!-- Gráfico de Consultas por Médico -->
      <div class="chart-section">
        <div class="chart-header">
          <div class="period-filter">
            <label>👨‍⚕️ Consultas por Médico - Período:</label>
            <select [(ngModel)]="selectedPeriodMedicos" (change)="loadMedicosData()">
              <option value="7">Últimos 7 días</option>
              <option value="15">Últimos 15 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>

        <!-- Fechas personalizadas para médicos -->
        <div *ngIf="selectedPeriodMedicos === 'custom'" class="custom-dates">
          <div class="date-inputs">
            <div class="date-input">
              <label>Fecha inicio:</label>
              <input type="date" [(ngModel)]="fechaInicioMedicos" (change)="loadMedicosData()">
            </div>
            <div class="date-input">
              <label>Fecha fin:</label>
              <input type="date" [(ngModel)]="fechaFinMedicos" (change)="loadMedicosData()">
            </div>
            <button class="btn-apply" (click)="loadMedicosData()">Aplicar</button>
          </div>
        </div>

        <!-- Gráfico de Médicos -->
        <div class="chart-container" *ngIf="medicosData.length > 0">
          <app-simple-chart 
            [data]="medicosData" 
            [config]="chartConfigMedicos">
          </app-simple-chart>
        </div>

        <!-- Mensaje cuando no hay datos de médicos -->
        <div *ngIf="medicosData.length === 0 && !loadingMedicos" class="no-data">
          <p>No hay datos de médicos disponibles para el período seleccionado</p>
        </div>

        <!-- Loading médicos -->
        <div *ngIf="loadingMedicos" class="loading">
          <p>Cargando datos de médicos...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .statistics-container {
      padding: 2rem;
      font-family: 'Montserrat', sans-serif;
    }

    .statistics-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .statistics-header h2 {
      color: #2C2C2C;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #666666;
      font-size: 1.1rem;
      margin: 0;
    }

    .chart-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
      max-width: 100%;
    }

    .chart-header {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .chart-header h3 {
      color: #2C2C2C;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .period-filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .period-filter label {
      font-weight: 600;
      color: #2C2C2C;
      font-size: 1.1rem;
    }

    .period-filter select {
      padding: 0.5rem 1rem;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      background: white;
      font-size: 0.9rem;
      color: #374151;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .period-filter select:hover {
      border-color: #3B82F6;
    }

    .period-filter select:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .custom-dates {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #F9FAFB;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
    }

    .date-inputs {
      display: flex;
      align-items: end;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .date-input {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .date-input label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .date-input input {
      padding: 0.5rem;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #374151;
    }

    .date-input input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .btn-apply {
      padding: 0.5rem 1rem;
      background: #3B82F6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      height: fit-content;
    }

    .btn-apply:hover {
      background: #2563EB;
    }

    .chart-container {
      margin-top: 1rem;
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .chart-container app-simple-chart {
      display: block;
      width: 100%;
      max-width: 100%;
    }

    .no-data, .loading {
      text-align: center;
      padding: 2rem;
      color: #6B7280;
      font-style: italic;
    }

    .loading {
      color: #3B82F6;
    }

    @media (max-width: 768px) {
      .statistics-container {
        padding: 1rem;
      }

      .statistics-header h2 {
        font-size: 2rem;
      }

      .chart-section {
        padding: 1rem;
      }

      .chart-header {
        flex-direction: column;
        align-items: stretch;
      }

      .period-filter {
        justify-content: center;
      }

      .date-inputs {
        flex-direction: column;
        align-items: stretch;
      }

      .btn-apply {
        width: 100%;
      }

      .chart-container {
        overflow-x: auto;
        padding: 0 0.5rem;
      }

      .chart-container app-simple-chart {
        min-width: 600px;
      }
    }
  `]
})
export class StatisticsComponent implements OnInit {
  // Datos del gráfico de estados
  chartData: ChartData[] = [];
  chartConfig: ChartConfig = {
    type: 'bar',
    title: '',
    showLegend: true,
    showValues: true,
    height: 350,
    width: 700
  };

  // Datos del gráfico de especialidades
  especialidadesData: ChartData[] = [];
  chartConfigEspecialidades: ChartConfig = {
    type: 'bar',
    title: '',
    showLegend: true,
    showValues: true,
    height: 350,
    width: 900
  };

  // Datos del gráfico de médicos
  medicosData: ChartData[] = [];
  chartConfigMedicos: ChartConfig = {
    type: 'bar',
    title: '',
    showLegend: true,
    showValues: true,
    height: 400,
    width: 1000
  };

  // Filtros de período
  selectedPeriod: string = '7';
  fechaInicio: string = '';
  fechaFin: string = '';
  loading: boolean = false;

  selectedPeriodEspecialidades: string = '7';
  fechaInicioEspecialidades: string = '';
  fechaFinEspecialidades: string = '';
  loadingEspecialidades: boolean = false;

  // Filtros de período para médicos
  selectedPeriodMedicos: string = '7';
  fechaInicioMedicos: string = '';
  fechaFinMedicos: string = '';
  loadingMedicos: boolean = false;

  constructor(
    private consultaService: ConsultaService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.loadChartData();
    this.loadEspecialidadesData();
    this.loadMedicosData();
  }

  loadChartData() {
    this.loading = true;
    const { fechaInicio, fechaFin } = this.calculateDateRange();
    
    this.consultaService.getEstadisticasPorPeriodo(fechaInicio, fechaFin)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.chartData = response.data.map(item => ({
              label: this.getEstadoLabel(item.estado),
              value: item.total,
              color: this.getEstadoColor(item.estado)
            }));
          } else {
            this.chartData = [];
          }
          this.loading = false;
        },
        error: (error) => {
          this.errorHandler.logError(error, 'cargar estadísticas');
          this.chartData = [];
          this.loading = false;
        }
      });
  }

  calculateDateRange(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    let fechaInicio: string;
    let fechaFin = hoy.toISOString().split('T')[0];
    
    if (this.selectedPeriod === 'custom') {
      fechaInicio = this.fechaInicio || fechaFin;
    } else {
      const dias = parseInt(this.selectedPeriod);
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - dias);
      fechaInicio = fecha.toISOString().split('T')[0];
    }
    
    return { fechaInicio, fechaFin };
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'agendada': '#3B82F6',      // Azul
      'finalizada': '#10B981',    // Verde
      'cancelada': '#EF4444',     // Rojo
      'por_agendar': '#F59E0B',   // Amarillo
      'reagendada': '#8B5CF6',    // Púrpura
      'no_asistio': '#6B7280'     // Gris
    };
    return colores[estado] || '#6B7280';
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'agendada': 'Agendadas',
      'finalizada': 'Finalizadas', 
      'cancelada': 'Canceladas',
      'por_agendar': 'Por Agendar',
      'reagendada': 'Reagendadas',
      'no_asistio': 'No Asistió'
    };
    return labels[estado] || estado;
  }

  loadEspecialidadesData() {
    this.loadingEspecialidades = true;
    const { fechaInicio, fechaFin } = this.calculateEspecialidadesDateRange();
    
    this.consultaService.getEstadisticasPorEspecialidad(fechaInicio, fechaFin)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.especialidadesData = response.data.map(item => ({
              label: item.especialidad,
              value: item.total,
              color: this.getEspecialidadColor(item.especialidad)
            }));
          } else {
            this.especialidadesData = [];
          }
          this.loadingEspecialidades = false;
        },
        error: (error) => {
          this.errorHandler.logError(error, 'cargar estadísticas de especialidades');
          this.especialidadesData = [];
          this.loadingEspecialidades = false;
        }
      });
  }

  loadMedicosData() {
    this.loadingMedicos = true;
    const { fechaInicio, fechaFin } = this.calculateMedicosDateRange();
    
    this.consultaService.getEstadisticasPorMedico(fechaInicio, fechaFin)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.medicosData = response.data.map(item => ({
              label: item.medico,
              value: item.total,
              color: this.getMedicoColor(item.medico)
            }));
          } else {
            this.medicosData = [];
          }
          this.loadingMedicos = false;
        },
        error: (error) => {
          this.errorHandler.logError(error, 'cargar estadísticas de médicos');
          this.medicosData = [];
          this.loadingMedicos = false;
        }
      });
  }

  calculateEspecialidadesDateRange(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    let fechaInicio: string;
    let fechaFin = hoy.toISOString().split('T')[0];
    
    if (this.selectedPeriodEspecialidades === 'custom') {
      fechaInicio = this.fechaInicioEspecialidades || fechaFin;
    } else {
      const dias = parseInt(this.selectedPeriodEspecialidades);
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - dias);
      fechaInicio = fecha.toISOString().split('T')[0];
    }
    
    return { fechaInicio, fechaFin };
  }

  calculateMedicosDateRange(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    let fechaInicio: string;
    let fechaFin = hoy.toISOString().split('T')[0];
    
    if (this.selectedPeriodMedicos === 'custom') {
      fechaInicio = this.fechaInicioMedicos || fechaFin;
    } else {
      const dias = parseInt(this.selectedPeriodMedicos);
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - dias);
      fechaInicio = fecha.toISOString().split('T')[0];
    }
    
    return { fechaInicio, fechaFin };
  }

  getEspecialidadColor(especialidad: string): string {
    const colores: { [key: string]: string } = {
      'Medicina General': '#3B82F6',      // Azul
      'Odontología': '#10B981',           // Verde
      'Oftalmología': '#8B5CF6',          // Púrpura
      'Neurología': '#F59E0B',            // Amarillo
      'Cardiología': '#EF4444',           // Rojo
      'Ortopedia': '#6B7280',             // Gris
      'Pediatría': '#7A9CC6',             // Azul plateado
      'Ginecología': '#84CC16',           // Verde lima
      'Dermatología': '#F97316',          // Naranja
      'Psiquiatría': '#6366F1',           // Índigo
      'Sin Especialidad': '#94A3B8'       // Gris claro
    };
    
    // Si no encuentra la especialidad exacta, usar colores alternativos
    if (!colores[especialidad]) {
      const coloresAlternativos = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#7A9CC6', '#84CC16', '#F97316', '#6366F1'];
      const hash = especialidad.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return coloresAlternativos[Math.abs(hash) % coloresAlternativos.length];
    }
    
    return colores[especialidad];
  }

  getMedicoColor(medico: string): string {
    // Colores profesionales para médicos
    const coloresMedicos = [
      '#3B82F6',  // Azul
      '#10B981',  // Verde
      '#8B5CF6',  // Púrpura
      '#F59E0B',  // Amarillo
      '#EF4444',  // Rojo
      '#7A9CC6',  // Azul plateado
      '#84CC16',  // Verde lima
      '#F97316',  // Naranja
      '#6366F1',  // Índigo
      '#06B6D4',  // Cian
      '#8B5A2B',  // Marrón
      '#DC2626'   // Rojo oscuro
    ];
    
    // Generar color basado en el hash del nombre del médico
    const hash = medico.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return coloresMedicos[Math.abs(hash) % coloresMedicos.length];
  }
}
