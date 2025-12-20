import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultaService } from '../../services/consulta.service';
import { PatientService } from '../../services/patient.service';
import { MedicoService } from '../../services/medico.service';
import { EspecialidadService } from '../../services/especialidad.service';
import { ConsultaFormData, ConsultaWithDetails } from '../../models/consulta.model';
import { Patient } from '../../models/patient.model';
import { Medico } from '../../services/medico.service';
import { Especialidad } from '../../services/especialidad.service';

@Component({
  selector: 'app-consulta-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="consulta-form-modal" *ngIf="show">
      <div class="modal-overlay" (click)="close()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEdit ? 'Editar Consulta' : 'Nueva Consulta' }}</h2>
          <button class="close-btn" (click)="close()">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <form class="consulta-form" (ngSubmit)="onSubmit()" #consultaForm="ngForm">
          <div class="form-grid">
            <!-- Paciente -->
            <div class="form-group">
              <label for="paciente_id">Paciente *</label>
              <select 
                id="paciente_id" 
                name="paciente_id" 
                [(ngModel)]="consultaData.paciente_id" 
                required 
                class="form-control"
                (change)="onPacienteChange()">
                <option value="">Seleccionar paciente</option>
                <option *ngFor="let paciente of pacientes" [value]="paciente.id">
                  {{ paciente.nombres }} {{ paciente.apellidos }} - {{ paciente.cedula }}
                </option>
              </select>
            </div>

            <!-- Especialidad -->
            <div class="form-group">
              <label for="especialidad_id">Especialidad *</label>
              <select 
                id="especialidad_id" 
                name="especialidad_id" 
                [(ngModel)]="selectedEspecialidadId" 
                (change)="onEspecialidadChange()"
                required 
                class="form-control">
                <option value="">Seleccionar especialidad</option>
                <option *ngFor="let especialidad of especialidades" [value]="especialidad.id">
                  {{ especialidad.nombre_especialidad }}
                </option>
              </select>
            </div>

            <!-- Médico -->
            <div class="form-group">
              <label for="medico_id">Médico *</label>
              <select 
                id="medico_id" 
                name="medico_id" 
                [(ngModel)]="consultaData.medico_id" 
                required 
                class="form-control"
                [disabled]="!selectedEspecialidadId">
                <option value="">Seleccionar médico</option>
                <option *ngFor="let medico of medicosFiltrados" [value]="medico.id">
                  {{ medico.nombres }} {{ medico.apellidos }} - {{ medico.especialidad_nombre || 'Sin especialidad' }}
                </option>
              </select>
            </div>

            <!-- Médico Remitente -->
            <div class="form-group" *ngIf="medicosRemitentes.length > 0">
              <label for="medico_remitente_id">Médico Remitente</label>
              <select 
                id="medico_remitente_id" 
                name="medico_remitente_id" 
                [(ngModel)]="consultaData.medico_remitente_id" 
                class="form-control">
                <option value="">Sin remitente (consulta directa)</option>
                <option *ngFor="let medico of medicosRemitentes" [value]="medico.id">
                  {{ medico.nombres }} {{ medico.apellidos }} - {{ medico.especialidad_nombre || 'Sin especialidad' }}
                </option>
              </select>
            </div>

            <!-- Tipo de Consulta -->
            <div class="form-group">
              <label for="tipo_consulta">Tipo de Consulta *</label>
              <select 
                id="tipo_consulta" 
                name="tipo_consulta" 
                [(ngModel)]="consultaData.tipo_consulta" 
                required 
                class="form-control">
                <option value="primera_vez">Primera Vez</option>
                <option value="control">Control</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="urgencia">Urgencia</option>
              </select>
            </div>

            <!-- Fecha -->
            <div class="form-group">
              <label for="fecha_pautada">Fecha *</label>
              <input 
                type="date" 
                id="fecha_pautada" 
                name="fecha_pautada" 
                [(ngModel)]="consultaData.fecha_pautada" 
                required 
                class="form-control"
                [min]="today">
            </div>

            <!-- Hora -->
            <div class="form-group">
              <label for="hora_pautada">Hora *</label>
              <input 
                type="time" 
                id="hora_pautada" 
                name="hora_pautada" 
                [(ngModel)]="consultaData.hora_pautada" 
                required 
                class="form-control">
            </div>

            <!-- Duración -->
            <div class="form-group">
              <label for="duracion_estimada">Duración (minutos) *</label>
              <input 
                type="number" 
                id="duracion_estimada" 
                name="duracion_estimada" 
                [(ngModel)]="consultaData.duracion_estimada" 
                required 
                min="15" 
                max="120" 
                class="form-control">
            </div>

            <!-- Prioridad -->
            <div class="form-group">
              <label for="prioridad">Prioridad *</label>
              <select 
                id="prioridad" 
                name="prioridad" 
                [(ngModel)]="consultaData.prioridad" 
                required 
                class="form-control">
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <!-- Motivo de Consulta -->
          <div class="form-group full-width">
            <label for="motivo_consulta">Motivo de Consulta *</label>
            <textarea 
              id="motivo_consulta" 
              name="motivo_consulta" 
              [(ngModel)]="consultaData.motivo_consulta" 
              required 
              rows="3" 
              class="form-control"
              placeholder="Describa el motivo de la consulta..."></textarea>
          </div>

          <!-- Diagnóstico Preliminar -->
          <div class="form-group full-width">
            <label for="diagnostico_preliminar">Diagnóstico Preliminar</label>
            <textarea 
              id="diagnostico_preliminar" 
              name="diagnostico_preliminar" 
              [(ngModel)]="consultaData.diagnostico_preliminar" 
              rows="2" 
              class="form-control"
              placeholder="Diagnóstico preliminar (opcional)..."></textarea>
          </div>

          <!-- Observaciones -->
          <div class="form-group full-width">
            <label for="observaciones">Observaciones</label>
            <textarea 
              id="observaciones" 
              name="observaciones" 
              [(ngModel)]="consultaData.observaciones" 
              rows="2" 
              class="form-control"
              placeholder="Observaciones generales (opcional)..."></textarea>
          </div>

          <!-- Notas Internas -->
          <div class="form-group full-width">
            <label for="notas_internas">Notas Internas</label>
            <textarea 
              id="notas_internas" 
              name="notas_internas" 
              [(ngModel)]="consultaData.notas_internas" 
              rows="2" 
              class="form-control"
              placeholder="Notas solo para personal médico (opcional)..."></textarea>
          </div>

          <!-- Recordatorio -->
          <div class="form-row">
            <div class="form-group">
              <label for="fecha_recordatorio">Fecha Recordatorio</label>
              <input 
                type="date" 
                id="fecha_recordatorio" 
                name="fecha_recordatorio" 
                [(ngModel)]="consultaData.fecha_recordatorio" 
                class="form-control"
                [max]="consultaData.fecha_pautada">
            </div>

            <div class="form-group">
              <label for="metodo_recordatorio">Método Recordatorio</label>
              <select 
                id="metodo_recordatorio" 
                name="metodo_recordatorio" 
                [(ngModel)]="consultaData.metodo_recordatorio" 
                class="form-control">
                <option value="">Sin recordatorio</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="llamada">Llamada</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="close()">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              [disabled]="!consultaForm.valid || saving">
              <span *ngIf="saving">Guardando...</span>
              <span *ngIf="!saving">{{ isEdit ? 'Actualizar' : 'Crear' }} Consulta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .consulta-form-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
      position: relative;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      color: #2C2C2C;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.375rem;
      color: #6b7280;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .close-btn svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .consulta-form {
      padding: 2rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .form-control {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #7A9CC6;
      box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1);
    }

    .form-control:invalid {
      border-color: #ef4444;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    @media (max-width: 768px) {
      .modal-content {
        width: 95%;
        margin: 1rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class ConsultaFormComponent implements OnInit, OnChanges {
  @Input() show = false;
  @Input() consulta: ConsultaWithDetails | null = null;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() saveEvent = new EventEmitter<ConsultaFormData>();

  isEdit = false;
  saving = false;
  today = new Date().toISOString().split('T')[0];

  consultaData: ConsultaFormData = {
    paciente_id: 0,
    medico_id: 0,
    motivo_consulta: '',
    tipo_consulta: 'primera_vez',
    fecha_pautada: '',
    hora_pautada: '',
    duracion_estimada: 30,
    prioridad: 'normal'
  };

  pacientes: Patient[] = [];
  medicos: Medico[] = [];
  especialidades: Especialidad[] = [];
  medicosFiltrados: Medico[] = [];
  medicosRemitentes: Medico[] = [];
  selectedEspecialidadId: number | null = null;

  constructor(
    private consultaService: ConsultaService,
    private patientService: PatientService,
    private medicoService: MedicoService,
    private especialidadService: EspecialidadService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnChanges() {
    if (this.consulta) {
      this.isEdit = true;
      this.consultaData = {
        paciente_id: this.consulta.paciente_id,
        medico_id: this.consulta.medico_id,
        medico_remitente_id: this.consulta.medico_remitente_id,
        motivo_consulta: this.consulta.motivo_consulta,
        tipo_consulta: this.consulta.tipo_consulta,
        fecha_pautada: this.consulta.fecha_pautada.split('T')[0],
        hora_pautada: this.consulta.hora_pautada,
        duracion_estimada: this.consulta.duracion_estimada,
        prioridad: this.consulta.prioridad,
        diagnostico_preliminar: this.consulta.diagnostico_preliminar,
        observaciones: this.consulta.observaciones,
        notas_internas: this.consulta.notas_internas,
        fecha_recordatorio: this.consulta.fecha_recordatorio?.split('T')[0],
        metodo_recordatorio: this.consulta.metodo_recordatorio
      };
      
      // Establecer la especialidad del médico seleccionado
      if (this.consulta.medico_especialidad_id) {
        this.selectedEspecialidadId = this.consulta.medico_especialidad_id;
        this.onEspecialidadChange();
      }
      
      // Por ahora, no cargar médicos remitentes
      // TODO: Implementar cuando el endpoint de remisiones esté funcionando
      this.medicosRemitentes = [];
    } else {
      this.isEdit = false;
      this.resetForm();
    }
  }

  loadData() {
    // Cargar pacientes
    this.patientService.getAllPatients().subscribe({
      next: (response) => {
        if (response.success) {
          this.pacientes = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading pacientes:', error);
      }
    });

    // Cargar médicos
    this.medicoService.getAllMedicos().subscribe({
      next: (response) => {
        if (response.success) {
          this.medicos = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading medicos:', error);
      }
    });

    // Cargar especialidades
    this.especialidadService.getAllEspecialidades().subscribe({
      next: (response) => {
        if (response.success) {
          this.especialidades = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading especialidades:', error);
      }
    });
  }

  onPacienteChange() {
    // Por ahora, no cargar médicos remitentes al cambiar paciente
    // TODO: Implementar cuando el endpoint de remisiones esté funcionando
    this.medicosRemitentes = [];
  }

  onEspecialidadChange() {
    console.log('🔍 Especialidad seleccionada:', this.selectedEspecialidadId, 'tipo:', typeof this.selectedEspecialidadId);
    console.log('🔍 Todos los médicos:', this.medicos);
    
    if (this.selectedEspecialidadId) {
      // Convertir a número si viene como string
      const especialidadId = typeof this.selectedEspecialidadId === 'string' 
        ? parseInt(this.selectedEspecialidadId) 
        : this.selectedEspecialidadId;
      
      console.log('🔍 Especialidad ID convertido:', especialidadId);
      
      this.medicosFiltrados = this.medicos.filter(medico => 
        medico.especialidad_id === especialidadId
      );
      
      console.log('🔍 Médicos filtrados:', this.medicosFiltrados);
      
      // Limpiar selección de médico si no está en la lista filtrada
      if (this.consultaData.medico_id && !this.medicosFiltrados.find(m => m.id && m.id === this.consultaData.medico_id)) {
        this.consultaData.medico_id = 0;
      }
    } else {
      this.medicosFiltrados = [];
      this.consultaData.medico_id = 0;
    }
  }

  loadMedicosRemitentes(pacienteId: number) {
    // Por ahora, no cargar médicos remitentes para evitar errores
    // TODO: Implementar correctamente cuando el endpoint de remisiones esté funcionando
    this.medicosRemitentes = [];
  }

  onSubmit() {
    if (this.isEdit && this.consulta) {
      this.saving = true;
      this.consultaService.updateConsulta(this.consulta.id, this.consultaData).subscribe({
        next: (response) => {
          if (response.success) {
            this.saveEvent.emit(this.consultaData);
            this.close();
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Error updating consulta:', error);
          this.saving = false;
        }
      });
    } else {
      this.saving = true;
      this.consultaService.createConsulta(this.consultaData).subscribe({
        next: (response) => {
          if (response.success) {
            this.saveEvent.emit(this.consultaData);
            this.close();
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Error creating consulta:', error);
          this.saving = false;
        }
      });
    }
  }

  close() {
    this.closeEvent.emit();
  }

  resetForm() {
    this.consultaData = {
      paciente_id: 0,
      medico_id: 0,
      motivo_consulta: '',
      tipo_consulta: 'primera_vez',
      fecha_pautada: '',
      hora_pautada: '',
      duracion_estimada: 30,
      prioridad: 'normal'
    };
    this.selectedEspecialidadId = null;
    this.medicosFiltrados = [];
    this.medicosRemitentes = [];
  }
}
