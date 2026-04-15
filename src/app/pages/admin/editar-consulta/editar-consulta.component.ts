import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ConsultaService } from '../../../services/consulta.service';
import { PatientService } from '../../../services/patient.service';
import { MedicoService } from '../../../services/medico.service';
import { AuthService } from '../../../services/auth.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { AlertService } from '../../../services/alert.service';
import { ConsultaFormData, ConsultaWithDetails } from '../../../models/consulta.model';
import { Patient } from '../../../models/patient.model';
import { Medico } from '../../../services/medico.service';
import { EspecialidadService, Especialidad } from '../../../services/especialidad.service';
import { ClinicaAtencionService, ClinicaAtencion } from '../../../services/clinica-atencion.service';

@Component({
  selector: 'app-editar-consulta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="editar-consulta-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>
            <i class="fas fa-edit"></i>
            Editar Consulta
          </h1>
          <p class="page-description">
            Modificar los datos de la consulta médica
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="volver()">
            ← Volver a Gestión de Consultas
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Cargando datos de la consulta...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar la consulta</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" (click)="cargarConsulta()">
            <i class="fas fa-refresh"></i>
            Reintentar
          </button>
        </div>
      </div>

      <!-- Formulario (misma estructura y reglas que Nueva Consulta) -->
      <div *ngIf="!loading && !error" class="form-container">
        <form (ngSubmit)="updateConsulta()" #consultaFormRef="ngForm">
          <div class="form-section">
            <h2>Información de la Consulta</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label>Paciente</label>
                <div class="preselected-patient">
                  <div class="preselected-info">
                    <span class="preselected-label">Paciente:</span>
                    <span class="preselected-name">{{ getPacienteNombre() }} — Cédula: {{ getPacienteCedula() }}</span>
                  </div>
                </div>
              </div>
              
              <div *ngIf="currentUser?.rol === 'administrador' || currentUser?.rol === 'secretaria'">
                <div class="form-group">
                  <label for="especialidad_id">Especialidad *</label>
                  <select 
                    id="especialidad_id" 
                    class="form-control" 
                    [(ngModel)]="selectedEspecialidadId" 
                    name="especialidad_id"
                    (change)="onEspecialidadChange()"
                    required>
                    <option [ngValue]="0">Seleccionar especialidad</option>
                    <option *ngFor="let especialidad of especialidades" [ngValue]="especialidad.id">
                      {{especialidad.nombre_especialidad}}
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="medico_id">Médico *</label>
                  <select 
                    id="medico_id" 
                    class="form-control" 
                    [(ngModel)]="consultaForm.medico_id" 
                    name="medico_id"
                    [disabled]="!selectedEspecialidadId || selectedEspecialidadId === 0"
                    required>
                    <option [ngValue]="0">
                      {{ selectedEspecialidadId && selectedEspecialidadId !== 0 ? 'Seleccionar médico' : 'Primero seleccione una especialidad' }}
                    </option>
                    <option *ngFor="let medico of medicosFiltrados" [ngValue]="medico.id">
                      {{ medico.sexo === 'Femenino' ? 'Dra.' : 'Dr.' }} {{medico.nombres}} {{medico.apellidos}}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="form-group" *ngIf="currentUser?.rol === 'medico'">
                <label>Médico asignado</label>
                <div class="medico-info">
                  <span class="medico-nombre">{{ currentUserMedicoTitulo() }} {{currentUser.nombres}} {{currentUser.apellidos}}</span>
                  <span class="medico-especialidad">{{currentUser.especialidad_nombre}}</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="fecha_pautada">Fecha *</label>
                <input 
                  type="date" 
                  id="fecha_pautada" 
                  class="form-control" 
                  [(ngModel)]="consultaForm.fecha_pautada" 
                  name="fecha_pautada"
                  [min]="getTodayDate()"
                  required>
              </div>
              
              <div class="form-group">
                <label for="hora_pautada">Hora *</label>
                <input 
                  type="time" 
                  id="hora_pautada" 
                  class="form-control" 
                  [(ngModel)]="consultaForm.hora_pautada" 
                  name="hora_pautada"
                  required>
              </div>

              <div class="form-group">
                <label for="duracion_estimada">Duración (minutos) *</label>
                <input 
                  type="number" 
                  id="duracion_estimada" 
                  class="form-control" 
                  [(ngModel)]="consultaForm.duracion_estimada" 
                  name="duracion_estimada"
                  min="15"
                  max="120"
                  required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="tipo_consulta">Tipo de Consulta</label>
                <select 
                  id="tipo_consulta" 
                  class="form-control" 
                  [(ngModel)]="consultaForm.tipo_consulta" 
                  name="tipo_consulta"
                  [disabled]="esPrimeraConsultaPaciente">
                  <option *ngIf="!pacienteYaTieneConsultas" value="primera_vez">Primera Vez</option>
                  <option value="control">Control</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="urgencia">Urgencia</option>
                </select>
                <small *ngIf="esPrimeraConsultaPaciente" class="form-text text-muted">Es la primera consulta de este paciente; el tipo queda fijado en Primera Vez.</small>
              </div>

              <div class="form-group">
                <label for="prioridad">Prioridad</label>
                <select 
                  id="prioridad" 
                  class="form-control" 
                  [(ngModel)]="consultaForm.prioridad" 
                  name="prioridad">
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="clinica_atencion_id">Clínica de atención</label>
                <select 
                  id="clinica_atencion_id" 
                  class="form-control" 
                  [(ngModel)]="consultaForm.clinica_atencion_id" 
                  name="clinica_atencion_id">
                  <option [ngValue]="null">Seleccionar sede (opcional)</option>
                  <option *ngFor="let c of clinicasAtencion" [ngValue]="c.id">{{ c.nombre_clinica }}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="motivo_consulta">Motivo de la Consulta *</label>
              <textarea 
                id="motivo_consulta" 
                class="form-control" 
                [(ngModel)]="consultaForm.motivo_consulta" 
                name="motivo_consulta"
                rows="4"
                placeholder="Describa el motivo de la consulta..."
                required></textarea>
            </div>

            <div class="form-group">
              <label for="observaciones">Observaciones</label>
              <textarea 
                id="observaciones" 
                class="form-control" 
                [(ngModel)]="consultaForm.observaciones" 
                name="observaciones"
                rows="3"
                placeholder="Observaciones adicionales (opcional)"></textarea>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="form-actions">
            <button 
              type="button" 
              class="btn btn-outline" 
              (click)="resetForm()"
              [disabled]="isSubmitting">
              <span class="btn-icon">🔄</span>
              <span class="btn-text">Restaurar</span>
            </button>
            <button 
              type="submit" 
              class="btn btn-edit" 
              [disabled]="isSubmitting">
              <span *ngIf="isSubmitting" class="btn-icon">⏳</span>
              <span *ngIf="!isSubmitting" class="btn-icon">💾</span>
              <span class="btn-text">{{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .editar-consulta-page {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .page-header h1 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
      font-size: 2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-header h1 i {
      color: var(--color-primary);
    }

    .page-description {
      color: #6b7280;
      margin: 0;
      font-size: 0.875rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .loading-spinner {
      text-align: center;
      color: #6b7280;
    }

    .loading-spinner i {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: var(--color-primary);
    }

    .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .error-message {
      text-align: center;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 2rem;
      max-width: 500px;
    }

    .error-message i {
      font-size: 3rem;
      color: #dc2626;
      margin-bottom: 1rem;
    }

    .error-message h3 {
      color: #dc2626;
      margin: 0 0 1rem 0;
    }

    .error-message p {
      color: #7f1d1d;
      margin: 0 0 1.5rem 0;
    }

    .form-container {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 2rem;
    }

    .form-section {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
      width: 100%;
      box-sizing: border-box;
    }

    .form-section h2 {
      margin: 0 0 1.5rem 0;
      color: #2c3e50;
      font-size: 1.25rem;
      font-weight: 600;
      border-bottom: 2px solid #f5576c;
      padding-bottom: 0.5rem;
    }

    .preselected-patient {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #0ea5e9;
      border-radius: 0.75rem;
      padding: 1rem;
    }

    .preselected-info {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    .preselected-label {
      color: #0c4a6e;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .preselected-name {
      color: #0369a1;
      font-weight: 700;
      font-size: 1rem;
    }

    .form-text.text-muted {
      display: block;
      margin-top: 0.35rem;
      font-size: 0.8rem;
      color: #64748b;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      width: 100%;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #2c3e50;
      font-size: 0.875rem;
    }

    .form-control {
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      background: white;
    }

    .form-control:focus {
      outline: none;
      border-color: #f5576c;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .form-control textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 0;
      border-top: 1px solid #e9ecef;
      margin-top: 2rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-edit {
      background: #f59e0b;
      color: white;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      font-weight: 500;
    }

    .btn-edit:hover:not(:disabled) {
      background: #d97706;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
    }

    .btn-secondary {
      background: #F5F5F5;
      color: #2C2C2C;
      border: 1px solid #f5576c;
      font-weight: 500;
    }

    .btn-secondary:hover {
      background: #f5576c;
      color: white;
      border-color: #f5576c;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .btn-outline {
      background: transparent;
      color: #6c757d;
      border: 1px solid #6c757d;
      font-weight: 500;
    }

    .btn-outline:hover {
      background: #6c757d;
      color: white;
      border-color: #6c757d;
    }

    .btn-icon {
      font-size: 1rem;
    }

    .medico-info {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .medico-nombre {
      font-weight: 600;
      color: #2c3e50;
      font-size: 1rem;
    }

    .medico-especialidad {
      color: #6c757d;
      font-size: 0.875rem;
      font-style: italic;
    }

    .paciente-info {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .paciente-nombre {
      font-weight: 600;
      color: #2c3e50;
      font-size: 1rem;
    }

    .paciente-cedula {
      color: #6c757d;
      font-size: 0.875rem;
      font-weight: 500;
    }

    @media (max-width: 1024px) {
      .form-container {
        max-width: 95%;
        padding: 0 1rem;
      }
      
      .form-section {
        padding: 1.5rem;
      }
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .form-container {
        padding: 0 1rem;
        max-width: 100%;
      }
      
      .form-section {
        padding: 1rem;
        margin-bottom: 1rem;
      }
      
      .page-header {
        padding: 1rem;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .page-header h1 {
        font-size: 1.5rem;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }
    }
  `]
})
export class EditarConsultaComponent implements OnInit {
  consultaForm: ConsultaFormData = {
    paciente_id: 0,
    medico_id: 0,
    clinica_atencion_id: null,
    motivo_consulta: '',
    tipo_consulta: 'primera_vez',
    fecha_pautada: '',
    hora_pautada: '',
    observaciones: '',
    duracion_estimada: 30,
    prioridad: 'normal'
  };
  
  consultaOriginal: ConsultaFormData | null = null;
  consultaData: ConsultaWithDetails | null = null;
  pacientes: Patient[] = [];
  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = [];
  especialidades: Especialidad[] = [];
  clinicasAtencion: ClinicaAtencion[] = [];
  selectedEspecialidadId = 0;
  /** Copia inicial del formulario tras cargar pacientes/médicos (para Restaurar). */
  private initialSnapshotDone = false;

  isSubmitting = false;
  loading = true;
  error: string | null = null;
  currentUser: any = null;
  consultaId: number = 0;

  constructor(
    private consultaService: ConsultaService,
    private patientService: PatientService,
    private medicoService: MedicoService,
    private especialidadService: EspecialidadService,
    private clinicaAtencionService: ClinicaAtencionService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private alertService: AlertService
  ) {}

  /** Misma lógica que Nueva Consulta: sin consultas previas → solo Primera Vez. */
  get esPrimeraConsultaPaciente(): boolean {
    const id = Number(this.consultaForm.paciente_id);
    if (!id) return false;
    const paciente = this.pacientes.find(p => Number(p.id) === id);
    return !!paciente && !paciente.tiene_consulta;
  }

  get pacienteYaTieneConsultas(): boolean {
    const id = Number(this.consultaForm.paciente_id);
    if (!id) return false;
    const paciente = this.pacientes.find(p => Number(p.id) === id);
    return !!paciente && !!paciente.tiene_consulta;
  }

  ngOnInit(): void {
    // Obtener ID de la consulta desde la ruta
    this.route.params.subscribe(params => {
      this.consultaId = +params['id'];
      if (this.consultaId) {
        this.cargarConsulta();
      } else {
        this.error = 'ID de consulta no válido';
        this.loading = false;
      }
    });

    // Cargar usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('👤 Usuario actual:', this.currentUser);
    });
    
    this.loadPacientes();
    this.loadMedicos();
    this.loadEspecialidades();
    this.loadClinicasAtencion();
  }

  loadClinicasAtencion(): void {
    this.clinicaAtencionService.list(true).subscribe({
      next: (res) => {
        this.clinicasAtencion = res.data || [];
      },
      error: (err) => this.errorHandler.logError(err, 'cargar clínicas de atención')
    });
  }

  loadEspecialidades(): void {
    this.especialidadService.getAllEspecialidades().subscribe({
      next: (response) => {
        this.especialidades = response.data || [];
      },
      error: (error) => this.errorHandler.logError(error, 'cargar especialidades')
    });
  }

  cargarConsulta(): void {
    this.loading = true;
    this.error = null;

    this.consultaService.getConsultaById(this.consultaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const consulta = response.data;
          
          // Almacenar datos completos de la consulta
          this.consultaData = consulta;
          
          const rawPrioridad = consulta.prioridad || 'normal';
          const prioridadForm =
            rawPrioridad === 'baja' ? 'normal' : (rawPrioridad as ConsultaFormData['prioridad']);

          const capId = (consulta as ConsultaWithDetails & { clinica_atencion_id?: number | null }).clinica_atencion_id;

          this.consultaForm = {
            paciente_id: consulta.paciente_id,
            medico_id: consulta.medico_id,
            clinica_atencion_id: capId ?? null,
            motivo_consulta: consulta.motivo_consulta || '',
            tipo_consulta: consulta.tipo_consulta,
            fecha_pautada: consulta.fecha_pautada,
            hora_pautada: consulta.hora_pautada,
            observaciones: consulta.observaciones || '',
            duracion_estimada: consulta.duracion_estimada || 30,
            prioridad: prioridadForm,
            diagnostico_preliminar: consulta.diagnostico_preliminar || '',
            notas_internas: consulta.notas_internas || ''
          };

          this.initialSnapshotDone = false;
          this.tryFinalizeInitialSnapshot();

          console.log('📋 Consulta cargada:', consulta);
          console.log('👤 Datos del paciente:', {
            nombre: consulta.paciente_nombre,
            apellidos: consulta.paciente_apellidos,
            cedula: consulta.paciente_cedula,
            paciente_id: consulta.paciente_id
          });
          console.log('📋 Lista de pacientes cargada:', this.pacientes.length);
          if (this.pacientes.length > 0) {
            const pacienteEncontrado = this.pacientes.find(p => p.id === consulta.paciente_id);
            console.log('🔍 Paciente encontrado en lista:', pacienteEncontrado);
          }
          console.log('👨‍⚕️ Datos del médico:', {
            nombre: consulta.medico_nombre,
            apellidos: consulta.medico_apellidos,
            especialidad: consulta.especialidad_nombre
          });
          console.log('📝 Formulario inicializado:', this.consultaForm);
        } else {
          this.error = 'No se pudo cargar la consulta';
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar consulta');
        this.error = this.errorHandler.getSafeErrorMessage(error, 'cargar consulta');
        this.loading = false;
      }
    });
  }

  loadPacientes(): void {
    this.patientService.getPatientsByMedicoForStats(null).subscribe({
      next: (pacientes: Patient[]) => {
        this.pacientes = pacientes || [];
        console.log('📋 Pacientes cargados:', this.pacientes.length);
        this.tryFinalizeInitialSnapshot();
      },
      error: (error: any) => {
        this.errorHandler.logError(error, 'cargar pacientes');
      }
    });
  }

  loadMedicos(): void {
    this.medicoService.getAllMedicos().subscribe({
      next: (response) => {
        this.medicos = response.data || [];
        console.log('👨‍⚕️ Médicos cargados:', this.medicos.length);
        this.tryFinalizeInitialSnapshot();
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar médicos');
      }
    });
  }

  /** Tras cargar consulta + listas: especialidad/médico filtrado y reglas de tipo (como Nueva Consulta). */
  private tryFinalizeInitialSnapshot(): void {
    if (this.initialSnapshotDone || !this.consultaData) return;
    if (!this.medicos.length || !this.pacientes.length) return;

    this.syncMedicoYEspecialidadDesdeFormulario();
    this.aplicarReglasTipoPaciente();

    this.consultaOriginal = { ...this.consultaForm };
    this.initialSnapshotDone = true;
  }

  private syncMedicoYEspecialidadDesdeFormulario(): void {
    const mid = this.consultaForm.medico_id;
    if (!mid || !this.medicos.length) return;
    const m = this.medicos.find(x => x.id === mid);
    if (!m || m.especialidad_id == null) return;
    const especialidadId = Number(m.especialidad_id);
    this.selectedEspecialidadId = especialidadId;
    this.medicosFiltrados = this.medicos.filter(
      med => Number(med.especialidad_id) === especialidadId
    );
    this.consultaForm.medico_id = mid;
  }

  onEspecialidadChange(): void {
    this.consultaForm.medico_id = 0;
    if (this.selectedEspecialidadId && this.selectedEspecialidadId !== 0) {
      const especialidadId = Number(this.selectedEspecialidadId);
      this.medicosFiltrados = this.medicos.filter(medico => {
        const medicoEspecialidadId = Number(medico.especialidad_id);
        return medicoEspecialidadId === especialidadId;
      });
    } else {
      this.medicosFiltrados = [];
    }
  }

  /** Alineado con `NuevaConsultaComponent.onPacienteChange` para el paciente fijo de la consulta. */
  private aplicarReglasTipoPaciente(): void {
    const id = Number(this.consultaForm.paciente_id);
    if (!id) return;
    const paciente = this.pacientes.find(p => Number(p.id) === id);
    if (paciente && !paciente.tiene_consulta) {
      this.consultaForm.tipo_consulta = 'primera_vez';
    } else if (paciente && paciente.tiene_consulta && this.consultaForm.tipo_consulta === 'primera_vez') {
      this.consultaForm.tipo_consulta = 'control';
    }
  }

  currentUserMedicoTitulo(): string {
    if (!this.currentUser?.medico_id) return 'Dr.';
    const medico = this.medicos.find(m => m.id === this.currentUser!.medico_id);
    return medico?.sexo === 'Femenino' ? 'Dra.' : 'Dr.';
  }

  updateConsulta(): void {
    if (this.isSubmitting) return;

    if (!this.consultaForm.paciente_id || this.consultaForm.paciente_id === 0) {
      this.alertService.showWarning('Paciente requerido.');
      return;
    }

    if (this.currentUser?.rol === 'administrador' || this.currentUser?.rol === 'secretaria') {
      if (!this.selectedEspecialidadId || this.selectedEspecialidadId === 0) {
        this.alertService.showWarning('Especialidad requerida. Por favor, seleccione una especialidad antes de continuar.');
        return;
      }
      if (!this.consultaForm.medico_id || this.consultaForm.medico_id === 0) {
        this.alertService.showWarning('Médico requerido. Por favor, seleccione un médico de la lista antes de continuar.');
        return;
      }
    }

    if (this.esPrimeraConsultaPaciente) {
      this.consultaForm.tipo_consulta = 'primera_vez';
    }

    if (!this.consultaForm.motivo_consulta.trim()) {
      this.alertService.showWarning('Motivo de consulta requerido. Por favor, ingrese el motivo de la consulta para continuar.');
      return;
    }

    if (!this.consultaForm.fecha_pautada) {
      this.alertService.showWarning('Fecha requerida. Por favor, seleccione una fecha para la consulta.');
      return;
    }

    const hoyVenezuela = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
    const fechaPautada = String(this.consultaForm.fecha_pautada ?? '').slice(0, 10);
    if (fechaPautada < hoyVenezuela) {
      this.alertService.showWarning('Fecha inválida. La fecha de la consulta debe ser hoy o futura (zona Venezuela).');
      return;
    }

    if (!this.consultaForm.hora_pautada) {
      this.alertService.showWarning('Hora requerida. Por favor, seleccione una hora para la consulta.');
      return;
    }

    this.isSubmitting = true;

    this.consultaService.updateConsulta(this.consultaId, this.consultaForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertService.show('Los cambios han sido guardados correctamente.', 'success', { navigateTo: '/admin/consultas' });
        } else {
          this.alertService.showError(this.errorHandler.getSafeErrorMessage(response, 'actualizar consulta'));
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'actualizar consulta');
        this.alertService.showError(this.errorHandler.getSafeErrorMessage(error, 'actualizar consulta'));
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    if (this.consultaOriginal) {
      this.consultaForm = { ...this.consultaOriginal };
      this.syncMedicoYEspecialidadDesdeFormulario();
      console.log('🔄 Formulario restaurado a valores originales');
    }
  }

  getPacienteNombre(): string {
    if (this.consultaData) {
      return `${this.consultaData.paciente_nombre || ''} ${this.consultaData.paciente_apellidos || ''}`.trim();
    }
    return 'Paciente no encontrado';
  }

  getPacienteCedula(): string {
    if (this.consultaData) {
      // Primero intentar obtener la cédula de los datos de la consulta
      if (this.consultaData.paciente_cedula) {
        return this.consultaData.paciente_cedula;
      }
      
      // Si no está en los datos de la consulta, buscar en la lista de pacientes
      const paciente = this.pacientes.find(p => p.id === this.consultaData!.paciente_id);
      if (paciente && paciente.cedula) {
        return paciente.cedula;
      }
      
      return 'Sin cédula';
    }
    return '';
  }

  /** Mínimo del input date: “hoy” en Caracas (igual que Nueva Consulta). */
  getTodayDate(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
  }

  volver() {
    this.router.navigate(['/admin/consultas']);
  }
}
