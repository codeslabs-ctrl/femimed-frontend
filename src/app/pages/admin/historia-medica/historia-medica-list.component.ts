import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../services/patient.service';
import { HistoricoService, HistoricoWithDetails } from '../../../services/historico.service';
import { AuthService } from '../../../services/auth.service';
import { DateService } from '../../../services/date.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';

@Component({
  selector: 'app-historia-medica-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./historia-medica-list.component.css'],
  template: `
    <div class="historia-medica-page">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-file-medical"></i> Historial Pacientes</h1>
          <p class="page-description">Seleccione un registro para ver o editar (según permisos).</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="volver()">
            ← Volver a Gestión de Pacientes
          </button>
          <button *ngIf="isMedico" class="btn btn-primary" (click)="nuevoControl()">
            ➕ Nuevo Control
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Cargando historial...</p>
        </div>
      </div>

      <div *ngIf="error" class="error-container">
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" (click)="load()">
            <i class="fas fa-refresh"></i> Reintentar
          </button>
        </div>
      </div>

      <div *ngIf="!loading && !error" class="form-container">
        <div class="info-section">
          <h3>Información del Paciente</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Paciente:</label>
              <span>{{ patientName }}</span>
            </div>
            <div class="info-item">
              <label>Cédula:</label>
              <span>{{ patientCedula || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="controles-section">
          <div class="controles-header">
            <h3>Historial Pacientes</h3>
          </div>

          <div *ngIf="historicos.length === 0" class="empty-inline">
            No hay controles registrados para este paciente.
          </div>

          <div *ngIf="historicos.length > 0" class="controles-table">
            <table class="table">
              <thead>
                <tr>
                  <th>Número de Control</th>
                  <th>Fecha</th>
                  <th>Médico</th>
                  <th>Especialidad</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of historicos">
                  <td>{{ h.id }}</td>
                  <td>{{ formatDate(h.fecha_consulta) }}</td>
                  <td>Dr./Dra. {{ h.medico_nombre }} {{ h.medico_apellidos }}</td>
                  <td>{{ h.especialidad_nombre || '-' }}</td>
                  <td>
                    <button type="button" class="btn btn-sm"
                            [class.btn-primary]="puedeEditar(h)"
                            [class.btn-outline]="!puedeEditar(h)"
                            (click)="abrirControl(h)">
                      {{ puedeEditar(h) ? 'Editar' : 'Ver' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HistoriaMedicaListComponent implements OnInit {
  patientId = 0;
  historicos: HistoricoWithDetails[] = [];
  loading = true;
  error: string | null = null;

  patientName = '';
  patientCedula = '';

  currentUser: any = null;
  get isMedico(): boolean {
    return this.currentUser?.rol === 'medico';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private historicoService: HistoricoService,
    private authService: AuthService,
    private dateService: DateService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.route.params.subscribe(params => {
      this.patientId = +params['id'];
      this.load();
    });
  }

  load(): void {
    if (!this.patientId) {
      this.error = 'ID de paciente no válido';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.patientService.getPatientById(this.patientId).subscribe({
      next: (resp) => {
        const p = resp?.data;
        this.patientName = p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : '';
        this.patientCedula = p?.cedula || '';

        this.historicoService.getHistoricoByPaciente(this.patientId).subscribe({
          next: (hresp) => {
            this.historicos = (hresp.success && hresp.data) ? hresp.data : [];
            this.loading = false;
          },
          error: (err) => {
            this.errorHandler.logError(err, 'cargar historial pacientes');
            this.error = this.errorHandler.getSafeErrorMessage(err, 'cargar historial pacientes');
            this.historicos = [];
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.errorHandler.logError(err, 'cargar paciente');
        this.error = this.errorHandler.getSafeErrorMessage(err, 'cargar paciente');
        this.loading = false;
      }
    });
  }

  puedeEditar(h: HistoricoWithDetails): boolean {
    if (!this.isMedico) return false;
    const medicoId = this.currentUser?.medico_id;
    return !!medicoId && h.medico_id === medicoId;
  }

  abrirControl(h: HistoricoWithDetails): void {
    this.router.navigate(['/patients', this.patientId, 'historia-medica', String(h.id)]);
  }

  nuevoControl(): void {
    this.router.navigate(['/patients', this.patientId, 'historia-medica', 'nuevo']);
  }

  volver(): void {
    this.router.navigate(['/patients']);
  }

  formatDate(dateString: string | undefined): string {
    return this.dateService.formatDate(dateString, { year: 'numeric', month: 'long', day: 'numeric' });
  }
}


