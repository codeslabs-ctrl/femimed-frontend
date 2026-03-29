import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../services/patient.service';
import { HistoricoService, HistoricoWithDetails } from '../../../services/historico.service';
import { MedicoService } from '../../../services/medico.service';
import { AuthService } from '../../../services/auth.service';
import { DateService } from '../../../services/date.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { AlertService } from '../../../services/alert.service';

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
                  <th>Título</th>
                  <th>Fecha</th>
                  <th>Médico</th>
                  <th>Especialidad</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of historicos">
                  <td>{{ getNumeroControl(h) }}</td>
                  <td>{{ getTituloDisplay(h.titulo) }}</td>
                  <td>{{ formatDate(h.fecha_consulta) }}</td>
                  <td>{{ getMedicoTitulo(h) }} {{ h.medico_nombre }} {{ h.medico_apellidos }}</td>
                  <td>{{ h.especialidad_nombre || '-' }}</td>
                  <td>
                    <button type="button" class="btn btn-sm btn-primary"
                            (click)="abrirControl(h)">
                      Editar
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

  /** Cache sexo por medico_id cuando el historico no lo trae (fallback Dr./Dra.) */
  medicoIdToSexo: Record<number, string | null> = {};

  currentUser: any = null;
  get isMedico(): boolean {
    return this.currentUser?.rol === 'medico';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private historicoService: HistoricoService,
    private medicoService: MedicoService,
    private authService: AuthService,
    private dateService: DateService,
    private errorHandler: ErrorHandlerService,
    private alertService: AlertService
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
            this.asegurarMedicoSexoEnLista();
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

  /**
   * La consulta ya ocurrió (fecha hoy o pasada). No se permite editar historial de consultas futuras.
   */
  esConsultaPasadaOHoy(h: HistoricoWithDetails): boolean {
    if (!h.fecha_consulta) return false;
    const d = new Date(h.fecha_consulta);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d.getTime() <= today.getTime();
  }

  puedeEditar(h: HistoricoWithDetails): boolean {
    if (!this.isMedico) return false;
    const medicoId = this.currentUser?.medico_id;
    if (!medicoId || h.medico_id !== medicoId) return false;
    // No permitir editar historial de una consulta futura (aún no atendida)
    return this.esConsultaPasadaOHoy(h);
  }

  abrirControl(h: HistoricoWithDetails): void {
    if (this.puedeEditar(h)) {
      this.router.navigate(['/patients', this.patientId, 'historia-medica', String(h.id)]);
      return;
    }
    const mensaje = this.esConsultaPasadaOHoy(h)
      ? 'Solo el médico que atendió este control puede editarlo.'
      : 'No se puede editar un control asociado a una consulta futura (aún no atendida).';
    this.alertService.showWarning(mensaje);
  }

  volver(): void {
    this.router.navigate(['/patients']);
  }

  formatDate(dateString: string | undefined): string {
    return this.dateService.formatDate(dateString, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /** Título Dr./Dra. según medico_sexo del historico o cache cargado por fallback. */
  getMedicoTitulo(h: HistoricoWithDetails): string {
    const sexo = this.medicoIdToSexo[h.medico_id] ?? h.medico_sexo;
    return sexo === 'Femenino' ? 'Dra.' : 'Dr.';
  }

  /**
   * Si algún historico tiene medico_id pero no medico_sexo, carga el médico y guarda en medicoIdToSexo.
   */
  private asegurarMedicoSexoEnLista(): void {
    const idsToLoad = [...new Set(
      this.historicos
        .filter(h => h.medico_id && (h.medico_sexo === null || h.medico_sexo === undefined))
        .map(h => h.medico_id)
    )];
    idsToLoad.forEach(medicoId => {
      this.medicoService.getMedicoById(medicoId).subscribe({
        next: (resp) => {
          if (resp.success && resp.data && (resp.data as any).sexo != null) {
            this.medicoIdToSexo[medicoId] = (resp.data as any).sexo;
          }
        }
      });
    });
  }

  /** Muestra el título/tipo de consulta (ej. primera_vez → "Primera vez", control → "Control"). */
  getTituloDisplay(titulo: string | null | undefined): string {
    if (!titulo || !titulo.trim()) return '—';
    const t = titulo.trim().toLowerCase();
    if (t === 'primera_vez') return 'Primera vez';
    if (t === 'control') return 'Control';
    if (t === 'seguimiento') return 'Seguimiento';
    if (t === 'registro_inicial') return 'Registro inicial';
    return titulo.trim();
  }

  /**
   * Número de control: YYYYMMDD-id (ej. 20251202-1)
   */
  getNumeroControl(h: HistoricoWithDetails): string {
    const d = h.fecha_consulta ? new Date(h.fecha_consulta) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}-${h.id}`;
  }
}


