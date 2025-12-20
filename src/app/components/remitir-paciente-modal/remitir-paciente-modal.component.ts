import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RemisionService } from '../../services/remision.service';
import { AuthService } from '../../services/auth.service';
import { EspecialidadService, Especialidad } from '../../services/especialidad.service';
import { MedicoService, Medico } from '../../services/medico.service';
import { SnackbarService } from '../../services/snackbar.service';
import { CrearRemisionRequest } from '../../models/remision.model';
import { Patient } from '../../models/patient.model';
import { User } from '../../models/user.model';


@Component({
  selector: 'app-remitir-paciente-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Remitir Paciente</h2>
          <button class="close-btn" (click)="closeModal()">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="patient-info">
            <h3>Paciente a Remitir</h3>
            <div class="patient-card">
              <div class="patient-avatar">
                {{ getInitials(patient?.nombres || '', patient?.apellidos || '') }}
              </div>
              <div class="patient-details">
                <h4>{{ patient?.nombres }} {{ patient?.apellidos }}</h4>
                <p>{{ patient?.edad }} años • {{ patient?.sexo }}</p>
                <p *ngIf="patient?.cedula" class="cedula">{{ patient!.cedula }}</p>
              </div>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()" #remisionForm="ngForm">
            <div class="form-group">
              <label class="form-label">Médico Remitente *</label>
              <select 
                class="form-input" 
                [(ngModel)]="remisionData.medico_remitente_id" 
                name="medico_remitente_id"
                [disabled]="isMedicoUser"
                required>
                <option value="">Seleccionar médico remitente</option>
                <option *ngFor="let medico of medicos" [value]="medico.id">
                  {{ medico.nombres }} {{ medico.apellidos }} - {{ medico.especialidad_nombre || 'Sin especialidad' }}
                </option>
              </select>
              <small *ngIf="isMedicoUser" class="form-help">
                Usted es el médico remitente
              </small>
            </div>

            <div class="form-group">
              <label class="form-label">Especialidad de Destino *</label>
              <select 
                class="form-input" 
                [(ngModel)]="selectedEspecialidad" 
                name="especialidad"
                (change)="onEspecialidadChange()"
                required>
                <option value="">Seleccionar especialidad</option>
                <option *ngFor="let especialidad of especialidades" [value]="especialidad.id">
                  {{ especialidad.nombre_especialidad }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Médico a Remitir *</label>
              <select 
                class="form-input" 
                [(ngModel)]="remisionData.medico_remitido_id" 
                name="medico_remitido_id"
                [disabled]="!selectedEspecialidad"
                (change)="onMedicoRemitidoChange()"
                required>
                <option value="">Seleccionar médico de destino</option>
                <option *ngFor="let medico of medicosPorEspecialidad" [value]="medico.id">
                  {{ medico.nombres }} {{ medico.apellidos }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Motivo de Remisión *</label>
              <textarea 
                class="form-input" 
                [(ngModel)]="remisionData.motivo_remision" 
                name="motivo_remision"
                rows="4"
                placeholder="Describa el motivo de la remisión..."
                required></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Observaciones</label>
              <textarea 
                class="form-input" 
                [(ngModel)]="remisionData.observaciones" 
                name="observaciones"
                rows="3"
                placeholder="Observaciones adicionales (opcional)"></textarea>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            (click)="onSubmit()"
            [disabled]="!remisionForm.form.valid || loading">
            <span *ngIf="loading" class="spinner"></span>
            {{ loading ? 'Remitiendo...' : 'Remitir Paciente' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      width: 100%;
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
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.375rem;
      color: #6b7280;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .close-btn svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .modal-body {
      padding: 2rem;
    }

    .patient-info {
      margin-bottom: 2rem;
    }

    .patient-info h3 {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
    }

    .patient-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .patient-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.125rem;
    }

    .patient-details h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .patient-details p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .cedula {
      font-family: 'Courier New', monospace;
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      display: inline-block;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background: white;
    }

    .form-input:focus {
      outline: none;
      border-color: #7A9CC6;
      box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1);
    }

    .form-input:disabled {
      background: #f9fafb;
      color: #6b7280;
      cursor: not-allowed;
    }

    .form-help {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: #6b7280;
      font-style: italic;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
      background: #f8fafc;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-primary {
      background: #7A9CC6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #C2185B;
      transform: translateY(-1px);
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .modal-content {
        margin: 1rem;
        max-height: calc(100vh - 2rem);
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: 1rem;
      }

      .patient-card {
        flex-direction: column;
        text-align: center;
      }

      .modal-footer {
        flex-direction: column;
      }
    }
  `]
})
export class RemitirPacienteModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() patient: Patient | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() remisionCreated = new EventEmitter<any>();

  medicos: Medico[] = [];
  especialidades: Especialidad[] = [];
  medicosPorEspecialidad: Medico[] = [];
  selectedEspecialidad: number | string | null = null;
  loading = false;
  currentUser: User | null = null;
  isMedicoUser = false;

  remisionData: CrearRemisionRequest = {
    paciente_id: 0,
    medico_remitente_id: 0,
    medico_remitido_id: 0,
    motivo_remision: '',
    observaciones: ''
  };

  constructor(
    private remisionService: RemisionService,
    private authService: AuthService,
    private especialidadService: EspecialidadService,
    private medicoService: MedicoService,
    private snackbarService: SnackbarService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    console.log('🔄 ngOnChanges triggered:', changes);
    if (changes['patient'] && changes['patient'].currentValue) {
      console.log('🔍 Patient data received in ngOnChanges:', changes['patient'].currentValue);
      this.remisionData.paciente_id = changes['patient'].currentValue.id;
      console.log('✅ Paciente ID asignado en ngOnChanges:', changes['patient'].currentValue.id);
    }
  }

  ngOnInit() {
    console.log('🔍 Patient data received in ngOnInit:', this.patient);
    if (this.patient) {
      this.remisionData.paciente_id = this.patient.id;
      console.log('✅ Paciente ID asignado en ngOnInit:', this.patient.id);
    } else {
      console.log('⚠️ No se recibió información del paciente en ngOnInit');
    }
    
    // Obtener el usuario actual
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      this.isMedicoUser = user?.rol === 'medico';
      
      console.log('🔍 Usuario actual completo:', user);
      console.log('🔍 Rol del usuario:', user?.rol);
      console.log('🔍 Medico ID del usuario:', user?.medico_id);
      console.log('🔍 Es médico?', this.isMedicoUser);
      
      // Si es médico, establecer automáticamente el médico remitente
      if (this.isMedicoUser && user?.medico_id) {
        this.remisionData.medico_remitente_id = user.medico_id;
        console.log('👨‍⚕️ Médico remitente asignado:', user.medico_id, 'Usuario:', user);
      } else if (user?.rol === 'administrador' && user?.medico_id) {
        // Los administradores también pueden tener medico_id
        this.remisionData.medico_remitente_id = user.medico_id;
        console.log('👑 Administrador con medico_id asignado:', user.medico_id, 'Usuario:', user);
      } else {
        console.log('⚠️ Usuario no es médico/administrador o no tiene medico_id:', {
          isMedicoUser: this.isMedicoUser,
          medico_id: user?.medico_id,
          rol: user?.rol,
          user: user
        });
      }
    });
    
    this.loadMedicos();
    this.loadEspecialidades();
  }

  loadMedicos() {
    console.log('🔍 Loading medicos from service...');
    this.medicoService.getAllMedicos().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.medicos = response.data;
          console.log('✅ Médicos cargados:', this.medicos);
          console.log('🔍 IDs de médicos disponibles:', this.medicos.map(m => ({ id: m.id, nombres: m.nombres, apellidos: m.apellidos })));
        } else {
          console.error('❌ Error loading medicos:', (response as any).error);
        }
      },
      error: (error) => {
        console.error('❌ Error loading medicos:', error);
      }
    });
  }

  loadEspecialidades() {
    console.log('🔍 Loading especialidades from service...');
    this.especialidadService.getAllEspecialidades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.especialidades = response.data;
          console.log('✅ Especialidades cargadas:', this.especialidades);
        } else {
          console.error('❌ Error loading especialidades:', (response as any).error);
        }
      },
      error: (error) => {
        console.error('❌ Error loading especialidades:', error);
      }
    });
  }

  onEspecialidadChange() {
    console.log('🔍 Especialidad seleccionada:', this.selectedEspecialidad, 'tipo:', typeof this.selectedEspecialidad);
    
    if (this.selectedEspecialidad) {
      // Convertir a número si viene como string
      const especialidadId = typeof this.selectedEspecialidad === 'string' 
        ? parseInt(this.selectedEspecialidad) 
        : this.selectedEspecialidad;
      
      console.log('🔍 Filtrando médicos por especialidad_id:', especialidadId);
      console.log('🔍 Todos los médicos:', this.medicos);
      
      // Filtrar médicos por especialidad_id
      this.medicosPorEspecialidad = this.medicos.filter(m => m.especialidad_id === especialidadId);
      console.log('🔍 Médicos filtrados:', this.medicosPorEspecialidad);
      
      // Reset médico remitido cuando cambia la especialidad
      this.remisionData.medico_remitido_id = 0;
    } else {
      this.medicosPorEspecialidad = [];
    }
    this.remisionData.medico_remitido_id = 0;
  }

  onMedicoRemitidoChange() {
    console.log('👨‍⚕️ Médico remitido seleccionado:', this.remisionData.medico_remitido_id);
    console.log('👨‍⚕️ Médico remitente actual:', this.remisionData.medico_remitente_id);
  }

  onSubmit() {
    if (this.remisionData.medico_remitente_id && 
        this.remisionData.medico_remitido_id && 
        this.remisionData.motivo_remision.trim()) {
      
      this.loading = true;
      
      // Debug: Log the data being sent
      console.log('🔍 Remision data being sent:', this.remisionData);
      console.log('🔍 Patient object:', this.patient);
      console.log('🔍 Data types:', {
        paciente_id: typeof this.remisionData.paciente_id,
        medico_remitente_id: typeof this.remisionData.medico_remitente_id,
        medico_remitido_id: typeof this.remisionData.medico_remitido_id,
        motivo_remision: typeof this.remisionData.motivo_remision
      });
      
      // Verificar que el paciente_id esté asignado
      if (!this.remisionData.paciente_id || this.remisionData.paciente_id === 0) {
        console.error('❌ ERROR: paciente_id no está asignado!');
        console.error('❌ Patient object:', this.patient);
        console.error('❌ RemisionData:', this.remisionData);
        alert('❌ Error: Paciente no válido\n\nNo se ha seleccionado un paciente válido. Por favor, regrese a la lista de pacientes y seleccione uno correctamente.');
        this.loading = false;
        return;
      }
      
      // Ensure IDs are numbers
      const remisionDataToSend = {
        ...this.remisionData,
        paciente_id: Number(this.remisionData.paciente_id),
        medico_remitente_id: Number(this.remisionData.medico_remitente_id),
        medico_remitido_id: Number(this.remisionData.medico_remitido_id)
      };
      
      console.log('🔍 Processed data:', remisionDataToSend);
      
      this.remisionService.crearRemision(remisionDataToSend).subscribe({
        next: (response: any) => {
          if (response.success) {
            alert('✅ Remisión creada exitosamente\n\nLa remisión ha sido procesada y se ha enviado una notificación al médico de destino. El paciente será contactado para coordinar la cita.');
            this.remisionCreated.emit(response.data);
            this.clearForm();
            this.closeModal();
          } else {
            alert('❌ Error al crear la remisión\n\nNo se pudo procesar la remisión. Por favor, verifique los datos e intente nuevamente.');
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error creating remision:', error);
          alert('❌ Error al crear la remisión\n\nError de conexión. Por favor, verifique su internet e intente nuevamente.');
          this.loading = false;
        }
      });
    }
  }

  closeModal() {
    this.isOpen = false;
    this.clearForm();
    this.close.emit();
  }

  clearForm() {
    // Limpiar datos del formulario
    this.remisionData = {
      paciente_id: this.patient?.id || 0,
      medico_remitente_id: this.currentUser?.medico_id || 0,
      medico_remitido_id: 0,
      motivo_remision: '',
      observaciones: ''
    };
    
    // Limpiar selecciones
    this.selectedEspecialidad = null;
    this.medicosPorEspecialidad = [];
    
    // Limpiar estado de carga
    this.loading = false;
    
    console.log('🧹 Formulario limpiado');
  }

  getInitials(nombres: string, apellidos: string): string {
    const firstInitial = nombres.charAt(0).toUpperCase();
    const lastInitial = apellidos.charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  }
}
