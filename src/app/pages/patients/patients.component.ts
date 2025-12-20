import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { HistoricoService } from '../../services/historico.service';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { User } from '../../models/user.model';
import { Patient, PatientFilters } from '../../models/patient.model';
import { APP_CONFIG } from '../../config/app.config';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ConfirmModalComponent],
  template: `
    <div class="patients-page">
      <div class="page-header">
        <h1><i class="fas fa-users"></i> Gestión de Pacientes</h1>
        <a routerLink="/patients/new" class="btn btn-new">
          ➕ Nuevo Paciente
        </a>
      </div>

      <div class="filters-section">
        <div class="filters-grid">
          <div class="form-group">
            <label class="form-label">Buscar por nombre</label>
            <input 
              type="text" 
              class="form-input" 
              [(ngModel)]="searchName"
              (input)="onSearchChange()"
              placeholder="Nombre del paciente">
          </div>
          <div class="form-group">
            <label class="form-label">Buscar por cédula</label>
            <input 
              type="text" 
              class="form-input" 
              [(ngModel)]="searchCedula"
              (input)="onCedulaSearchChange()"
              placeholder="V-12345678">
          </div>
          <div class="form-group">
            <label class="form-label">Sexo</label>
            <select class="form-input" [(ngModel)]="filters.sexo" (change)="applyFilters()">
              <option value="">Todos</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Edad mínima</label>
            <input 
              type="number" 
              class="form-input" 
              [(ngModel)]="filters.edad_min"
              (input)="applyFilters()"
              placeholder="Edad mínima">
          </div>
          <div class="form-group">
            <label class="form-label">Edad máxima</label>
            <input 
              type="number" 
              class="form-input" 
              [(ngModel)]="filters.edad_max"
              (input)="applyFilters()"
              placeholder="Edad máxima">
          </div>
        </div>
        <div class="filters-actions">
          <button class="btn btn-clear" (click)="clearFilters()">
            🗑️ Limpiar Filtros
          </button>
        </div>
      </div>

      <div class="patients-table" *ngIf="!loading">
        <!-- Vista de tabla para desktop -->
        <div class="table-desktop">
          <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Edad</th>
              <th>Sexo</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Motivo Consulta</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let patient of patients">
              <td>{{ patient.id }}</td>
              <td>{{ patient.nombres }} {{ patient.apellidos }}</td>
              <td>
                <span class="cedula-badge">{{ patient.cedula || 'N/A' }}</span>
              </td>
              <td>{{ patient.edad }}</td>
              <td>
                <span class="sex-badge" [class.female]="patient.sexo === 'Femenino'">
                  {{ patient.sexo }}
                </span>
              </td>
              <td>{{ patient.email }}</td>
              <td>{{ patient.telefono }}</td>
              <td>{{ patient.motivo_consulta }}</td>
              <td>
                <span class="status-badge" [class.active]="patient.activo" [class.inactive]="!patient.activo">
                  {{ patient.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <a routerLink="/patients/{{ patient.id }}" class="action-btn view-btn" title="Ver detalles">
                    <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    Ver
                  </a>
                  <a routerLink="/patients/{{ patient.id }}/edit" class="action-btn edit-btn" title="Editar paciente">
                    <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    Editar
                  </a>
                  <button 
                    *ngIf="currentUser?.rol === 'medico'"
                    class="action-btn history-btn" 
                    [class.has-history]="tieneHistoriaMedica(patient)"
                    (click)="gestionarHistoriaMedica(patient)" 
                    [title]="getHistoriaTooltip(patient)">
                    <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    {{ tieneHistoriaMedica(patient) ? 'Editar Historia' : 'Crear Historia' }}
                    <span *ngIf="tieneHistoriaMedica(patient)" class="history-indicator">✓</span>
                  </button>
                  <button 
                    class="action-btn" 
                    [class.delete-btn]="!patient.activo"
                    [class.activate-btn]="patient.activo"
                    (click)="deletePatient(patient.id)" 
                    [title]="patient.activo ? 'Desactivar paciente' : 'Activar paciente'">
                    <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    {{ patient.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <!-- Vista de tarjetas para móvil -->
        <div class="table-mobile">
          <div class="patient-card" *ngFor="let patient of patients">
            <div class="card-header">
              <div class="patient-info">
                <h3 class="patient-name">{{ patient.nombres }} {{ patient.apellidos }}</h3>
                <div class="patient-meta">
                  <span class="patient-id">ID: {{ patient.id }}</span>
                  <span class="status-badge" [class.active]="patient.activo" [class.inactive]="!patient.activo">
                    {{ patient.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="card-body">
              <div class="info-row">
                <span class="label">Cédula:</span>
                <span class="value">{{ patient.cedula || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Edad:</span>
                <span class="value">{{ patient.edad }} años</span>
              </div>
              <div class="info-row">
                <span class="label">Sexo:</span>
                <span class="sex-badge" [class.female]="patient.sexo === 'Femenino'">
                  {{ patient.sexo }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">{{ patient.email }}</span>
              </div>
              <div class="info-row">
                <span class="label">Teléfono:</span>
                <span class="value">{{ patient.telefono }}</span>
              </div>
              <div class="info-row" *ngIf="patient.motivo_consulta">
                <span class="label">Motivo Consulta:</span>
                <span class="value">{{ patient.motivo_consulta }}</span>
              </div>
            </div>
            
            <div class="card-actions">
              <a routerLink="/patients/{{ patient.id }}" class="action-btn view-btn" title="Ver detalles">
                <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                Ver
              </a>
              <a routerLink="/patients/{{ patient.id }}/edit" class="action-btn edit-btn" title="Editar paciente">
                <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                Editar
              </a>
              <button 
                *ngIf="currentUser?.rol === 'medico'"
                class="action-btn history-btn" 
                [class.has-history]="tieneHistoriaMedica(patient)"
                (click)="gestionarHistoriaMedica(patient)" 
                [title]="getHistoriaTooltip(patient)">
                <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                {{ tieneHistoriaMedica(patient) ? 'Editar Historia' : 'Crear Historia' }}
                <span *ngIf="tieneHistoriaMedica(patient)" class="history-indicator">✓</span>
              </button>
              <button 
                class="action-btn" 
                [class.delete-btn]="!patient.activo"
                [class.activate-btn]="patient.activo"
                (click)="deletePatient(patient.id)" 
                [title]="patient.activo ? 'Desactivar paciente' : 'Activar paciente'">
                <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                {{ patient.activo ? 'Desactivar' : 'Activar' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div *ngIf="!loading && patients.length === 0" class="empty-state">
          <div class="empty-state-content">
            <div class="empty-state-icon">👥</div>
            <div class="empty-state-title">No hay pacientes</div>
            <div class="empty-state-description">
              No se encontraron pacientes con los filtros aplicados.
            </div>
            <a routerLink="/patients/new" class="btn btn-new">
              ➕ Crear Primer Paciente
            </a>
          </div>
        </div>
      </div>

      <div class="pagination" *ngIf="pagination && pagination.pages > 1">
        <button 
          class="btn btn-clear" 
          [disabled]="currentPage === 1"
          (click)="changePage(currentPage - 1)">
          ← Anterior
        </button>
        <span class="pagination-info">
          Página {{ currentPage }} de {{ pagination.pages }}
        </span>
        <button 
          class="btn btn-clear" 
          [disabled]="currentPage === pagination.pages"
          (click)="changePage(currentPage + 1)">
          Siguiente →
        </button>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Cargando pacientes...</p>
      </div>
    </div>

    <!-- Modal de confirmación eliminar -->
    <app-confirm-modal 
      *ngIf="showConfirmModal"
      [show]="showConfirmModal"
      title="Eliminar Paciente"
      message="¿Estás seguro de que quieres eliminar este paciente?"
      [itemName]="patientToDelete ? patientToDelete.nombres + ' ' + patientToDelete.apellidos : ''"
      warningText="Esta acción eliminará permanentemente todos los datos del paciente, incluyendo historias médicas y archivos."
      confirmText="🗑️ Eliminar"
      cancelText="Cancelar"
      type="danger"
      (confirm)="onConfirmDelete()"
      (cancel)="onCancelDelete()">
    </app-confirm-modal>
  `,
  styles: [`
    .patients-page {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .filters-section {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .filters-actions {
      display: flex;
      gap: 1rem;
    }

    .patients-table {
      background: white;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .table {
      width: 100%;
      margin: 0;
    }

    .table th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #374151;
      padding: 0.75rem 0.5rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .table td {
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: middle;
      font-size: 0.8rem;
      line-height: 1.4;
    }

    .table tbody tr:nth-child(even) {
      background-color: #fafafa;
    }

    .table tbody tr:hover {
      background-color: #f0f0f0;
    }

    .table tbody tr:nth-child(even):hover {
      background-color: #e8e8e8;
    }

    .sex-badge {
      padding: 0.25rem 0.5rem;
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
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      background-color: #e0f2fe;
      color: #0369a1;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
      flex-wrap: nowrap;
      justify-content: center;
      align-items: center;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border: none;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: auto;
      justify-content: center;
      white-space: nowrap;
    }

    .action-icon {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }

    .view-btn {
      background-color: #3b82f6;
      color: white;
    }

    .view-btn:hover {
      background-color: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .edit-btn {
      background-color: #f59e0b;
      color: white;
    }

    .edit-btn:hover {
      background-color: #d97706;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
    }

    .delete-btn {
      background-color: #ef4444;
      color: white;
    }

    .delete-btn:hover {
      background-color: #dc2626;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
    }

    .history-btn {
      background: #10b981;
      color: white;
      position: relative;
    }

    .history-btn:hover {
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
    }

    .history-btn.has-history {
      background: #059669;
      border-left: 4px solid #34d399;
    }

    .history-indicator {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #34d399;
      color: white;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    /* Estado vacío */
    .empty-state {
      text-align: center;
      padding: 5rem 4rem;
      color: #6b7280;
    }

    .empty-state-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      padding: 3rem;
      background: #f8fafc;
      border-radius: 1rem;
      margin: 2rem;
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.5;
    }

    .empty-state-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 1rem;
    }

    .empty-state-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 2rem;
      max-width: 400px;
      line-height: 1.5;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .pagination-info {
      color: #64748b;
      font-weight: 500;
    }

    .loading {
      text-align: center;
      padding: 2rem;
    }

    .loading p {
      margin-top: 1rem;
      color: #64748b;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .table {
        font-size: 0.75rem;
      }

      .table th,
      .table td {
        padding: 0.5rem 0.25rem;
      }

      .action-buttons {
        flex-direction: column;
        gap: 0.25rem;
      }

      .action-btn {
        min-width: 100%;
        padding: 0.375rem 0.5rem;
        font-size: 0.7rem;
      }

      .action-icon {
        width: 10px;
        height: 10px;
      }
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-block;
    }

    .status-badge.active {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .status-badge.inactive {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .activate-btn {
      background-color: #28a745 !important;
      color: white !important;
    }

    .activate-btn:hover {
      background-color: #218838 !important;
    }

    /* Vista de tabla para desktop */
    .table-desktop {
      display: block;
    }

    /* Vista de tarjetas para móvil */
    .table-mobile {
      display: none;
    }

    /* Estilos para las tarjetas móviles */
    .patient-card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      margin-bottom: 1rem;
      overflow: hidden;
    }

    .card-header {
      background: #f8fafc;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .patient-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .patient-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .patient-id {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .card-body {
      padding: 1rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      min-width: 100px;
    }

    .value {
      color: #64748b;
      font-size: 0.875rem;
      text-align: right;
      flex: 1;
      margin-left: 1rem;
    }

    .card-actions {
      padding: 1rem;
      background: #f8fafc;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .card-actions .action-btn {
      font-size: 0.75rem;
      padding: 0.5rem;
      justify-content: center;
    }

    /* Media queries para responsividad */
    @media (max-width: 1024px) {
      .table-desktop {
        display: none;
      }
      
      .table-mobile {
        display: block;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .card-actions {
        grid-template-columns: 1fr;
      }

      .patient-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .value {
        text-align: left;
        margin-left: 0;
      }
    }

    @media (max-width: 480px) {
      .patients-page {
        padding: 0.5rem;
      }

      .filters-section {
        padding: 1rem;
      }

      .card-header,
      .card-body,
      .card-actions {
        padding: 0.75rem;
      }

      .patient-name {
        font-size: 1rem;
      }

      .action-btn {
        font-size: 0.7rem;
        padding: 0.375rem 0.5rem;
      }
    }
  `]
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  loading = true;
  currentPage = 1;
  pageSize = APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
  pagination: any = null;
  searchName = '';
  searchCedula = '';
  filters: PatientFilters = {};
  pageSizeOptions = APP_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS;
  currentUser: User | null = null;
  
  // Modal de confirmación eliminar
  showConfirmModal: boolean = false;
  patientToDelete: Patient | null = null;

  constructor(
    private patientService: PatientService,
    private historicoService: HistoricoService,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    // Obtener el usuario actual
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      this.loadPatients();
    });
  }

  loadPatients() {
    this.loading = true;
    
    if (!this.currentUser) {
      this.loading = false;
      return;
    }

    // Si es administrador o secretaria, cargar todos los pacientes
    if (this.currentUser.rol === 'administrador' || this.currentUser.rol === 'secretaria') {
      this.patientService.getAllPatients(this.filters, { page: this.currentPage, limit: this.pageSize })
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.patients = response.data;
              this.pagination = response.pagination;
              // Verificar historia médica para cada paciente
              this.patients.forEach(patient => this.verificarHistoriaMedica(patient));
            }
            this.loading = false;
          },
          error: (error) => {
            this.errorHandler.logError(error, 'cargar pacientes');
            this.loading = false;
          }
        });
    } 
    // Si es médico, cargar solo sus pacientes
    else if (this.currentUser.rol === 'medico' && this.currentUser.medico_id) {
      this.patientService.getPatientsByMedico(this.currentUser.medico_id, this.currentPage, this.pageSize, this.filters)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.patients = response.data.patients;
              this.pagination = {
                page: response.data.page,
                limit: response.data.limit,
                total: response.data.total,
                pages: response.data.totalPages
              };
              // Verificar historia médica para cada paciente
              this.patients.forEach(patient => this.verificarHistoriaMedica(patient));
            }
            this.loading = false;
          },
          error: (error) => {
            this.errorHandler.logError(error, 'cargar pacientes del médico');
            this.loading = false;
          }
        });
    } else {
      this.loading = false;
    }
  }

  onSearchChange() {
    if (this.searchName.trim()) {
      this.patientService.searchPatients(this.searchName).subscribe({
        next: (response) => {
          if (response.success) {
            this.patients = response.data;
            this.pagination = null;
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'buscar pacientes');
        }
      });
    } else {
      this.loadPatients();
    }
  }

  onCedulaSearchChange() {
    if (this.searchCedula.trim()) {
      this.patientService.searchPatientsByCedula(this.searchCedula).subscribe({
        next: (response) => {
          if (response.success) {
            this.patients = response.data;
            this.pagination = null;
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'buscar pacientes por cédula');
        }
      });
    } else {
      this.loadPatients();
    }
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadPatients();
  }

  clearFilters() {
    this.filters = {};
    this.searchName = '';
    this.searchCedula = '';
    this.currentPage = 1;
    this.loadPatients();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadPatients();
  }

  deletePatient(id: number) {
    const patient = this.patients.find(p => p.id === id);
    if (patient) {
      // Verificar si el paciente tiene consultas asociadas
      this.patientService.hasConsultations(patient.id!).subscribe({
        next: (response) => {
          if (response.success && response.data.hasConsultations) {
            // Si tiene consultas, cambiar estado activo/inactivo
            this.togglePatientStatus(patient);
          } else {
            // Si no tiene consultas, eliminar físicamente
            this.patientToDelete = patient;
            this.showConfirmModal = true;
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'verificar estado del paciente');
          const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'verificar estado del paciente');
          alert(errorMessage);
        }
      });
    }
  }

  togglePatientStatus(patient: Patient) {
    const newStatus = !patient.activo;
    const action = newStatus ? 'activar' : 'desactivar';
    
    if (confirm(`¿Estás seguro de que quieres ${action} a ${patient.nombres} ${patient.apellidos}?`)) {
      this.patientService.togglePatientStatus(patient.id!, newStatus).subscribe({
        next: (response) => {
          if (response.success) {
            patient.activo = newStatus;
            this.errorHandler.logInfo(`Paciente ${action}do exitosamente`, response);
            alert(`✅ Paciente ${action}do exitosamente`);
            this.loadPatients(); // Recargar la lista
          } else {
            const errorMessage = this.errorHandler.getSafeErrorMessage(response, `${action} paciente`);
            alert(errorMessage);
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, `${action} paciente`);
          const errorMessage = this.errorHandler.getSafeErrorMessage(error, `${action} paciente`);
          alert(errorMessage);
        }
      });
    }
  }

  onConfirmDelete() {
    if (this.patientToDelete) {
      this.patientService.deletePatient(this.patientToDelete.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.logInfo('Paciente eliminado exitosamente', response);
            alert('✅ Paciente eliminado exitosamente');
            this.loadPatients();
            this.closeConfirmModal();
          } else {
            const errorMessage = this.errorHandler.getSafeErrorMessage(response, 'eliminar paciente');
            alert(errorMessage);
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'eliminar paciente');
          const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'eliminar paciente');
          alert(errorMessage);
        }
      });
    }
  }

  onCancelDelete() {
    this.closeConfirmModal();
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.patientToDelete = null;
  }

  // Método para verificar si el paciente tiene historia médica
  tieneHistoriaMedica(patient: Patient): boolean {
    // Verificar si existe historico_id en el objeto Patient
    if (patient.historico_id) {
      return true;
    }
    
    // Si no hay historico_id, verificar si hay datos médicos básicos
    // (esto es un fallback para casos donde el backend no incluye historico_id)
    return !!(patient.motivo_consulta || patient.diagnostico);
  }

  // Método mejorado para verificar historia médica consultando el servicio
  verificarHistoriaMedica(patient: Patient): void {
    if (patient.id) {
      this.historicoService.getLatestHistoricoByPaciente(patient.id).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Actualizar el paciente con el historico_id
            patient.historico_id = response.data.id;
          }
        },
        error: (error) => {
          this.errorHandler.logInfo('No se encontró historia médica para el paciente', { pacienteId: patient.id });
        }
      });
    }
  }

  // Método para obtener el tooltip del botón de historia
  getHistoriaTooltip(patient: Patient): string {
    return this.tieneHistoriaMedica(patient) 
      ? 'Editar historia médica existente' 
      : 'Crear nueva historia médica';
  }

  // Método para gestionar la historia médica
  gestionarHistoriaMedica(patient: Patient): void {
    // Navegar al componente de historia médica
    this.router.navigate(['/patients', patient.id, 'historia-medica']);
  }
}
