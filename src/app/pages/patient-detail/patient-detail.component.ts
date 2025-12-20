import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { HistoricoService, HistoricoWithDetails } from '../../services/historico.service';
import { ArchivoService } from '../../services/archivo.service';
import { Patient } from '../../models/patient.model';
import { ArchivoAnexo } from '../../models/archivo.model';
import { RemitirPacienteModalComponent } from '../../components/remitir-paciente-modal/remitir-paciente-modal.component';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, RemitirPacienteModalComponent],
  template: `
    <div class="patient-detail-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Detalles del Paciente</h1>
          <div class="header-actions">
            <a routerLink="/patients" class="btn btn-secondary">
              ← Volver a Pacientes
            </a>
            <a [routerLink]="['/patients', patient?.id, 'edit']" class="btn btn-primary">
              ✏️ Editar Paciente
            </a>
          </div>
        </div>
      </div>

      <div class="patient-detail" *ngIf="patient && !loading">
        <div class="patient-header">
          <div class="patient-avatar">
            <div class="avatar-circle">
              {{ getInitials(patient.nombres, patient.apellidos) }}
            </div>
          </div>
          <div class="patient-info">
            <h2>{{ patient.nombres }} {{ patient.apellidos }}</h2>
            <p class="patient-meta">
              {{ patient.edad }} años • {{ patient.sexo }}
            </p>
            <p class="patient-contact">
              📧 {{ patient.email }} • 📞 {{ patient.telefono }}
            </p>
          </div>
        </div>

        <div class="patient-sections">
          <div class="section">
            <h3>Información Personal</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Nombres</label>
                <span>{{ patient.nombres }}</span>
              </div>
              <div class="info-item">
                <label>Apellidos</label>
                <span>{{ patient.apellidos }}</span>
              </div>
              <div class="info-item">
                <label>Edad</label>
                <span>{{ patient.edad }} años</span>
              </div>
              <div class="info-item">
                <label>Sexo</label>
                <span class="sex-badge" [class.female]="patient.sexo === 'Femenino'">
                  {{ patient.sexo }}
                </span>
              </div>
              <div class="info-item">
                <label>Email</label>
                <span>{{ patient.email }}</span>
              </div>
              <div class="info-item">
                <label>Teléfono</label>
                <span>{{ patient.telefono }}</span>
              </div>
              <div class="info-item" *ngIf="getLastMedicoTratante()">
                <label>Médico Tratante</label>
                <span class="medico-info">
                  👨‍⚕️ {{ getLastMedicoTratante() }}
                </span>
              </div>
              <div class="info-item" *ngIf="patient.cedula">
                <label>Cédula</label>
                <span class="cedula-badge">{{ patient.cedula }}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>
              Información Médica
              <span class="history-count" *ngIf="historicos.length > 1">
                ({{ historicos.length }} historias)
              </span>
            </h3>
            
            <!-- Selector de Historias Clínicas -->
            <div class="history-selector" *ngIf="historicos.length > 1">
              <label for="historico-select">Seleccionar Historia Clínica:</label>
              <select 
                id="historico-select" 
                class="form-control" 
                [value]="historico?.id" 
                (change)="onHistoricoChange($event)">
                <option *ngFor="let h of historicos" [value]="h.id">
                  {{ getHistoricoDisplayText(h) }}
                </option>
              </select>
                </div>
            
            <div class="medical-info">
              <div class="info-item full-width">
                    <label>Motivo de Consulta</label>
                <div class="info-text" [innerHTML]="historico?.motivo_consulta || patient.motivo_consulta || 'No especificado'"></div>
                  </div>
              <div class="info-item full-width" *ngIf="historico?.diagnostico || patient.diagnostico">
                    <label>Diagnóstico</label>
                <div class="info-text" [innerHTML]="historico?.diagnostico || patient.diagnostico"></div>
                  </div>
              <div class="info-item full-width" *ngIf="historico?.conclusiones || patient.conclusiones">
                    <label>Conclusiones</label>
                <div class="info-text" [innerHTML]="historico?.conclusiones || patient.conclusiones"></div>
              </div>
              <!-- Campos removidos: antecedentes_medicos, medicamentos, alergias, observaciones -->
              <!-- Estos campos no existen en la estructura actual de la base de datos -->
              <div class="info-item full-width" *ngIf="patient.plan">
                    <label>Plan de Tratamiento</label>
                <div class="info-text" [innerHTML]="patient.plan"></div>
                  </div>
              <div class="info-item full-width" *ngIf="historico?.fecha_consulta">
                <label>Fecha de Consulta</label>
                <p class="info-text">{{ formatDate(historico!.fecha_consulta) }}</p>
                </div>
              </div>
          </div>

          <div class="section">
            <h3>Información del Sistema</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Fecha de Creación</label>
                <span>{{ formatDate(patient.fecha_creacion) }}</span>
              </div>
              <div class="info-item">
                <label>Última Actualización</label>
                <span>{{ formatDate(patient.fecha_actualizacion) }}</span>
              </div>
            </div>
          </div>

          <div class="section" *ngIf="archivos.length > 0">
            <h3>Archivos Anexos</h3>
            <div class="archivos-container">
              <div class="archivo-item" *ngFor="let archivo of archivos">
                <div class="archivo-info">
                  <div class="archivo-icon">
                    <span [innerHTML]="getFileIcon(archivo.tipo_mime)"></span>
                  </div>
                  <div class="archivo-details">
                    <div class="archivo-name">{{ archivo.nombre_original }}</div>
                    <div class="archivo-meta">
                      <span class="archivo-size">{{ formatFileSize(archivo.tamano_bytes) }}</span>
                      <span class="archivo-date">{{ formatDate(archivo.fecha_subida || '') }}</span>
                    </div>
                    <div class="archivo-description" *ngIf="archivo.descripcion">
                      {{ archivo.descripcion }}
                    </div>
                  </div>
                </div>
                <div class="archivo-actions">
                  <button class="btn-download" (click)="downloadFile(archivo)" title="Descargar">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="patient-actions">
          <div class="action-group">
            <button class="btn btn-primary" (click)="printReport()">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
              </svg>
              Imprimir Informe
            </button>
            <button class="btn btn-secondary" (click)="referPatient()">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Interconsulta
          </button>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Cargando datos del paciente...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>{{ error }}</p>
        <a routerLink="/patients" class="btn btn-primary">
          Volver a Pacientes
        </a>
      </div>

      <!-- Modal de Remisión -->
      <app-remitir-paciente-modal
        [isOpen]="showRemitirModal"
        [patient]="patient"
        (close)="closeRemitirModal()"
        (remisionCreated)="onRemisionCreated($event)">
      </app-remitir-paciente-modal>
    </div>
  `,
  styles: [`
    .patient-detail-page {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .patient-detail {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .patient-header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .patient-avatar {
      flex-shrink: 0;
    }

    .avatar-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .patient-info h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }

    .patient-meta {
      font-size: 1.1rem;
      margin: 0 0 0.5rem 0;
      opacity: 0.9;
    }

    .patient-contact {
      font-size: 1rem;
      margin: 0;
      opacity: 0.8;
    }

    .patient-sections {
      padding: 2rem;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section:last-child {
      margin-bottom: 0;
    }

    .section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .history-selector {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .history-selector label {
      display: block;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background: white;
      transition: border-color 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #f5576c;
      box-shadow: 0 0 0 3px rgba(245, 87, 108, 0.1);
    }

    .history-count {
      font-size: 0.875rem;
      font-weight: 500;
      color: #f5576c;
      background: #fce7f3;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      margin-left: 0.5rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-item label {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-item span {
      color: #1e293b;
      font-size: 1rem;
    }

    .info-text {
      color: #1e293b;
      font-size: 1rem;
      line-height: 1.6;
      margin: 0;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border-left: 4px solid #f5576c;
    }

    .info-text p {
      margin: 0 0 0.5rem 0;
    }

    .info-text p:last-child {
      margin-bottom: 0;
    }

    .info-text ul, .info-text ol {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }

    .info-text li {
      margin-bottom: 0.25rem;
    }

    .info-text strong {
      font-weight: 600;
    }

    .info-text em {
      font-style: italic;
    }

    .info-text u {
      text-decoration: underline;
    }

    .archivos-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .archivo-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: #f8fafc;
      transition: all 0.2s ease;
    }

    .archivo-item:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .archivo-info {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 1rem;
    }

    .archivo-icon {
      font-size: 1.5rem;
      color: #64748b;
    }

    .archivo-details {
      flex: 1;
    }

    .archivo-name {
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .archivo-meta {
      font-size: 0.875rem;
      color: #64748b;
      display: flex;
      gap: 1rem;
    }

    .archivo-description {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
      font-style: italic;
    }

    .archivo-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-download {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.375rem;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-download:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }

    .btn-download .btn-icon {
      width: 18px;
      height: 18px;
    }

    .sex-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      background-color: #e5e7eb;
      color: #374151;
    }

    .sex-badge.female {
      background-color: #E8F0F8;
      color: #5A7A9A;
    }

    .cedula-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      background-color: #E8F0F8;
      color: #5A7A9A;
      font-family: 'Courier New', monospace;
    }

    .medico-info {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      background-color: #f0f9ff;
      color: #0369a1;
      white-space: nowrap;
    }

    .patient-actions {
      padding: 1.5rem 2rem;
      background: #f8fafc;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .action-group {
      display: flex;
      gap: 1rem;
    }

    .btn-icon {
      width: 18px;
      height: 18px;
      margin-right: 0.5rem;
    }

    .loading, .error {
      text-align: center;
      padding: 2rem;
    }

    .loading p, .error p {
      margin-top: 1rem;
      color: #64748b;
    }

    .error p {
      color: #ef4444;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .header-actions {
        flex-direction: column;
      }

      .patient-header {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .patient-actions {
      flex-direction: column;
      gap: 1rem;
        align-items: stretch;
      }

      .action-group {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  `]
})
export class PatientDetailComponent implements OnInit {
  patient: Patient | null = null;
  historico: HistoricoWithDetails | null = null;
  historicos: HistoricoWithDetails[] = []; // Todas las historias
  archivos: ArchivoAnexo[] = [];
  loading = true;
  error: string | null = null;
  showRemitirModal = false;

  constructor(
    private patientService: PatientService,
    private historicoService: HistoricoService,
    private archivoService: ArchivoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadPatient(id);
    });
  }

  loadPatient(id: number) {
    this.loading = true;
    this.error = null;
    
    // Cargar datos del paciente
    this.patientService.getPatientById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.patient = response.data;
          // Cargar historial médico del paciente
          this.loadHistorico(id);
        } else {
          this.error = 'Paciente no encontrado';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        this.error = 'Error al cargar los datos del paciente';
        this.loading = false;
      }
    });
  }

  loadHistorico(pacienteId: number) {
    // Cargar todas las historias del paciente
    this.historicoService.getHistoricoByPaciente(pacienteId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.historicos = response.data;
          // Seleccionar la más reciente por defecto
          if (this.historicos.length > 0) {
            this.historico = this.historicos[0];
            this.loadArchivos(this.historico.id);
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading historicos:', error);
        // No mostrar error si no hay historial, solo continuar
        this.loading = false;
      }
    });
  }

  loadArchivos(historicoId: number) {
    this.archivoService.getArchivosByHistoria(historicoId).subscribe({
      next: (response) => {
        if (response.success) {
          this.archivos = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading archivos:', error);
        this.archivos = [];
      }
    });
  }

  getInitials(nombres: string, apellidos: string): string {
    const firstInitial = nombres.charAt(0).toUpperCase();
    const lastInitial = apellidos.charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  printReport() {
    if (this.patient) {
      // Crear una nueva ventana para imprimir
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = this.generatePrintContent();
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  referPatient() {
    console.log('🔍 Patient data when opening modal:', this.patient);
    if (this.patient) {
      this.showRemitirModal = true;
    } else {
      console.log('⚠️ No patient data available for remision');
    }
  }

  closeRemitirModal() {
    this.showRemitirModal = false;
  }

  onRemisionCreated(remision: any) {
    console.log('Remisión creada:', remision);
    alert(`✅ Paciente remitido exitosamente\n\n${this.patient?.nombres} ${this.patient?.apellidos} ha sido remitido correctamente. Se ha enviado una notificación al médico especialista.`);
    this.showRemitirModal = false;
  }

  // Método para manejar el cambio de historia en el template
  onHistoricoChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const historicoId = +target.value;
    this.selectHistorico(historicoId);
  }

  // Método para cambiar entre historias
  selectHistorico(historicoId: number) {
    const selectedHistorico = this.historicos.find(h => h.id === historicoId);
    if (selectedHistorico) {
      this.historico = selectedHistorico;
      this.loadArchivos(selectedHistorico.id);
    }
  }

  // Método para obtener el texto del selector de historias
  getHistoricoDisplayText(historico: HistoricoWithDetails): string {
    const fecha = this.formatDate(historico.fecha_consulta);
    const medico = historico.nombre_medico || 
                  (historico.medico_nombre && historico.medico_apellidos ? 
                   `${historico.medico_nombre} ${historico.medico_apellidos}` : 
                   'Médico no especificado');
    return `${fecha} - ${medico}`;
  }


  private generatePrintContent(): string {
    if (!this.patient) return '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe Médico - ${this.patient.nombres} ${this.patient.apellidos}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #7A9CC6; }
          .patient-info { margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #7A9CC6; border-bottom: 2px solid #7A9CC6; }
          .info-row { display: flex; margin-bottom: 10px; }
          .info-label { font-weight: bold; width: 150px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">DemoMed</div>
          <h1>Informe Médico</h1>
        </div>
        
        <div class="patient-info">
          <h2>${this.patient.nombres} ${this.patient.apellidos}</h2>
          <div class="info-row">
            <span class="info-label">Edad:</span>
            <span>${this.patient.edad} años</span>
          </div>
          <div class="info-row">
            <span class="info-label">Sexo:</span>
            <span>${this.patient.sexo}</span>
          </div>
          ${this.patient.cedula ? `
          <div class="info-row">
            <span class="info-label">Cédula:</span>
            <span>${this.patient.cedula}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span>${this.patient.email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Teléfono:</span>
            <span>${this.patient.telefono}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>Motivo de Consulta</h3>
          <div>${this.historico?.motivo_consulta || this.patient.motivo_consulta || 'No especificado'}</div>
        </div>
        
        ${(this.historico?.diagnostico || this.patient.diagnostico) ? `
        <div class="section">
          <h3>Diagnóstico</h3>
          <div>${this.historico?.diagnostico || this.patient.diagnostico}</div>
        </div>
        ` : ''}
        
        ${(this.historico?.conclusiones || this.patient.conclusiones) ? `
        <div class="section">
          <h3>Conclusiones</h3>
          <div>${this.historico?.conclusiones || this.patient.conclusiones}</div>
        </div>
        ` : ''}
        
        <!-- Campos removidos: antecedentes_medicos, medicamentos, alergias, observaciones -->
        <!-- Estos campos no existen en la estructura actual de la base de datos -->
        
        ${this.patient.plan ? `
        <div class="section">
          <h3>Plan de Tratamiento</h3>
          <div>${this.patient.plan}</div>
        </div>
        ` : ''}
        
        ${this.historico?.fecha_consulta ? `
        <div class="section">
          <h3>Fecha de Consulta</h3>
          <p>${this.formatDate(this.historico!.fecha_consulta)}</p>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}</p>
          <p>DemoMed - Sistema de Gestión Médica</p>
        </div>
      </body>
      </html>
    `;
  }

  getLastMedicoTratante(): string | null {
    // Check for the field that actually comes from the backend
    if (this.historico?.nombre_medico) {
      return this.historico.nombre_medico;
    }
    
    // Fallback to the original fields if they exist
    if (this.historico?.medico_nombre && this.historico?.medico_apellidos) {
      return `${this.historico.medico_nombre} ${this.historico.medico_apellidos}`;
    }
    
    return null;
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return '📝';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return '📊';
    } else if (mimeType.startsWith('text/')) {
      return '📃';
    } else {
      return '📎';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadFile(archivo: ArchivoAnexo) {
    this.archivoService.downloadArchivo(archivo.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = archivo.nombre_original;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        },
        error: (error) => {
        console.error('Error downloading file:', error);
        alert('❌ Error al descargar el archivo\n\nNo se pudo descargar el archivo. Por favor, verifique su conexión e intente nuevamente.');
        }
      });
  }
}
