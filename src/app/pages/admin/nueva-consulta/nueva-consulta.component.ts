import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ConsultaService } from '../../../services/consulta.service';
import { PatientService } from '../../../services/patient.service';
import { MedicoService } from '../../../services/medico.service';
import { EspecialidadService, Especialidad } from '../../../services/especialidad.service';
import { AuthService } from '../../../services/auth.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { AlertService } from '../../../services/alert.service';
import { ConsultaFormData } from '../../../models/consulta.model';
import { Patient } from '../../../models/patient.model';
import { Medico } from '../../../services/medico.service';
import { ClinicaAtencionService, ClinicaAtencion } from '../../../services/clinica-atencion.service';

@Component({
  selector: 'app-nueva-consulta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="nueva-consulta-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>
            <i class="fas fa-calendar-plus"></i>
            Nueva Consulta
          </h1>
          <p class="page-description">
            Crear una nueva consulta médica
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="volver()">
            ← Volver a Gestión de Consultas
          </button>
        </div>
      </div>

      <!-- Formulario -->
      <div class="form-container">
        <form (ngSubmit)="createConsulta()" #consultaFormRef="ngForm">
          <div class="form-section">
            <h2>Información de la Consulta</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="paciente_id">Paciente *</label>
                <div *ngIf="consultaForm.paciente_id > 0" class="preselected-patient">
                  <div class="preselected-info">
                    <span class="preselected-label">✅ Paciente preseleccionado:</span>
                    <span class="preselected-name">{{ getPreselectedPatientName() }}</span>
                  </div>
                </div>
                <select 
                  id="paciente_id" 
                  class="form-control" 
                  [(ngModel)]="consultaForm.paciente_id" 
                  name="paciente_id"
                  (ngModelChange)="onPacienteChange($event)"
                  required>
                  <option value="0">Seleccionar paciente</option>
                  <option *ngFor="let paciente of pacientes" [value]="paciente.id">
                    {{paciente.nombres}} {{paciente.apellidos}} - {{paciente.cedula}}
                  </option>
                </select>
              </div>
              
              <!-- Selector de especialidad y médico para administradores y secretarias -->
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
                    <option value="0">Seleccionar especialidad</option>
                    <option *ngFor="let especialidad of especialidades" [value]="especialidad.id">
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
                    <option value="0">
                      {{ selectedEspecialidadId && selectedEspecialidadId !== 0 ? 'Seleccionar médico' : 'Primero seleccione una especialidad' }}
                    </option>
                    <option *ngFor="let medico of medicosFiltrados" [value]="medico.id">
                      {{ medico.sexo === 'Femenino' ? 'Dra.' : 'Dr.' }} {{medico.nombres}} {{medico.apellidos}}
                    </option>
                  </select>
                </div>
              </div>
              
              <!-- Mostrar información del médico cuando es usuario médico -->
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
              <span class="btn-icon">🧹</span>
              <span class="btn-text">Limpiar</span>
            </button>
            <button 
              type="submit" 
              class="btn btn-new" 
              [disabled]="isSubmitting">
              <span *ngIf="isSubmitting" class="btn-icon">⏳</span>
              <span *ngIf="!isSubmitting" class="btn-icon">💾</span>
              <span class="btn-text">{{isSubmitting ? 'Creando...' : 'Crear Consulta'}}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .nueva-consulta-page {
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

    .form-container {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 2rem;
    }

    /* Estilos para paciente preseleccionado */
    .preselected-patient {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #0ea5e9;
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .preselected-info {
      display: flex;
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

    .btn-primary {
      background: #f5576c;
      color: white;
      box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
      font-weight: 500;
    }

    .btn-primary:hover:not(:disabled) {
      background: #C2185B;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(233, 30, 99, 0.4);
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
export class NuevaConsultaComponent implements OnInit {
  consultaForm: ConsultaFormData = {
    paciente_id: 0,
    medico_id: 0,
    motivo_consulta: '',
    tipo_consulta: 'primera_vez',
    fecha_pautada: '',
    hora_pautada: '',
    observaciones: '',
    duracion_estimada: 30,
    prioridad: 'normal'
  };
  
  pacientes: Patient[] = [];
  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = [];
  especialidades: Especialidad[] = [];
  clinicasAtencion: ClinicaAtencion[] = [];
  selectedEspecialidadId: number = 0;
  isSubmitting = false;
  currentUser: any = null;
  pendingMedicoId: number | null = null; // Para médico preseleccionado desde queryParams

  /** True si el paciente seleccionado no tiene consultas previas: tipo queda "Primera Vez" y el dropdown se deshabilita. */
  get esPrimeraConsultaPaciente(): boolean {
    const id = Number(this.consultaForm.paciente_id);
    if (!id) return false;
    const paciente = this.pacientes.find(p => Number(p.id) === id);
    return !!paciente && !paciente.tiene_consulta;
  }

  /** True si el paciente seleccionado ya tiene consultas: la opción "Primera Vez" no se muestra. */
  get pacienteYaTieneConsultas(): boolean {
    const id = Number(this.consultaForm.paciente_id);
    if (!id) return false;
    const paciente = this.pacientes.find(p => Number(p.id) === id);
    return !!paciente && !!paciente.tiene_consulta;
  }

  constructor(
    private consultaService: ConsultaService,
    private clinicaAtencionService: ClinicaAtencionService,
    private patientService: PatientService,
    private medicoService: MedicoService,
    private especialidadService: EspecialidadService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Verificar si hay un paciente preseleccionado
    this.route.queryParams.subscribe(params => {
      if (params['paciente_id']) {
        this.consultaForm.paciente_id = parseInt(params['paciente_id']);
        console.log('👤 Paciente preseleccionado:', this.consultaForm.paciente_id, 'tipo:', typeof this.consultaForm.paciente_id);
      }
      
      // Si hay medico_id en queryParams (para admin/secretaria), guardarlo para después de cargar médicos
      if (params['medico_id']) {
        const medicoIdParam = parseInt(params['medico_id']);
        console.log('👨‍⚕️ Médico preseleccionado desde queryParams:', medicoIdParam);
        // Guardar temporalmente para aplicar después de cargar médicos
        this.pendingMedicoId = medicoIdParam;
      }
    });

    // Cargar usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('👤 Usuario actual:', this.currentUser);
      
      // Si es médico, asignar automáticamente su ID
      if (this.currentUser?.rol === 'medico') {
        this.consultaForm.medico_id = this.currentUser.medico_id;
        console.log('👨‍⚕️ Médico asignado automáticamente:', this.consultaForm.medico_id);
      } else if (this.pendingMedicoId) {
        // Si no es médico pero hay medico_id en queryParams, aplicarlo después de cargar médicos
        this.consultaForm.medico_id = this.pendingMedicoId;
        console.log('👨‍⚕️ Médico preseleccionado aplicado:', this.pendingMedicoId);
      }
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

  loadPacientes(): void {
    this.patientService.getPatientsByMedicoForStats(null).subscribe({
      next: (pacientes: Patient[]) => {
        this.pacientes = pacientes || [];
        console.log('📋 Pacientes cargados:', this.pacientes.length);
        console.log('🔍 IDs de pacientes cargados:', this.pacientes.map(p => ({ id: p.id, tipo: typeof p.id, nombre: `${p.nombres} ${p.apellidos}` })));
        
        // Verificar si hay un paciente preseleccionado después de cargar
        if (this.consultaForm.paciente_id && this.consultaForm.paciente_id !== 0) {
          console.log('🔍 Verificando paciente preseleccionado después de cargar pacientes...');
          this.getPreselectedPatientName();
          this.onPacienteChange(this.consultaForm.paciente_id);
        }
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
        
        // Si hay un médico preseleccionado, encontrar su especialidad y aplicarlo
        if (this.pendingMedicoId) {
          const medicoPreseleccionado = this.medicos.find(m => m.id === this.pendingMedicoId);
          if (medicoPreseleccionado && medicoPreseleccionado.especialidad_id) {
            this.selectedEspecialidadId = medicoPreseleccionado.especialidad_id;
            this.onEspecialidadChange();
            this.consultaForm.medico_id = this.pendingMedicoId;
            console.log('👨‍⚕️ Médico y especialidad preseleccionados:', {
              medico_id: this.pendingMedicoId,
              especialidad_id: this.selectedEspecialidadId
            });
          }
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar médicos');
      }
    });
  }

  loadEspecialidades(): void {
    this.especialidadService.getAllEspecialidades().subscribe({
      next: (response) => {
        this.especialidades = response.data || [];
        console.log('🏥 Especialidades cargadas:', this.especialidades.length);
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar especialidades');
      }
    });
  }

  onEspecialidadChange(): void {
    console.log('🔄 Especialidad seleccionada:', this.selectedEspecialidadId, 'tipo:', typeof this.selectedEspecialidadId);
    console.log('👨‍⚕️ Médicos disponibles:', this.medicos.length);
    console.log('🔍 Primeros 3 médicos:', this.medicos.slice(0, 3).map(m => ({ id: m.id, especialidad_id: m.especialidad_id, tipo: typeof m.especialidad_id })));
    
    // Limpiar selección de médico
    this.consultaForm.medico_id = 0;
    
    if (this.selectedEspecialidadId && this.selectedEspecialidadId !== 0) {
      // Convertir a number para la comparación
      const especialidadId = Number(this.selectedEspecialidadId);
      console.log('🔢 Especialidad ID convertido a number:', especialidadId);
      
      // Filtrar médicos por especialidad
      this.medicosFiltrados = this.medicos.filter(medico => {
        // Convertir ambos a number para la comparación
        const medicoEspecialidadId = Number(medico.especialidad_id);
        const especialidadIdNumber = Number(especialidadId);
        const match = medicoEspecialidadId === especialidadIdNumber;
        console.log(`🔍 Médico ${medico.nombres} ${medico.apellidos}: especialidad_id=${medico.especialidad_id} (${typeof medico.especialidad_id}) === ${especialidadId} (${typeof especialidadId}) = ${match}`);
        return match;
      });
      console.log('👨‍⚕️ Médicos filtrados por especialidad:', this.medicosFiltrados.length);
    } else {
      this.medicosFiltrados = [];
    }
  }

  currentUserMedicoTitulo(): string {
    if (!this.currentUser?.medico_id) return 'Dr.';
    const medico = this.medicos.find(m => m.id === this.currentUser!.medico_id);
    return medico?.sexo === 'Femenino' ? 'Dra.' : 'Dr.';
  }

  onPacienteChange(pacienteId: number | string): void {
    const id = typeof pacienteId === 'string' ? parseInt(pacienteId, 10) : pacienteId;
    if (!id) return;
    const paciente = this.pacientes.find(p => Number(p.id) === id);
    if (paciente && !paciente.tiene_consulta) {
      this.consultaForm.tipo_consulta = 'primera_vez';
    } else if (paciente && paciente.tiene_consulta && this.consultaForm.tipo_consulta === 'primera_vez') {
      this.consultaForm.tipo_consulta = 'control';
    }
  }

  getPreselectedPatientName(): string {
    console.log('🔍 Buscando paciente preseleccionado:');
    console.log('  - ID buscado:', this.consultaForm.paciente_id, 'tipo:', typeof this.consultaForm.paciente_id);
    console.log('  - Pacientes disponibles:', this.pacientes.length);
    console.log('  - IDs de pacientes:', this.pacientes.map(p => ({ id: p.id, tipo: typeof p.id, nombre: `${p.nombres} ${p.apellidos}` })));
    
    const paciente = this.pacientes.find(p => {
      // Convertir ambos a number para la comparación
      const pacienteId = Number(p.id);
      const consultaPacienteId = Number(this.consultaForm.paciente_id);
      const match = pacienteId === consultaPacienteId;
      console.log(`  - Comparando: ${p.id} (${typeof p.id}) === ${this.consultaForm.paciente_id} (${typeof this.consultaForm.paciente_id}) = ${match}`);
      return match;
    });
    
    if (paciente) {
      console.log('✅ Paciente encontrado:', paciente);
      return `${paciente.nombres} ${paciente.apellidos} - ${paciente.cedula}`;
    } else {
      console.log('❌ Paciente no encontrado');
      return 'Paciente no encontrado';
    }
  }

  createConsulta(): void {
    if (this.isSubmitting) return;

    // Validaciones básicas
    if (!this.consultaForm.paciente_id || this.consultaForm.paciente_id === 0) {
      this.alertService.showWarning('Paciente requerido. Por favor, seleccione un paciente de la lista antes de continuar.');
      return;
    }
    // Validar selección de especialidad y médico si es administrador o secretaria
    if ((this.currentUser?.rol === 'administrador' || this.currentUser?.rol === 'secretaria')) {
      if (!this.selectedEspecialidadId || this.selectedEspecialidadId === 0) {
        this.alertService.showWarning('Especialidad requerida. Por favor, seleccione una especialidad antes de continuar.');
        return;
      }
      if (!this.consultaForm.medico_id || this.consultaForm.medico_id === 0) {
        this.alertService.showWarning('Médico requerido. Por favor, seleccione un médico de la lista antes de continuar.');
        return;
      }
    }
    if (!this.consultaForm.motivo_consulta.trim()) {
      this.alertService.showWarning('Motivo de consulta requerido. Por favor, ingrese el motivo de la consulta para continuar.');
      return;
    }
    if (!this.consultaForm.fecha_pautada) {
      this.alertService.showWarning('Fecha requerida. Por favor, seleccione una fecha para la consulta.');
      return;
    }
    
    // Validar que la fecha sea futura según zona horaria de Venezuela (America/Caracas)
    const fechaConsulta = new Date(this.consultaForm.fecha_pautada + 'T12:00:00.000Z');
    if (isNaN(fechaConsulta.getTime())) {
      this.alertService.showWarning('Fecha inválida. Por favor, seleccione una fecha válida.');
      return;
    }
    const hoyVenezuela = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' }); // YYYY-MM-DD
    const fechaPautada = String(this.consultaForm.fecha_pautada ?? '').slice(0, 10);
    if (fechaPautada < hoyVenezuela) {
      this.alertService.showWarning('Fecha inválida. La fecha de la consulta debe ser futura (posterior a hoy).');
      return;
    }
    
    if (!this.consultaForm.hora_pautada) {
      this.alertService.showWarning('Hora requerida. Por favor, seleccione una hora para la consulta.');
      return;
    }

    this.isSubmitting = true;

    this.consultaService.createConsulta(this.consultaForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertService.show('La consulta ha sido programada y se ha enviado una notificación al paciente.', 'success', { navigateTo: '/admin/consultas' });
          this.resetForm();
        } else {
          this.alertService.showError((response as any).error?.message || 'Error al crear la consulta. Por favor, intente nuevamente o contacte al administrador.');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'crear consulta');
        this.alertService.showError(this.errorHandler.getSafeErrorMessage(error, 'crear consulta'));
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    // Resetear formulario a valores iniciales
    this.consultaForm = {
      paciente_id: 0,
      medico_id: this.currentUser?.rol === 'medico' ? this.currentUser.medico_id : 0,
      clinica_atencion_id: null,
      motivo_consulta: '',
      tipo_consulta: 'primera_vez',
      fecha_pautada: '',
      hora_pautada: '',
      observaciones: '',
      duracion_estimada: 30,
      prioridad: 'normal'
    };
    
    // Resetear especialidad para administradores y secretarias
    if (this.currentUser?.rol === 'administrador' || this.currentUser?.rol === 'secretaria') {
      this.selectedEspecialidadId = 0;
      this.medicosFiltrados = [];
    }
    
    // Resetear estado de envío
    this.isSubmitting = false;
    
    console.log('🧹 Formulario limpiado completamente');
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  volver() {
    this.router.navigate(['/admin/consultas']);
  }

}
