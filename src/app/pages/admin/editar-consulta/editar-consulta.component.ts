import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ConsultaService } from '../../../services/consulta.service';
import { PatientService } from '../../../services/patient.service';
import { MedicoService } from '../../../services/medico.service';
import { AuthService } from '../../../services/auth.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { ConsultaFormData, ConsultaWithDetails } from '../../../models/consulta.model';
import { Patient } from '../../../models/patient.model';
import { Medico } from '../../../services/medico.service';

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

      <!-- Formulario -->
      <div *ngIf="!loading && !error" class="form-container">
        <form (ngSubmit)="updateConsulta()" #consultaFormRef="ngForm">
          <div class="form-section">
            <h2>Información de la Consulta</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label>Paciente</label>
                <div class="paciente-info">
                  <span class="paciente-nombre">{{ getPacienteNombre() }}</span>
                  <span class="paciente-cedula">{{ getPacienteCedula() }}</span>
                </div>
              </div>
              
              <div class="form-group" *ngIf="currentUser?.rol === 'administrador'">
                <label for="medico_id">Médico *</label>
                <select 
                  id="medico_id" 
                  class="form-control" 
                  [(ngModel)]="consultaForm.medico_id" 
                  name="medico_id"
                  required>
                  <option value="0">Seleccionar médico</option>
                  <option *ngFor="let medico of medicos" [value]="medico.id">
                    Dr./Dra. {{medico.nombres}} {{medico.apellidos}} - {{medico.especialidad_nombre}}
                  </option>
                </select>
              </div>
              
              <!-- Mostrar información del médico cuando es usuario médico -->
              <div class="form-group" *ngIf="currentUser?.rol === 'medico'">
                <label>Médico asignado</label>
                <div class="medico-info">
                  <span class="medico-nombre">Dr./Dra. {{getMedicoNombre()}}</span>
                  <span class="medico-especialidad">{{getMedicoEspecialidad()}}</span>
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
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="tipo_consulta">Tipo de Consulta</label>
                <select 
                  id="tipo_consulta" 
                  class="form-control" 
                  [(ngModel)]="consultaForm.tipo_consulta" 
                  name="tipo_consulta">
                  <option value="primera_vez">Primera Vez</option>
                  <option value="control">Control</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="urgencia">Urgencia</option>
                </select>
              </div>

              <div class="form-group">
                <label for="prioridad">Prioridad</label>
                <select 
                  id="prioridad" 
                  class="form-control" 
                  [(ngModel)]="consultaForm.prioridad" 
                  name="prioridad">
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
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

            <div class="form-group">
              <label for="diagnostico_preliminar">Diagnóstico Preliminar</label>
              <textarea 
                id="diagnostico_preliminar" 
                class="form-control" 
                [(ngModel)]="consultaForm.diagnostico_preliminar" 
                name="diagnostico_preliminar"
                rows="3"
                placeholder="Diagnóstico preliminar (opcional)"></textarea>
            </div>

            <div class="form-group">
              <label for="notas_internas">Notas Internas</label>
              <textarea 
                id="notas_internas" 
                class="form-control" 
                [(ngModel)]="consultaForm.notas_internas" 
                name="notas_internas"
                rows="3"
                placeholder="Notas internas para el personal médico (opcional)"></textarea>
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
      color: var(--color-primary, #7A9CC6);
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
      color: var(--color-primary, #7A9CC6);
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
      border-bottom: 2px solid #007bff;
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
      border-color: #007bff;
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
      border: 1px solid #7A9CC6;
      font-weight: 500;
    }

    .btn-secondary:hover {
      background: #7A9CC6;
      color: white;
      border-color: #7A9CC6;
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
  isSubmitting = false;
  loading = true;
  error: string | null = null;
  currentUser: any = null;
  consultaId: number = 0;

  constructor(
    private consultaService: ConsultaService,
    private patientService: PatientService,
    private medicoService: MedicoService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

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
          
          // Mapear datos de la consulta al formulario
          this.consultaForm = {
            paciente_id: consulta.paciente_id,
            medico_id: consulta.medico_id,
            motivo_consulta: consulta.motivo_consulta || '',
            tipo_consulta: consulta.tipo_consulta,
            fecha_pautada: consulta.fecha_pautada,
            hora_pautada: consulta.hora_pautada,
            observaciones: consulta.observaciones || '',
            duracion_estimada: consulta.duracion_estimada || 30,
            prioridad: consulta.prioridad,
            diagnostico_preliminar: consulta.diagnostico_preliminar || '',
            notas_internas: consulta.notas_internas || ''
          };

          // Guardar copia original para restaurar
          this.consultaOriginal = { ...this.consultaForm };

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
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar médicos');
      }
    });
  }

  updateConsulta(): void {
    if (this.isSubmitting) return;

    // Validaciones básicas
    if (!this.consultaForm.paciente_id || this.consultaForm.paciente_id === 0) {
      alert('⚠️ Paciente requerido\n\nPor favor, seleccione un paciente de la lista antes de continuar.');
      return;
    }
    
    // Solo validar selección de médico si es administrador
    if (this.currentUser?.rol === 'administrador' && (!this.consultaForm.medico_id || this.consultaForm.medico_id === 0)) {
      alert('⚠️ Médico requerido\n\nPor favor, seleccione un médico de la lista antes de continuar.');
      return;
    }
    
    if (!this.consultaForm.motivo_consulta.trim()) {
      alert('⚠️ Motivo de consulta requerido\n\nPor favor, ingrese el motivo de la consulta para continuar.');
      return;
    }
    
    if (!this.consultaForm.fecha_pautada) {
      alert('⚠️ Fecha requerida\n\nPor favor, seleccione una fecha para la consulta.');
      return;
    }
    
    if (!this.consultaForm.hora_pautada) {
      alert('⚠️ Hora requerida\n\nPor favor, seleccione una hora para la consulta.');
      return;
    }

    this.isSubmitting = true;

    this.consultaService.updateConsulta(this.consultaId, this.consultaForm).subscribe({
      next: (response) => {
        if (response.success) {
          alert('✅ Consulta actualizada exitosamente\n\nLos cambios han sido guardados correctamente.');
          this.router.navigate(['/admin/consultas']);
        } else {
          const errorMessage = this.errorHandler.getSafeErrorMessage(response, 'actualizar consulta');
          alert(errorMessage);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'actualizar consulta');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'actualizar consulta');
        alert(errorMessage);
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    if (this.consultaOriginal) {
      this.consultaForm = { ...this.consultaOriginal };
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

  getMedicoNombre(): string {
    if (this.consultaData) {
      return `${this.consultaData.medico_nombre || ''} ${this.consultaData.medico_apellidos || ''}`.trim();
    }
    return 'Médico no encontrado';
  }

  getMedicoEspecialidad(): string {
    if (this.consultaData) {
      return this.consultaData.especialidad_nombre || 'Sin especialidad';
    }
    return '';
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  volver() {
    this.router.navigate(['/admin/consultas']);
  }
}
