import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MensajeService } from '../../../../services/mensaje.service';
import { MensajeDifusion, PacienteParaDifusion } from '../../../../models/mensaje.model';

@Component({
  selector: 'app-editar-mensaje',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [MensajeService],
  template: `
    <div class="editar-mensaje-page">
      <div class="page-header">
        <div class="header-content">
          <button class="btn-back" (click)="goBack()">
            ← Volver a Mensajes
          </button>
          <h1>{{ mensajeId > 0 ? 'Editar Mensaje' : 'Nuevo Mensaje' }}</h1>
        </div>
      </div>

      <div class="mensaje-form-container">
        <form #mensajeForm="ngForm" (ngSubmit)="saveMensaje()">
          <div class="form-section">
            <h2>Información del Mensaje</h2>
            
            <div class="form-group">
              <label for="titulo">Título *</label>
              <input 
                type="text" 
                id="titulo"
                [(ngModel)]="mensajeData.titulo"
                name="titulo"
                required
                class="form-input"
                placeholder="Ingrese el título del mensaje">
            </div>

            <div class="form-group">
              <label for="contenido">Contenido *</label>
              <textarea 
                id="contenido"
                [(ngModel)]="mensajeData.contenido"
                name="contenido"
                required
                rows="4"
                class="form-textarea"
                placeholder="Escriba el contenido del mensaje"></textarea>
            </div>

            <div class="form-group">
              <label for="tipo_mensaje">Tipo de Mensaje</label>
              <select 
                id="tipo_mensaje"
                [(ngModel)]="mensajeData.tipo_mensaje"
                name="tipo_mensaje"
                class="form-select">
                <option value="general">General</option>
                <option value="urgente">Urgente</option>
                <option value="recordatorio">Recordatorio</option>
              </select>
            </div>
          </div>

          <!-- Sección para seleccionar destinatarios en modo creación -->
          <div class="form-section" *ngIf="mensajeId === 0">
            <h2>Seleccionar Destinatarios</h2>
            
            <div class="destinatarios-filters">
              <input 
                type="text" 
                [(ngModel)]="busquedaPacientes"
                (input)="filterPacientes()"
                placeholder="Buscar pacientes..."
                class="form-input"
                [class.searching]="loadingPacientes"
                name="busquedaPacientes">
              
              <div class="quick-select">
                <button type="button" class="btn btn-sm" (click)="selectAllPacientes()">
                  Seleccionar Todos
                </button>
                <button type="button" class="btn btn-sm" (click)="selectActivePacientes()">
                  Solo Activos
                </button>
                <button type="button" class="btn btn-sm" (click)="clearSelection()">
                  Limpiar
                </button>
              </div>
            </div>

            <div class="pacientes-list">
              <!-- Indicador de carga -->
              <div *ngIf="loadingPacientes" class="loading-pacientes">
                <div class="spinner"></div>
                <span>Buscando pacientes...</span>
              </div>
              
              <!-- Mensaje de error -->
              <div *ngIf="errorPacientes && !loadingPacientes" class="error-message">
                <span>⚠️ {{ errorPacientes }}</span>
                <button type="button" class="btn-retry" (click)="loadPacientes()">
                  🔄 Reintentar
                </button>
              </div>
              
              <!-- Tabla de pacientes -->
              <div *ngIf="!loadingPacientes && !errorPacientes">
                <div *ngIf="pacientesFiltrados.length === 0" class="no-pacientes">
                  <span>No se encontraron pacientes</span>
                </div>
                
                <div *ngIf="pacientesFiltrados.length > 0" class="pacientes-table-container">
                  <table class="pacientes-table">
                    <thead>
                      <tr>
                        <th width="50">
                          <input 
                            type="checkbox" 
                            [checked]="allSelected"
                            (change)="toggleAllPacientes()"
                            title="Seleccionar todos">
                        </th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Cédula</th>
                        <th>Edad</th>
                        <th>Sexo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let paciente of pacientesFiltrados" class="paciente-row">
                        <td>
                          <input 
                            type="checkbox" 
                            [checked]="paciente.seleccionado"
                            (change)="togglePaciente(paciente)">
                        </td>
                        <td>
                          <strong>{{ paciente.nombres }} {{ paciente.apellidos }}</strong>
                        </td>
                        <td>{{ paciente.email }}</td>
                        <td>{{ paciente.cedula || '-' }}</td>
                        <td>{{ paciente.edad || '-' }}</td>
                        <td>{{ paciente.sexo || '-' }}</td>
                        <td>
                          <span [class]="paciente.activo ? 'status-active' : 'status-inactive'">
                            {{ paciente.activo ? 'Activo' : 'Inactivo' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="selection-summary">
              <strong>{{ getSelectedCount() }} pacientes seleccionados</strong>
            </div>
          </div>

          <div class="form-section" *ngIf="mensajeId > 0">
            <h2>Destinatarios Actuales ({{ destinatariosActuales.length }})</h2>
            
            <div *ngIf="loadingDestinatarios" class="loading-destinatarios">
              <div class="spinner"></div>
              <span>Cargando destinatarios...</span>
            </div>
            
            <div *ngIf="!loadingDestinatarios && destinatariosActuales.length > 0" class="destinatarios-list">
              <div *ngFor="let destinatario of destinatariosActuales" class="destinatario-item">
                <div class="destinatario-info">
                  <strong>{{ destinatario.nombres }} {{ destinatario.apellidos }}</strong>
                  <small>{{ destinatario.email }}</small>
                  <small *ngIf="destinatario.cedula">Cédula: {{ destinatario.cedula }}</small>
                </div>
                <button type="button" class="btn-remove" (click)="removeDestinatario(destinatario.id)" title="Eliminar destinatario">
                  ❌
                </button>
              </div>
            </div>
            
            <div *ngIf="!loadingDestinatarios && destinatariosActuales.length === 0" class="no-destinatarios">
              <span>No hay destinatarios asignados</span>
            </div>
          </div>

          <div class="form-section" *ngIf="mensajeId > 0">
            <div class="section-header">
              <h2>Agregar Nuevos Destinatarios</h2>
              <button type="button" class="btn btn-primary" (click)="addNuevosDestinatarios()" [disabled]="getSelectedCount() === 0">
                ➕ Agregar Seleccionados ({{ getSelectedCount() }})
              </button>
            </div>
            
            <div class="destinatarios-filters">
              <input 
                type="text" 
                [(ngModel)]="busquedaPacientes"
                (input)="filterPacientes()"
                placeholder="Buscar pacientes..."
                class="form-input"
                [class.searching]="loadingPacientes"
                name="busquedaPacientes">
              
              <div class="quick-select">
                <button type="button" class="btn btn-sm" (click)="selectAllPacientes()">
                  Seleccionar Todos
                </button>
                <button type="button" class="btn btn-sm" (click)="selectActivePacientes()">
                  Solo Activos
                </button>
                <button type="button" class="btn btn-sm" (click)="clearSelection()">
                  Limpiar
                </button>
              </div>
            </div>

            <div class="pacientes-list">
              <!-- Indicador de carga -->
              <div *ngIf="loadingPacientes" class="loading-pacientes">
                <div class="spinner"></div>
                <span>Buscando pacientes...</span>
              </div>
              
              <!-- Mensaje de error -->
              <div *ngIf="errorPacientes && !loadingPacientes" class="error-message">
                <span>⚠️ {{ errorPacientes }}</span>
                <button type="button" class="btn-retry" (click)="loadPacientes()">
                  🔄 Reintentar
                </button>
              </div>
              
              <!-- Tabla de pacientes -->
              <div *ngIf="!loadingPacientes && !errorPacientes">
                <div *ngIf="pacientesFiltrados.length === 0" class="no-pacientes">
                  <span>No se encontraron pacientes</span>
                </div>
                
                <div *ngIf="pacientesFiltrados.length > 0" class="pacientes-table-container">
                  <table class="pacientes-table">
                    <thead>
                      <tr>
                        <th width="50">
                          <input 
                            type="checkbox" 
                            [checked]="allSelected"
                            (change)="toggleAllPacientes()"
                            title="Seleccionar todos">
                        </th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Cédula</th>
                        <th>Edad</th>
                        <th>Sexo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let paciente of pacientesFiltrados" class="paciente-row">
                        <td>
                          <input 
                            type="checkbox" 
                            [checked]="paciente.seleccionado"
                            (change)="togglePaciente(paciente)">
                        </td>
                        <td>
                          <strong>{{ paciente.nombres }} {{ paciente.apellidos }}</strong>
                        </td>
                        <td>{{ paciente.email }}</td>
                        <td>{{ paciente.cedula || '-' }}</td>
                        <td>{{ paciente.edad || '-' }}</td>
                        <td>{{ paciente.sexo || '-' }}</td>
                        <td>
                          <span [class]="paciente.activo ? 'status-active' : 'status-inactive'">
                            {{ paciente.activo ? 'Activo' : 'Inactivo' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="goBack()">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              [disabled]="!mensajeForm.valid">
              {{ mensajeId > 0 ? 'Guardar Cambios' : 'Crear Mensaje' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .editar-mensaje-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-back {
      background: #6b7280;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background-color 0.2s;
    }

    .btn-back:hover {
      background: #4b5563;
    }

    .page-header h1 {
      margin: 0;
      color: #1f2937;
      font-size: 1.875rem;
      font-weight: 700;
    }

    .mensaje-form-container {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-child {
      border-bottom: none;
    }

    .form-section h2 {
      margin: 0 0 1.5rem 0;
      color: #374151;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #374151;
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.2s;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    /* Estilos para destinatarios actuales */
    .destinatarios-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      background-color: white;
    }

    .destinatario-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .destinatario-item:last-child {
      border-bottom: none;
    }

    .destinatario-info {
      flex: 1;
    }

    .destinatario-info strong {
      display: block;
      color: #1e293b;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .destinatario-info small {
      display: block;
      color: #64748b;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .btn-remove {
      background: none;
      border: none;
      color: #dc2626;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: background-color 0.2s;
    }

    .btn-remove:hover {
      background-color: #fef2f2;
    }

    .no-destinatarios {
      text-align: center;
      color: #64748b;
      font-style: italic;
      padding: 2rem;
    }

    .loading-destinatarios {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #64748b;
    }

    .loading-destinatarios .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #e2e8f0;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }

    /* Estilos para búsqueda de pacientes */
    .destinatarios-filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
    }

    .destinatarios-filters .form-input {
      flex: 1;
    }

    .quick-select {
      display: flex;
      gap: 0.5rem;
    }

    .pacientes-list {
      margin-top: 1rem;
    }

    .loading-pacientes {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #64748b;
    }

    .loading-pacientes .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #e2e8f0;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.375rem;
      color: #dc2626;
    }

    .btn-retry {
      background: #dc2626;
      color: white;
      border: none;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .no-pacientes {
      text-align: center;
      color: #64748b;
      font-style: italic;
      padding: 2rem;
    }

    .pacientes-table-container {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    }

    .pacientes-table {
      width: 100%;
      border-collapse: collapse;
    }

    .pacientes-table th {
      background-color: #f9fafb;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .pacientes-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .paciente-row:hover {
      background-color: #f9fafb;
    }

    .status-active {
      color: #059669;
      font-weight: 600;
    }

    .status-inactive {
      color: #dc2626;
      font-weight: 600;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .btn-primary:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #6b7280;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #4b5563;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class EditarMensajeComponent implements OnInit {
  mensajeId!: number;
  mensajeData = {
    titulo: '',
    contenido: '',
    tipo_mensaje: 'general'
  };

  // Propiedades para destinatarios
  destinatariosActuales: PacienteParaDifusion[] = [];
  loadingDestinatarios = false;

  // Propiedades para búsqueda de pacientes
  pacientes: PacienteParaDifusion[] = [];
  pacientesFiltrados: PacienteParaDifusion[] = [];
  loadingPacientes = false;
  errorPacientes = '';
  searchTimeout: any = null;
  allSelected = false;
  busquedaPacientes = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mensajeService: MensajeService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.mensajeId = idParam ? +idParam : 0;
    
    if (this.mensajeId > 0) {
      // Modo edición
      this.loadMensaje();
      this.loadDestinatariosActuales();
      this.loadPacientes(); // También cargar pacientes para agregar nuevos
    } else {
      // Modo creación - cargar pacientes para selección
      this.loadPacientes();
    }
  }

  loadMensaje() {
    this.mensajeService.getMensajeById(this.mensajeId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.mensajeData = {
            titulo: response.data.titulo,
            contenido: response.data.contenido,
            tipo_mensaje: response.data.tipo_mensaje || 'general'
          };
        }
      },
      error: (error: any) => {
        console.error('Error loading mensaje:', error);
      }
    });
  }

  loadDestinatariosActuales() {
    this.loadingDestinatarios = true;
    this.mensajeService.getDestinatariosActuales(this.mensajeId).subscribe({
      next: (response: any) => {
        this.loadingDestinatarios = false;
        if (response.success) {
          this.destinatariosActuales = response.data;
        } else {
          console.error('Error loading destinatarios:', response);
        }
      },
      error: (error: any) => {
        this.loadingDestinatarios = false;
        console.error('Error loading destinatarios:', error);
      }
    });
  }

  loadPacientes(busqueda?: string) {
    this.loadingPacientes = true;
    this.errorPacientes = '';
    
    const filtros = busqueda ? { busqueda } : {};
    
    this.mensajeService.getPacientesParaDifusion(filtros).subscribe({
      next: (response: any) => {
        this.loadingPacientes = false;
        if (response.success) {
          this.pacientes = response.data;
          this.pacientesFiltrados = [...this.pacientes];
          this.updateAllSelectedState();
        } else {
          this.errorPacientes = 'Error al cargar los pacientes';
          console.error('Error del servidor:', response);
        }
      },
      error: (error: any) => {
        this.loadingPacientes = false;
        this.errorPacientes = 'Error de conexión al cargar pacientes';
        console.error('Error loading pacientes:', error);
      }
    });
  }

  filterPacientes() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      if (!this.busquedaPacientes || this.busquedaPacientes.trim() === '') {
        this.loadPacientes();
      } else {
        this.loadPacientes(this.busquedaPacientes.trim());
      }
    }, 300);
  }

  togglePaciente(paciente: PacienteParaDifusion) {
    paciente.seleccionado = !paciente.seleccionado;
    this.updateAllSelectedState();
  }

  toggleAllPacientes() {
    this.allSelected = !this.allSelected;
    this.pacientesFiltrados.forEach(paciente => {
      paciente.seleccionado = this.allSelected;
    });
  }

  updateAllSelectedState() {
    const total = this.pacientesFiltrados.length;
    const selected = this.pacientesFiltrados.filter(p => p.seleccionado).length;
    this.allSelected = total > 0 && selected === total;
  }

  getSelectedCount(): number {
    return this.pacientesFiltrados.filter(p => p.seleccionado).length;
  }

  selectAllPacientes() {
    this.pacientesFiltrados.forEach(paciente => {
      paciente.seleccionado = true;
    });
    this.updateAllSelectedState();
  }

  selectActivePacientes() {
    this.pacientesFiltrados.forEach(paciente => {
      paciente.seleccionado = paciente.activo === true;
    });
    this.updateAllSelectedState();
  }

  clearSelection() {
    this.pacientesFiltrados.forEach(paciente => {
      paciente.seleccionado = false;
    });
    this.updateAllSelectedState();
  }

  removeDestinatario(pacienteId: number) {
    this.mensajeService.eliminarDestinatario(this.mensajeId, pacienteId).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Recargar destinatarios actuales para obtener datos actualizados
          this.loadDestinatariosActuales();
        } else {
          console.error('Error removing destinatario:', response);
        }
      },
      error: (error: any) => {
        console.error('Error removing destinatario:', error);
      }
    });
  }

  addNuevosDestinatarios() {
    const seleccionados = this.pacientesFiltrados.filter(p => p.seleccionado);
    if (seleccionados.length === 0) return;
    
    const destinatariosIds = seleccionados.map(p => p.id);
    
    this.mensajeService.agregarDestinatarios(this.mensajeId, destinatariosIds).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Recargar destinatarios actuales para obtener datos actualizados
          this.loadDestinatariosActuales();
          // Limpiar selecciones
          this.pacientesFiltrados.forEach(p => p.seleccionado = false);
          this.updateAllSelectedState();
        } else {
          console.error('Error adding destinatarios:', response);
        }
      },
      error: (error: any) => {
        console.error('Error adding destinatarios:', error);
      }
    });
  }

  saveMensaje() {
    if (this.mensajeId > 0) {
      // Modo edición
      this.mensajeService.actualizarMensaje(this.mensajeId, this.mensajeData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.goBack();
          } else {
            console.error('Error updating mensaje:', response);
          }
        },
        error: (error: any) => {
          console.error('Error updating mensaje:', error);
        }
      });
    } else {
      // Modo creación
      const destinatariosIds = this.pacientesFiltrados.filter(p => p.seleccionado).map(p => p.id);
      const mensajeDataWithDestinatarios = {
        ...this.mensajeData,
        destinatarios: destinatariosIds
      };
      
      this.mensajeService.crearMensaje(mensajeDataWithDestinatarios).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.goBack();
          } else {
            console.error('Error creating mensaje:', response);
          }
        },
        error: (error: any) => {
          console.error('Error creating mensaje:', error);
        }
      });
    }
  }

  goBack() {
    // Navegar de vuelta a la lista de mensajes
    this.router.navigate(['/admin/mensajes']);
  }
}
