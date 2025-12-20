import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConsultaService } from '../../../services/consulta.service';
import { MedicoService } from '../../../services/medico.service';
import { DateService } from '../../../services/date.service';
import { AuthService } from '../../../services/auth.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { ServiciosService, FinalizarConsultaRequest } from '../../../services/servicios.service';
import { ConsultaWithDetails, ConsultaFilters } from '../../../models/consulta.model';
import { Medico } from '../../../services/medico.service';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="consultas-page">
      <!-- Header -->
      <div class="page-header">
        <h1>
          <i class="fas fa-calendar-check"></i>
          Gestión de Consultas
        </h1>
        <button class="btn btn-new" (click)="navigateToNuevaConsulta()">
          ➕ Nueva Consulta
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="form-group">
            <label for="search">Buscar</label>
            <input
              type="text"
              id="search"
              class="form-control"
              placeholder="Buscar por paciente, médico o motivo..."
              [(ngModel)]="searchQuery"
              (input)="applyFilters()"
            />
          </div>
          <div class="form-group">
            <label for="estado">Estado</label>
            <select id="estado" class="form-control" [(ngModel)]="filters.estado" (change)="applyFilters()">
              <option value="">Todos los estados</option>
              <option value="agendada">Agendada</option>
              <option value="por_agendar">Por Agendar</option>
              <option value="cancelada">Cancelada</option>
              <option value="finalizada">Finalizada</option>
              <option value="reagendada">Reagendada</option>
              <option value="no_asistio">No Asistió</option>
            </select>
          </div>
          <div class="form-group">
            <label for="fecha">Fecha</label>
            <input
              type="date"
              id="fecha"
              class="form-control"
              [(ngModel)]="filters.fecha"
              (change)="applyFilters()"
            />
          </div>
          <div class="form-group" *ngIf="currentUser?.rol === 'administrador'">
            <label for="medico">Médico</label>
            <select id="medico" class="form-control" [(ngModel)]="filters.medico_id" (change)="applyFilters()">
              <option value="">Todos los médicos</option>
              <option *ngFor="let medico of medicos" [value]="medico.id">
                {{ medico.nombres }} {{ medico.apellidos }}
              </option>
            </select>
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-filter" (click)="applyFilters()">
            <span>🔍</span>
            Filtrar
          </button>
          <button class="btn btn-clear" (click)="clearFilters()">
            <span>🗑️</span>
            Limpiar
          </button>
        </div>
      </div>

      <!-- Tabla de Consultas -->
      <div class="consultas-container">
        <!-- Vista de tabla para desktop -->
        <div class="table-desktop">
          <div class="table-container">
            <table class="consultas-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Médico</th>
                  <th>Fecha y Hora</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Tipo</th>
                  <th>Motivo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
              <tr *ngIf="loading">
                <td colspan="8" class="loading">
                  <div class="spinner"></div>
                  <span>Cargando consultas...</span>
                </td>
              </tr>
              <tr *ngIf="!loading && consultas.length === 0">
                <td colspan="8" class="empty-state">
                  <div class="empty-state-content">
                    <div class="empty-state-icon">📅</div>
                    <div class="empty-state-title">No hay consultas</div>
                    <div class="empty-state-description">
                      No se encontraron consultas con los filtros aplicados.
                    </div>
                    <button class="btn btn-new" (click)="navigateToNuevaConsulta()">
                      ➕ Crear Primera Consulta
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngFor="let consulta of consultas">
                <td>
                  <div class="paciente-info">
                    <div class="paciente-nombre">{{ consulta.paciente_nombre }} {{ consulta.paciente_apellidos }}</div>
                    <div class="paciente-cedula">Cédula: {{ consulta.paciente_cedula }}</div>
                  </div>
                </td>
                <td>
                  <div class="medico-info">
                    <div class="medico-nombre">{{ consulta.medico_nombre }}</div>
                    <div class="especialidad">{{ consulta.especialidad_nombre }}</div>
                  </div>
                </td>
                <td>
                  <div class="fecha-hora">
                    <div class="fecha">{{ formatDate(consulta.fecha_pautada) }}</div>
                    <div class="hora">{{ formatTime(consulta.hora_pautada) }}</div>
                  </div>
                </td>
                <td>
                  <div class="estado-container">
                    <span class="estado-badge estado-{{ consulta.estado_consulta }}">
                      {{ getEstadoText(consulta.estado_consulta) }}
                    </span>
                    <span *ngIf="isConsultaExpirada(consulta)" class="expirada-badge" title="Consulta expirada">
                      ⏰ Expirada
                    </span>
                  </div>
                </td>
                <td>
                  <span class="prioridad-badge prioridad-{{ consulta.prioridad || 'normal' }}">
                    {{ getPrioridadText(consulta.prioridad) }}
                  </span>
                </td>
                <td>
                  <span class="tipo-badge">{{ getTipoConsultaText(consulta.tipo_consulta) }}</span>
                </td>
                <td>
                  <div class="motivo" [title]="consulta.motivo_consulta">
                    {{ consulta.motivo_consulta }}
                  </div>
                </td>
                <td>
                  <div class="actions-container">
                    <button class="action-btn view-btn" (click)="viewConsulta(consulta)" title="Ver detalles">
                      <span class="btn-icon">👁️</span>
                      <span class="btn-text">Ver</span>
                    </button>
                    <button 
                      *ngIf="consulta.estado_consulta === 'agendada' || consulta.estado_consulta === 'reagendada'"
                      class="action-btn edit-btn" 
                      [class.disabled]="isConsultaExpirada(consulta)"
                      [disabled]="isConsultaExpirada(consulta)"
                      (click)="editarConsulta(consulta)" 
                      [title]="isConsultaExpirada(consulta) ? 'No se puede editar consultas expiradas' : 'Editar'">
                      <span class="btn-icon">✏️</span>
                      <span class="btn-text">Editar</span>
                    </button>
                    <button 
                      *ngIf="(consulta.estado_consulta === 'agendada' || consulta.estado_consulta === 'reagendada' || consulta.estado_consulta === 'por_agendar') && canReagendarConsulta()"
                      class="action-btn btn-reschedule" 
                      (click)="reagendarConsulta(consulta)" 
                      title="Reagendar">
                      <span class="btn-icon">📅</span>
                      <span class="btn-text">Reagendar</span>
                    </button>
                    <button 
                      *ngIf="consulta.estado_consulta === 'agendada' || consulta.estado_consulta === 'reagendada'"
                      class="action-btn btn-cancel" 
                      (click)="cancelConsulta(consulta)" 
                      title="Cancelar">
                      <span class="btn-icon">❌</span>
                      <span class="btn-text">Cancelar</span>
                    </button>
                    <button 
                      *ngIf="consulta.estado_consulta === 'completada' && canFinalizarConsulta()"
                      class="action-btn btn-complete" 
                      (click)="finalizarConsulta(consulta)" 
                      title="Finalizar">
                      <span class="btn-icon">✅</span>
                      <span class="btn-text">Finalizar</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        <!-- Vista de tarjetas para móvil -->
        <div class="table-mobile">
          <!-- Estado vacío para móvil -->
          <div *ngIf="!loading && consultas.length === 0" class="empty-state-mobile">
            <div class="empty-state-content">
              <div class="empty-state-icon">📅</div>
              <div class="empty-state-title">No hay consultas</div>
              <div class="empty-state-description">
                No se encontraron consultas con los filtros aplicados.
              </div>
              <button class="btn btn-new" (click)="navigateToNuevaConsulta()">
                ➕ Crear Primera Consulta
              </button>
            </div>
          </div>
          <div class="consulta-card" *ngFor="let consulta of consultas">
            <div class="card-header">
              <div class="consulta-info">
                <h3 class="paciente-name">{{ consulta.paciente_nombre }} {{ consulta.paciente_apellidos }}</h3>
                <div class="consulta-meta">
                  <span class="consulta-id">ID: {{ consulta.id }}</span>
                  <span class="estado-badge" [class]="'estado-' + consulta.estado_consulta">
                    {{ getEstadoText(consulta.estado_consulta) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="card-body">
              <div class="info-row">
                <span class="label">Médico:</span>
                <span class="value">{{ consulta.medico_nombre }} {{ consulta.medico_apellidos }}</span>
              </div>
              <div class="info-row">
                <span class="label">Especialidad:</span>
                <span class="value">{{ consulta.especialidad_nombre }}</span>
              </div>
              <div class="info-row">
                <span class="label">Fecha y Hora:</span>
                <span class="value">{{ formatDate(consulta.fecha_pautada) }} {{ formatTime(consulta.hora_pautada) }}</span>
              </div>
              <div class="info-row">
                <span class="label">Prioridad:</span>
                <span class="prioridad-badge" [class]="'prioridad-' + consulta.prioridad">
                  {{ getPrioridadText(consulta.prioridad) }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">Tipo:</span>
                <span class="value">{{ consulta.tipo_consulta || 'Presencial' }}</span>
              </div>
              <div class="info-row" *ngIf="consulta.motivo_consulta">
                <span class="label">Motivo:</span>
                <span class="value">{{ consulta.motivo_consulta }}</span>
              </div>
            </div>
            
            <div class="card-actions">
              <button class="action-btn view-btn" (click)="viewConsulta(consulta)" title="Ver detalles">
                <i class="fas fa-eye"></i>
                Ver
              </button>
              <button class="action-btn edit-btn" (click)="editarConsulta(consulta)" title="Editar consulta">
                <i class="fas fa-edit"></i>
                Editar
              </button>
              <button 
                *ngIf="(consulta.estado_consulta === 'agendada' || consulta.estado_consulta === 'reagendada' || consulta.estado_consulta === 'por_agendar') && canReagendarConsulta()"
                class="action-btn warning-btn" 
                (click)="reagendarConsulta(consulta)" 
                title="Reagendar consulta">
                <i class="fas fa-calendar-alt"></i>
                Reagendar
              </button>
              <button 
                *ngIf="consulta.estado_consulta === 'agendada' || consulta.estado_consulta === 'reagendada'"
                class="action-btn danger-btn" 
                (click)="cancelConsulta(consulta)" 
                title="Cancelar consulta">
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button 
                *ngIf="consulta.estado_consulta === 'completada' && canFinalizarConsulta()"
                class="action-btn success-btn" 
                (click)="finalizarConsulta(consulta)" 
                title="Finalizar consulta">
                <i class="fas fa-check"></i>
                Finalizar
              </button>
            </div>
          </div>
        </div>

        <!-- Paginación -->
        <div class="pagination" *ngIf="totalPages > 1">
          <div class="pagination-info">
            Página {{ currentPage }} de {{ totalPages }}
          </div>
          <div class="pagination-controls">
            <button 
              class="pagination-btn" 
              (click)="goToPage(currentPage - 1)"
              [disabled]="currentPage === 1">
              Anterior
            </button>
            <button 
              *ngFor="let page of getPageNumbers()" 
              class="pagination-btn"
              [class.active]="page === currentPage"
              (click)="goToPage(page)">
              {{ page }}
            </button>
            <button 
              class="pagination-btn" 
              (click)="goToPage(currentPage + 1)"
              [disabled]="currentPage === totalPages">
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Ver Consulta -->
      <div class="modal-overlay" *ngIf="showVerModal" (click)="closeVerModal()">
        <div class="modal-content modal-large" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Detalles de la Consulta</h3>
            <button class="close-btn" (click)="closeVerModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="consulta-details" *ngIf="selectedConsulta">
              <div class="detail-section">
                <h4>Información del Paciente</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>Nombre Completo</label>
                    <span>{{ selectedConsulta.paciente_nombre }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Cédula</label>
                    <span>{{ selectedConsulta.paciente_cedula }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Información del Médico</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>Médico</label>
                    <span>{{ selectedConsulta.medico_nombre }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Especialidad</label>
                    <span>{{ selectedConsulta.especialidad_nombre }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Detalles de la Consulta</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>Fecha</label>
                    <span>{{ formatDate(selectedConsulta.fecha_pautada) }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Hora</label>
                    <span>{{ formatTime(selectedConsulta.hora_pautada) }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Estado</label>
                    <span class="estado-badge estado-{{ selectedConsulta.estado_consulta }}">
                      {{ getEstadoText(selectedConsulta.estado_consulta) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <label>Prioridad</label>
                    <span class="prioridad-badge prioridad-{{ selectedConsulta.prioridad || 'normal' }}">
                      {{ getPrioridadText(selectedConsulta.prioridad) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <label>Tipo de Consulta</label>
                    <span>{{ getTipoConsultaText(selectedConsulta.tipo_consulta) }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Motivo de la Consulta</h4>
                <div class="motivo-content">
                  {{ selectedConsulta.motivo_consulta }}
                </div>
              </div>

              <div class="detail-section" *ngIf="selectedConsulta.diagnostico_preliminar">
                <h4>Diagnóstico Preliminar</h4>
                <div class="motivo-content">
                  {{ selectedConsulta.diagnostico_preliminar }}
                </div>
              </div>

              <div class="detail-section" *ngIf="selectedConsulta.observaciones">
                <h4>Observaciones</h4>
                <div class="motivo-content">
                  {{ selectedConsulta.observaciones }}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-clear" (click)="closeVerModal()">Cerrar</button>
          </div>
        </div>
      </div>


      <!-- Modal Cancelar Consulta -->
      <div class="modal-overlay" *ngIf="showCancelarModal" (click)="closeCancelarModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Cancelar Consulta</h3>
            <button class="close-btn" (click)="closeCancelarModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="consulta-info" *ngIf="selectedConsulta">
              <h4>{{ selectedConsulta.paciente_nombre }}</h4>
              <p><strong>Fecha:</strong> {{ formatDate(selectedConsulta.fecha_pautada) }}</p>
              <p><strong>Hora:</strong> {{ formatTime(selectedConsulta.hora_pautada) }}</p>
            </div>

            <div class="form-group">
              <label>Motivo de la Cancelación *</label>
              <div class="radio-group">
                <div class="radio-option">
                  <input 
                    type="radio" 
                    id="motivo1" 
                    name="motivoCancelacion" 
                    value="paciente_no_asistio"
                    [(ngModel)]="motivoCancelacion">
                  <label for="motivo1" class="radio-label">Paciente no asistió</label>
                </div>
                <div class="radio-option">
                  <input 
                    type="radio" 
                    id="motivo2" 
                    name="motivoCancelacion" 
                    value="medico_indisponible"
                    [(ngModel)]="motivoCancelacion">
                  <label for="motivo2" class="radio-label">Médico no disponible</label>
                </div>
                <div class="radio-option">
                  <input 
                    type="radio" 
                    id="motivo3" 
                    name="motivoCancelacion" 
                    value="emergencia"
                    [(ngModel)]="motivoCancelacion">
                  <label for="motivo3" class="radio-label">Emergencia médica</label>
                </div>
                <div class="radio-option">
                  <input 
                    type="radio" 
                    id="motivo4" 
                    name="motivoCancelacion" 
                    value="otro"
                    [(ngModel)]="motivoCancelacion">
                  <label for="motivo4" class="radio-label">Otro motivo</label>
                </div>
              </div>
            </div>

            <div class="form-group" *ngIf="motivoCancelacion === 'otro'">
              <label for="detalles">Detalles del Motivo *</label>
              <textarea
                id="detalles"
                class="form-control textarea"
                [(ngModel)]="detallesCancelacion"
                placeholder="Especifique el motivo de la cancelación..."
                required
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-clear" (click)="closeCancelarModal()">Cancelar</button>
            <button 
              class="btn btn-danger" 
              (click)="confirmarCancelar()"
              [disabled]="!motivoCancelacion || (motivoCancelacion === 'otro' && !detallesCancelacion.trim()) || isSubmitting">
              <span *ngIf="isSubmitting" class="btn-icon">⏳</span>
              <span *ngIf="!isSubmitting" class="btn-icon">🚫</span>
              <span class="btn-text">{{isSubmitting ? 'Cancelando...' : 'Cancelar Consulta'}}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Reagendar Consulta -->
      <div class="modal-overlay" *ngIf="showReagendarModal" (click)="closeReagendarModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Reagendar Consulta</h3>
            <button class="close-btn" (click)="closeReagendarModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="consulta-info" *ngIf="selectedConsulta">
              <h4>{{ selectedConsulta.paciente_nombre }}</h4>
              <p><strong>Fecha actual:</strong> {{ formatDate(selectedConsulta.fecha_pautada) }}</p>
              <p><strong>Hora actual:</strong> {{ formatTime(selectedConsulta.hora_pautada) }}</p>
            </div>

            <div class="form-group">
              <label for="nuevaFecha">Nueva Fecha *</label>
              <input
                type="date"
                id="nuevaFecha"
                class="form-control"
                [(ngModel)]="nuevaFecha"
                [min]="getTodayDate()"
                required
              />
            </div>

            <div class="form-group">
              <label for="nuevaHora">Nueva Hora *</label>
              <input
                type="time"
                id="nuevaHora"
                class="form-control"
                [(ngModel)]="nuevaHora"
                required
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-clear" (click)="closeReagendarModal()">Cancelar</button>
            <button 
              class="btn btn-new" 
              (click)="confirmarReagendar()"
              [disabled]="!nuevaFecha || !nuevaHora">
              Reagendar
            </button>
          </div>
        </div>
      </div>


    </div>
  `,
  styles: [`
    /* Estilos completos para el componente de consultas */
    .consultas-page {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      background: #f8fafc;
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .btn-primary {
      background: #7A9CC6;
      color: white;
      box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
      font-weight: 500;
    }

    .btn-primary:hover {
      background: #C2185B;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(233, 30, 99, 0.4);
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
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-info {
      background: #06b6d4;
      color: white;
    }

    .btn-info:hover {
      background: #0891b2;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-warning:hover {
      background: #d97706;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid #d1d5db;
      color: #374151;
    }

    .btn-outline:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
    }

    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1rem;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn:disabled:hover {
      transform: none;
    }

    .filters-section {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr auto;
      gap: 1rem;
      align-items: end;
    }

    .filter-actions {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
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
      transition: border-color 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .btn-filter {
      background: #10b981;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-filter:hover {
      background: #059669;
    }

    .btn-clear {
      background: #6b7280;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-clear:hover {
      background: #4b5563;
    }

    .consultas-container {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .table-container {
      overflow-x: auto;
    }

    .consultas-table {
      width: 100%;
      border-collapse: collapse;
    }

    .consultas-table th {
      background: #f8fafc;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .consultas-table td {
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
      color: #374151;
    }

    .consultas-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .consultas-table tr:nth-child(odd) {
      background-color: #ffffff;
    }

    .consultas-table tr:hover {
      background: #e0f2fe;
    }

    .paciente-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .paciente-nombre {
      font-weight: 600;
      color: #1e293b;
    }

    .paciente-cedula {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .medico-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .medico-nombre {
      font-weight: 600;
      color: #1e293b;
    }

    .especialidad {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .fecha-hora {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .fecha {
      font-weight: 600;
      color: #1e293b;
    }

    .hora {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .estado-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .estado-agendada {
      background: #dbeafe;
      color: #1e40af;
    }

    .estado-por_agendar {
      background: #fef3c7;
      color: #92400e;
    }

    .estado-cancelada {
      background: #fee2e2;
      color: #dc2626;
    }

    .estado-finalizada {
      background: #d1fae5;
      color: #059669;
    }

    .estado-reagendada {
      background: #e0e7ff;
      color: #3730a3;
    }

    .estado-no_asistio {
      background: #f3f4f6;
      color: #374151;
    }

    .estado-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-start;
    }

    .expirada-badge {
      background: #fef3c7;
      color: #92400e;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.625rem;
      font-weight: 500;
      border: 1px solid #f59e0b;
    }


    .prioridad-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .prioridad-baja {
      background: #f3f4f6;
      color: #6b7280;
    }

    .prioridad-normal {
      background: #dbeafe;
      color: #1e40af;
    }

    .prioridad-alta {
      background: #fef3c7;
      color: #92400e;
    }

    .prioridad-urgente {
      background: #fee2e2;
      color: #dc2626;
    }

    .tipo-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: #e0e7ff;
      color: #3730a3;
    }

    .motivo {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions-container {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      min-width: 100px;
      align-items: center;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.7rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      width: 90px;
      justify-content: center;
    }

    .action-btn .btn-icon {
      width: 0.875rem;
      height: 0.875rem;
      font-size: 0.75rem;
    }

    .action-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f3f4f6;
      color: #9ca3af;
      border-color: #e5e7eb;
    }

    .action-btn.disabled:hover {
      background: #f3f4f6;
      color: #9ca3af;
      transform: none;
      box-shadow: none;
    }

    .btn-view {
      background: #dbeafe;
      color: #1e40af;
    }

    .btn-view:hover {
      background: #bfdbfe;
    }

    .btn-edit {
      background: #fef3c7;
      color: #92400e;
    }

    .btn-edit:hover {
      background: #fde68a;
    }

    .btn-cancel {
      background: #fee2e2;
      color: #dc2626;
    }

    .btn-cancel:hover {
      background: #fecaca;
    }

    .btn-complete {
      background: #d1fae5;
      color: #059669;
    }

    .btn-complete:hover {
      background: #a7f3d0;
    }

    .btn-reschedule {
      background: #e0e7ff;
      color: #3730a3;
    }

    .btn-reschedule:hover {
      background: #c7d2fe;
    }


    .btn-info {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-info:hover {
      background: #e5e7eb;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: #f8fafc;
    }

    .pagination-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .pagination-controls {
      display: flex;
      gap: 0.5rem;
    }

    .pagination-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
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

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3rem;
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-large {
      max-width: 700px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .modal-footer .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      text-decoration: none;
    }

    .modal-footer .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Estilos para modal Ver Consulta */
    .modal-large {
      max-width: 700px;
    }

    .consulta-details {
      max-height: 60vh;
      overflow-y: auto;
    }

    .detail-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
    }

    .detail-section h4 {
      margin: 0 0 1rem 0;
      color: #1e293b;
      font-size: 1rem;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-item label {
      font-weight: 600;
      color: #374151;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-item span {
      color: #1e293b;
      font-size: 0.875rem;
    }

    .motivo-content {
      background: white;
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      color: #374151;
      line-height: 1.5;
    }

    /* Estilos para formularios mejorados */
    .textarea {
      resize: vertical;
      min-height: 80px;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.375rem;
      transition: background-color 0.2s ease;
    }

    .radio-option:hover {
      background: #f3f4f6;
    }

    .radio-option input[type="radio"] {
      margin: 0;
    }

    .radio-label {
      font-size: 0.875rem;
      color: #374151;
      font-weight: 500;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }
    
    .btn-danger:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    
    .btn-icon {
      font-size: 16px;
    }
    
    .btn-text {
      font-weight: 500;
    }

    .btn-success {
      background: #059669;
      color: white;
    }

    .btn-success:hover {
      background: #047857;
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
    .consulta-card {
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

    .consulta-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .paciente-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .consulta-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .consulta-id {
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
      .consultas-page {
        padding: 1rem;
      }

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

      .consulta-meta {
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

      .modal-content {
        margin: 1rem;
        max-width: none;
      }
    }

    @media (max-width: 480px) {
      .consultas-page {
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

      .paciente-name {
        font-size: 1rem;
      }

      .action-btn {
        font-size: 0.7rem;
        padding: 0.375rem 0.5rem;
      }
    }
  `]
})
export class ConsultasComponent implements OnInit {
  consultas: ConsultaWithDetails[] = [];
  loading = false;
  searchQuery = '';
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 10;

  // Lista de médicos para filtros
  medicos: Medico[] = [];
  especialidades: any[] = [];
  selectedConsulta: ConsultaWithDetails | null = null;

  // Propiedades para filtros
  filters: ConsultaFilters = {
    estado: '',
    fecha: '',
    medico_id: undefined
  };

  // Propiedades para autenticación
  currentUser: any = null;

  constructor(
    private consultaService: ConsultaService,
    private medicoService: MedicoService,
    private dateService: DateService,
    private authService: AuthService,
    private serviciosService: ServiciosService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  // Propiedades para modales
  showVerModal = false;
  showCancelarModal = false;
  showReagendarModal = false;

  // Propiedades para formularios de modales
  motivoCancelacion = '';
  detallesCancelacion = '';
  nuevaFecha = '';
  nuevaHora = '';
  isSubmitting = false;

  // Lista de médicos para filtros (ya declarado arriba)

  ngOnInit(): void {
    // Cargar usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    this.loadConsultas();
    this.loadMedicos();
    this.loadEspecialidades();
  }

  loadConsultas(): void {
    this.loading = true;
    // Mapear filtros del frontend al formato esperado por el backend
    const searchFilters: any = {
      medico_id: this.filters.medico_id,
      estado_consulta: this.filters.estado,
      fecha_desde: this.filters.fecha,
      fecha_hasta: this.filters.fecha,
      search: this.searchQuery
    };
    
    // Si el usuario es médico, filtrar automáticamente por su médico_id
    if (this.currentUser?.rol === 'medico' && this.currentUser?.medico_id) {
      searchFilters.medico_id = this.currentUser.medico_id;
      console.log('🔍 Filtrando consultas por médico_id del usuario:', this.currentUser.medico_id);
    }
    
    // Limpiar filtros vacíos
    Object.keys(searchFilters).forEach(key => {
      if (searchFilters[key] === '' || searchFilters[key] === undefined || searchFilters[key] === null) {
        delete searchFilters[key];
      }
    });
    
    this.consultaService.getConsultas(searchFilters)
      .subscribe({
        next: (response) => {
          // Mapear datos para asegurar que se muestre el nombre correcto de la especialidad
          this.consultas = response.data.map(consulta => ({
            ...consulta,
            // Si especialidad_nombre contiene la descripción, mapear al nombre correcto
            especialidad_nombre: this.getEspecialidadNombre(consulta)
          }));
          this.totalPages = 1; // Simplificado por ahora
          this.loading = false;
        },
        error: (error) => {
          this.errorHandler.logError(error, 'cargar consultas');
          this.loading = false;
          const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'cargar consultas');
          alert(errorMessage);
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

  loadEspecialidades(): void {
    // Importar el servicio de especialidades dinámicamente
    import('../../../services/especialidad.service').then(({ EspecialidadService }) => {
      const especialidadService = new EspecialidadService(this.http);
      especialidadService.getAllEspecialidades().subscribe({
        next: (response) => {
          this.especialidades = response.data || [];
          console.log('🏥 Especialidades cargadas:', this.especialidades.length);
        },
        error: (error) => {
          this.errorHandler.logError(error, 'cargar especialidades');
        }
      });
    });
  }

  getEspecialidadNombre(consulta: ConsultaWithDetails): string {
    // Si ya tiene especialidad_nombre, verificar si es el nombre correcto
    if (consulta.especialidad_nombre) {
      // Buscar en la lista de especialidades para ver si coincide con el nombre
      const especialidad = this.especialidades.find(esp => 
        esp.nombre_especialidad === consulta.especialidad_nombre
      );
      
      if (especialidad) {
        // Si coincide con el nombre, devolverlo
        return consulta.especialidad_nombre;
      } else {
        // Si no coincide, buscar por descripción
        const especialidadPorDescripcion = this.especialidades.find(esp => 
          esp.descripcion === consulta.especialidad_nombre
        );
        
        if (especialidadPorDescripcion) {
          return especialidadPorDescripcion.nombre_especialidad;
        }
      }
    }
    
    // Si no encuentra nada, devolver el valor original
    return consulta.especialidad_nombre || 'Sin especialidad';
  }

  navigateToNuevaConsulta(): void {
    console.log('🔄 Navegando a Nueva Consulta...');
    this.router.navigate(['/admin/consultas/nueva']).then(success => {
      if (success) {
        console.log('✅ Navegación exitosa');
      } else {
        console.error('❌ Error en la navegación');
      }
    }).catch(error => {
      console.error('❌ Error de navegación:', error);
    });
  }


  applyFilters(): void {
    this.currentPage = 1;
    this.loadConsultas();
  }

  clearFilters(): void {
    this.filters = {
      estado: '',
      fecha: '',
      medico_id: undefined
    };
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadConsultas();
  }


  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadConsultas();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Métodos para acciones de consultas
  viewConsulta(consulta: ConsultaWithDetails): void {
    this.selectedConsulta = consulta;
    this.showVerModal = true;
  }

  editarConsulta(consulta: ConsultaWithDetails): void {
    // Verificar si la consulta está expirada
    if (this.isConsultaExpirada(consulta)) {
      alert('⚠️ Consulta expirada\n\nNo se puede editar una consulta que ya pasó. Use la opción "Reagendar" para cambiar la fecha y hora.');
      return;
    }
    
    // Navegar al componente de edición
    this.router.navigate(['/admin/consultas', consulta.id, 'editar']);
  }


  // Método para verificar si una consulta está expirada
  isConsultaExpirada(consulta: ConsultaWithDetails): boolean {
    if (!consulta.fecha_pautada || !consulta.hora_pautada) {
      return false;
    }

    const fechaHoraConsulta = new Date(`${consulta.fecha_pautada}T${consulta.hora_pautada}`);
    const ahora = new Date();
    
    // Una consulta está expirada si la fecha/hora ya pasó
    return fechaHoraConsulta < ahora;
  }

  reagendarConsulta(consulta: ConsultaWithDetails): void {
    this.selectedConsulta = consulta;
    this.nuevaFecha = consulta.fecha_pautada;
    this.nuevaHora = consulta.hora_pautada;
    this.showReagendarModal = true;
  }

  finalizarConsulta(consulta: ConsultaWithDetails): void {
    // Navegar al componente de finalización
    this.router.navigate(['/admin/consultas', consulta.id, 'finalizar']);
  }

  canFinalizarConsulta(): boolean {
    return this.currentUser?.rol === 'secretaria' || this.currentUser?.rol === 'administrador';
  }

  canReagendarConsulta(): boolean {
    return this.currentUser?.rol === 'secretaria' || this.currentUser?.rol === 'administrador';
  }

  cancelConsulta(consulta: ConsultaWithDetails): void {
    this.selectedConsulta = consulta;
    this.motivoCancelacion = '';
    this.detallesCancelacion = '';
    this.isSubmitting = false; // Asegurar que esté en false al abrir
    this.showCancelarModal = true;
    console.log('🔍 Modal de cancelación abierto, isSubmitting:', this.isSubmitting);
  }

  // Métodos para cerrar modales
  closeVerModal(): void {
    this.showVerModal = false;
    this.selectedConsulta = null;
  }


  closeCancelarModal(): void {
    this.showCancelarModal = false;
    this.motivoCancelacion = '';
    this.detallesCancelacion = '';
    this.isSubmitting = false; // Resetear al cerrar
    this.selectedConsulta = null;
    console.log('🔍 Modal de cancelación cerrado, isSubmitting:', this.isSubmitting);
  }

  closeReagendarModal(): void {
    this.showReagendarModal = false;
    this.nuevaFecha = '';
    this.nuevaHora = '';
    this.selectedConsulta = null;
  }


  confirmarCancelar(): void {
    if (this.isSubmitting) return;
    
    if (!this.selectedConsulta || !this.motivoCancelacion) {
      return;
    }

    let motivoFinal = this.motivoCancelacion;
    if (this.motivoCancelacion === 'otro' && this.detallesCancelacion.trim()) {
      motivoFinal = this.detallesCancelacion;
    }

    this.isSubmitting = true;

    this.consultaService.cancelarConsulta(this.selectedConsulta.id, motivoFinal).subscribe({
      next: (response) => {
        console.log('Consulta cancelada:', response);
        this.closeCancelarModal();
        this.loadConsultas();
        alert('⚠️ Consulta cancelada exitosamente\n\nLa consulta ha sido cancelada y el paciente será notificado. Puede reagendar la cita si es necesario.');
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cancelar consulta');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'cancelar consulta');
        alert(errorMessage);
        this.isSubmitting = false;
      }
    });
  }

  confirmarReagendar(): void {
    if (!this.selectedConsulta || !this.nuevaFecha || !this.nuevaHora) {
      return;
    }

    console.log('🔄 Reagendando consulta:', {
      consultaId: this.selectedConsulta.id,
      nuevaFecha: this.nuevaFecha,
      nuevaHora: this.nuevaHora
    });

    this.consultaService.reagendarConsulta(
      this.selectedConsulta.id!, 
      this.nuevaFecha, 
      this.nuevaHora
    ).subscribe({
      next: (response) => {
        console.log('✅ Consulta reagendada exitosamente:', response);
        this.closeReagendarModal();
        this.loadConsultas();
        alert('✅ Consulta reagendada exitosamente\n\nLa consulta ha sido reagendada y se ha enviado una notificación al paciente con la nueva fecha y hora.');
      },
      error: (error) => {
        this.errorHandler.logError(error, 'reagendar consulta');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'reagendar consulta');
        alert(errorMessage);
      }
    });
  }

  // Métodos de utilidad - usando DateService para Venezuela
  formatDate(dateString: string): string {
    return this.dateService.formatDate(dateString);
  }

  formatTime(timeString: string): string {
    return this.dateService.formatTime(timeString);
  }

  getEstadoText(estado: string): string {
    const estados: { [key: string]: string } = {
      'agendada': 'Agendada',
      'por_agendar': 'Por Agendar',
      'cancelada': 'Cancelada',
      'finalizada': 'Finalizada',
      'reagendada': 'Reagendada',
      'no_asistio': 'No Asistió'
    };
    return estados[estado] || estado;
  }

  getPrioridadText(prioridad: string): string {
    const prioridades: { [key: string]: string } = {
      'baja': 'Baja',
      'normal': 'Normal',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return prioridades[prioridad] || 'Normal';
  }

  getTipoConsultaText(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'control': 'Control',
      'seguimiento': 'Seguimiento',
      'primera_vez': 'Primera Vez',
      'emergencia': 'Emergencia'
    };
    return tipos[tipo] || tipo;
  }

  getTodayDate(): string {
    return this.dateService.getCurrentDateISO();
  }
}
