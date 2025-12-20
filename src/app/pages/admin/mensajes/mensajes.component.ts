import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MensajeService } from '../../../services/mensaje.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { MensajeDifusion, MensajeFormData, PacienteParaDifusion } from '../../../models/mensaje.model';
import { ProgramarMensajeComponent } from './programar-mensaje/programar-mensaje.component';
import { VerMensajeComponent } from './ver-mensaje/ver-mensaje.component';
import { ConfirmarEliminarComponent } from './confirmar-eliminar/confirmar-eliminar.component';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProgramarMensajeComponent, VerMensajeComponent, ConfirmarEliminarComponent],
  template: `
    <div class="mensajes-page">
      <div class="page-header">
        <h1>
          <i class="fas fa-envelope"></i>
          Mensajes de Difusión
        </h1>
        <button class="btn btn-new" (click)="openCreateModal()">
          <span>📧</span>
          Nuevo Mensaje
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Estado:</label>
          <select [(ngModel)]="filtroEstado" (change)="loadMensajes()">
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="programado">Programado</option>
            <option value="enviado">Enviado</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Tipo:</label>
          <select [(ngModel)]="filtroTipo" (change)="loadMensajes()">
            <option value="">Todos</option>
            <option value="general">General</option>
            <option value="urgente">Urgente</option>
            <option value="recordatorio">Recordatorio</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Buscar:</label>
          <input 
            type="text" 
            [(ngModel)]="busqueda" 
            (input)="loadMensajes()"
            placeholder="Buscar por título...">
        </div>
      </div>

      <!-- Lista de mensajes -->
      <div class="mensajes-list">
        <!-- Estado vacío -->
        <div *ngIf="!loading && mensajes.length === 0" class="empty-state">
          <div class="empty-state-content">
            <div class="empty-state-icon">📧</div>
            <div class="empty-state-title">No hay mensajes</div>
            <div class="empty-state-description">
              No se encontraron mensajes con los filtros aplicados.
            </div>
            <button class="btn btn-new" (click)="openCreateModal()">
              ➕ Crear Primer Mensaje
            </button>
          </div>
        </div>

        <div class="mensaje-card" *ngFor="let mensaje of mensajes">
          <div class="mensaje-header">
            <h3>{{ mensaje.titulo }}</h3>
            <div class="mensaje-actions">
              <button class="btn btn-sm" (click)="viewMensaje(mensaje)" title="Ver">
                👁️
              </button>
              <button class="btn btn-sm" (click)="editMensaje(mensaje)" title="Editar">
                ✏️
              </button>
              <button class="btn btn-sm" (click)="duplicateMensaje(mensaje)" title="Duplicar">
                📋
              </button>
              <button class="btn btn-sm btn-danger" (click)="deleteMensaje(mensaje)" title="Eliminar">
                🗑️
              </button>
            </div>
          </div>
          
          <div class="mensaje-content">
            <p>{{ mensaje.contenido | slice:0:150 }}{{ mensaje.contenido.length > 150 ? '...' : '' }}</p>
          </div>
          
          <div class="mensaje-meta">
            <div class="meta-item">
              <span class="label">Estado:</span>
              <span class="badge" [class]="'badge-' + mensaje.estado">
                {{ getEstadoLabel(mensaje.estado || 'borrador') }}
              </span>
            </div>
            <div class="meta-item">
              <span class="label">Tipo:</span>
              <span>{{ getTipoLabel(mensaje.tipo_mensaje || 'general') }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Destinatarios:</span>
              <span>{{ mensaje.total_destinatarios || 0 }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Fecha:</span>
              <span>{{ formatDate(mensaje.fecha_creacion) }}</span>
            </div>
          </div>

          <div class="mensaje-actions-bottom" *ngIf="mensaje.estado === 'borrador'">
            <button class="btn btn-success" (click)="sendMensaje(mensaje)">
              📤 Enviar Ahora
            </button>
            <button class="btn btn-warning" (click)="scheduleMensaje(mensaje)">
              ⏰ Programar
            </button>
          </div>
        </div>
      </div>

      <!-- Modal para crear/editar mensaje -->
      <div class="modal" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingMensaje ? 'Editar Mensaje' : 'Nuevo Mensaje' }}</h2>
            <button class="btn-close" (click)="closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            <form (ngSubmit)="saveMensaje()" #mensajeForm="ngForm">
              <div class="form-group">
                <label for="titulo">Título *</label>
                <input 
                  type="text" 
                  id="titulo"
                  [(ngModel)]="mensajeData.titulo"
                  name="titulo"
                  required
                  class="form-input"
                  placeholder="Título del mensaje">
              </div>

              <div class="form-group">
                <label for="contenido">Contenido *</label>
                <textarea 
                  id="contenido"
                  [(ngModel)]="mensajeData.contenido"
                  name="contenido"
                  required
                  rows="6"
                  class="form-textarea"
                  placeholder="Escribe el contenido del mensaje aquí..."></textarea>
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

              <div class="form-group">
                <label for="fecha_programado">Programar Envío (Opcional)</label>
                <input 
                  type="datetime-local" 
                  id="fecha_programado"
                  [(ngModel)]="mensajeData.fecha_programado"
                  name="fecha_programado"
                  class="form-input">
              </div>

              <!-- Selector de destinatarios -->
              <div class="form-group">
                <label>Destinatarios *</label>
                
                <!-- Destinatarios actuales (solo en modo edición) -->
                <div *ngIf="editingMensaje" class="destinatarios-actuales">
                  <div class="destinatarios-header">
                    <h4>Destinatarios Actuales ({{ destinatariosActuales.length }})</h4>
                    <button type="button" class="btn btn-sm" (click)="toggleEditDestinatarios()">
                      {{ editandoDestinatarios ? 'Cancelar' : 'Editar Destinatarios' }}
                    </button>
                  </div>
                  
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
                
                <!-- Sección para agregar nuevos destinatarios -->
                <div *ngIf="editandoDestinatarios" class="destinatarios-section">
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
                    <button type="button" class="btn btn-new" (click)="addNuevosDestinatarios()" [disabled]="getSelectedCount() === 0">
                      ➕ Agregar Seleccionados
                    </button>
                  </div>
                </div>
                
                <!-- Sección para nuevo mensaje (sin destinatarios actuales) -->
                <div *ngIf="!editingMensaje" class="destinatarios-section">
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
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-clear" (click)="closeModal()">
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-new" 
              (click)="saveMensaje()"
              [disabled]="!mensajeForm.valid || getSelectedCount() === 0">
              {{ editingMensaje ? 'Actualizar' : 'Crear' }} Mensaje
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de programación -->
    <app-programar-mensaje 
      *ngIf="showProgramarModal"
      [mensaje]="mensajeParaProgramar"
      [show]="showProgramarModal"
      (confirm)="onProgramarConfirm($event)"
      (cancel)="onProgramarCancel()">
    </app-programar-mensaje>

    <!-- Modal de ver mensaje -->
    <app-ver-mensaje 
      *ngIf="showVerModal"
      [mensaje]="mensajeParaVer"
      [show]="showVerModal"
      (close)="onVerClose()">
    </app-ver-mensaje>

    <!-- Modal de confirmación eliminar -->
    <app-confirmar-eliminar 
      *ngIf="showConfirmModal"
      [mensaje]="mensajeParaEliminar"
      [show]="showConfirmModal"
      (confirm)="onConfirmEliminar()"
      (cancel)="onCancelEliminar()">
    </app-confirmar-eliminar>
  `,
  styles: [`
    .mensajes-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin: 0;
      color: #2c3e50;
    }

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
      display: flex;
      gap: 2rem;
      align-items: center;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 600;
      color: #555;
      font-size: 0.9rem;
    }

    .filter-group select,
    .filter-group input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .mensajes-list {
      display: grid;
      gap: 1.5rem;
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

    .mensaje-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem;
      border-left: 4px solid #3498db;
    }

    .mensaje-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .mensaje-header h3 {
      margin: 0;
      color: #2c3e50;
      flex: 1;
    }

    .mensaje-actions {
      display: flex;
      gap: 0.5rem;
    }

    .mensaje-content {
      margin-bottom: 1rem;
    }

    .mensaje-content p {
      color: #666;
      line-height: 1.5;
      margin: 0;
    }

    .mensaje-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .meta-item .label {
      font-size: 0.8rem;
      color: #888;
      font-weight: 600;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-borrador { background: #f39c12; color: white; }
    .badge-programado { background: #3498db; color: white; }
    .badge-enviado { background: #27ae60; color: white; }

    .mensaje-actions-bottom {
      display: flex;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      margin: 0;
      color: #2c3e50;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #999;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #555;
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
    }

    .destinatarios-section {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1rem;
    }

    .destinatarios-filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
    }

    .destinatarios-filters input {
      flex: 1;
    }

    .quick-select {
      display: flex;
      gap: 0.5rem;
    }

    .pacientes-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 0.5rem;
    }

    .paciente-item {
      padding: 0.5rem;
      border-bottom: 1px solid #f5f5f5;
    }

    .paciente-item:last-child {
      border-bottom: none;
    }

    .paciente-checkbox {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
    }

    .paciente-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .paciente-info small {
      color: #666;
      font-size: 0.8rem;
    }

    .selection-summary {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 4px;
      text-align: center;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #eee;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-success {
      background: #27ae60;
      color: white;
    }

    .btn-warning {
      background: #f39c12;
      color: white;
    }

    .btn-danger {
      background: #e74c3c;
      color: white;
    }

    .btn-new {
      background: linear-gradient(135deg, #7A9CC6 0%, #5A7A9A 100%);
      color: white;
    }

    .btn-new:hover:not(:disabled) {
      background: linear-gradient(135deg, #8BA8D1 0%, #6A8AAA 100%);
      box-shadow: 0 4px 12px rgba(122, 156, 198, 0.3);
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Estilos para indicadores de carga y errores */
    .loading-pacientes {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 2rem;
      color: #666;
      font-size: 0.9rem;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      color: #dc2626;
      font-size: 0.9rem;
    }

    .btn-retry {
      background: #dc2626;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-retry:hover {
      background: #b91c1c;
    }

    .no-pacientes {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #666;
      font-style: italic;
    }

    /* Estilos para información adicional del paciente */
    .paciente-info small {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: #666;
    }

    .status-active {
      color: #059669;
      font-weight: 600;
    }

    .status-inactive {
      color: #dc2626;
      font-weight: 600;
    }

    /* Estilos para destinatarios actuales */
    .destinatarios-actuales {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
    }

    .destinatarios-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .destinatarios-header h4 {
      margin: 0;
      color: #1e293b;
      font-size: 1rem;
      font-weight: 600;
    }

    .destinatarios-list {
      max-height: 200px;
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
      padding: 1rem;
    }

    .loading-destinatarios {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
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

    /* Estilos para tabla de pacientes */
    .pacientes-table-container {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    }

    .pacientes-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .pacientes-table th {
      background: #f8fafc;
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
      color: #374151;
    }

    .pacientes-table tr:hover {
      background: #f8fafc;
    }

    .paciente-row {
      cursor: pointer;
    }

    .paciente-row:hover {
      background: #e0f2fe;
    }

    .pacientes-table input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
      cursor: pointer;
    }

    /* Estilo para campo de búsqueda */
    .form-input.searching {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1rem;
      padding-right: 2.5rem;
    }
  `]
})
export class MensajesComponent implements OnInit, OnDestroy {
  mensajes: MensajeDifusion[] = [];
  pacientes: PacienteParaDifusion[] = [];
  pacientesFiltrados: PacienteParaDifusion[] = [];
  loading = false;
  
  showModal = false;
  editingMensaje: MensajeDifusion | null = null;
  
  mensajeData: MensajeFormData = {
    titulo: '',
    contenido: '',
    tipo_mensaje: 'general',
    destinatarios: []
  };

  filtroEstado = '';
  filtroTipo = '';
  busqueda = '';
  busquedaPacientes = '';

  // Modal de programación
  showProgramarModal: boolean = false;
  mensajeParaProgramar: MensajeDifusion | null = null;
  
  // Modal de ver mensaje
  showVerModal: boolean = false;
  mensajeParaVer: MensajeDifusion | null = null;
  
  // Modal de confirmación eliminar
  showConfirmModal: boolean = false;
  mensajeParaEliminar: MensajeDifusion | null = null;
  
  // Nuevas propiedades para manejo de estado
  loadingPacientes = false;
  errorPacientes = '';
  searchTimeout: any = null;
  allSelected = false;
  
  // Propiedades para edición de destinatarios
  destinatariosActuales: PacienteParaDifusion[] = [];
  editandoDestinatarios = false;
  pacientesParaAgregar: PacienteParaDifusion[] = [];
  loadingDestinatarios = false;

  constructor(
    private mensajeService: MensajeService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.loadMensajes();
    this.loadPacientes();

           // Escuchar cambios de navegación para recargar cuando se regresa de edición
           this.router.events
             .pipe(filter(event => event instanceof NavigationEnd))
             .subscribe((event: any) => {
               if (event.url === '/admin/mensajes') {
                 console.log('Regresando a mensajes, recargando lista...');
                 this.loadMensajes();
               }
             });
         }

  ngOnDestroy() {
    // Cleanup si es necesario
  }

  loadMensajes() {
    this.loading = true;
    this.mensajeService.getMensajes().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.mensajes = response.data;
          
          // Verificar si hay mensajes con contadores inconsistentes
          const mensajesConProblemas = this.mensajes.filter((m: any) => 
            m.estado === 'borrador' && m.total_destinatarios === 0
          );
          
          if (mensajesConProblemas.length > 0) {
            console.log('Detectados mensajes con contadores inconsistentes, sincronizando...');
            this.mensajeService.sincronizarContadores().subscribe({
              next: (syncResponse: any) => {
                if (syncResponse.success) {
                  console.log('Contadores sincronizados exitosamente');
                  // Recargar mensajes después de sincronizar
                  this.mensajeService.getMensajes().subscribe({
                    next: (reloadResponse: any) => {
                      if (reloadResponse.success) {
                        this.mensajes = reloadResponse.data;
                      }
                    }
                  });
                }
              },
              error: (syncError: any) => {
                this.errorHandler.logError(syncError, 'sincronizar contadores');
              }
            });
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorHandler.logError(error, 'cargar mensajes');
      }
    });
  }

  loadPacientes(busqueda?: string) {
    this.loadingPacientes = true;
    this.errorPacientes = '';
    
    const filtros = busqueda ? { busqueda } : {};
    
    this.mensajeService.getPacientesParaDifusion(filtros).subscribe({
      next: (response) => {
        this.loadingPacientes = false;
        if (response.success) {
          // Mantener selecciones existentes
          const selectedIds = this.pacientesFiltrados.filter(p => p.seleccionado).map(p => p.id);
          
          this.pacientes = response.data;
          this.pacientesFiltrados = [...this.pacientes];
          
          // Restaurar selecciones
          this.pacientesFiltrados.forEach(paciente => {
            paciente.seleccionado = selectedIds.includes(paciente.id);
          });
          
          this.updateAllSelectedState();
          this.updateDestinatarios();
          this.errorPacientes = '';
        } else {
          this.errorPacientes = 'Error al cargar los pacientes';
          this.errorHandler.logError(response, 'cargar pacientes');
        }
      },
      error: (error) => {
        this.loadingPacientes = false;
        this.errorPacientes = 'Error de conexión al cargar pacientes';
        this.errorHandler.logError(error, 'cargar pacientes');
      }
    });
  }

  openCreateModal() {
    this.router.navigate(['/admin/mensajes/new']);
  }

  editMensaje(mensaje: MensajeDifusion) {
    this.router.navigate(['/admin/mensajes', mensaje.id, 'edit']);
  }

  closeModal() {
    this.showModal = false;
    this.editingMensaje = null;
  }

  saveMensaje() {
    if (this.editingMensaje) {
      this.mensajeService.actualizarMensaje(this.editingMensaje.id!, this.mensajeData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadMensajes();
            this.closeModal();
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'actualizar mensaje');
        }
      });
    } else {
      this.mensajeService.crearMensaje(this.mensajeData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadMensajes();
            this.closeModal();
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'crear mensaje');
        }
      });
    }
  }

  deleteMensaje(mensaje: MensajeDifusion) {
    this.mensajeParaEliminar = mensaje;
    this.showConfirmModal = true;
  }

  onConfirmEliminar() {
    if (this.mensajeParaEliminar) {
      this.mensajeService.eliminarMensaje(this.mensajeParaEliminar.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadMensajes();
            this.closeConfirmModal();
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'eliminar mensaje');
        }
      });
    }
  }

  onCancelEliminar() {
    this.closeConfirmModal();
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.mensajeParaEliminar = null;
  }

  sendMensaje(mensaje: MensajeDifusion) {
    const destinatarios = mensaje.total_destinatarios || 0;
    const tipoMensaje = this.getTipoLabel(mensaje.tipo_mensaje || 'general');
    
    const mensajeConfirmacion = `📤 Enviar Mensaje Inmediatamente\n\n` +
      `Título: "${mensaje.titulo}"\n` +
      `Tipo: ${tipoMensaje}\n` +
      `Destinatarios: ${destinatarios} paciente${destinatarios !== 1 ? 's' : ''}\n\n` +
      `⚠️ Este mensaje se enviará INMEDIATAMENTE a todos los destinatarios.\n\n` +
      `¿Deseas continuar?`;
    
    if (confirm(mensajeConfirmacion)) {
      this.mensajeService.enviarMensaje(mensaje.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadMensajes();
            alert(`✅ Mensaje enviado exitosamente\n\nEl mensaje "${mensaje.titulo}" ha sido enviado a ${destinatarios} destinatario${destinatarios !== 1 ? 's' : ''}.`);
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'enviar mensaje');
        }
      });
    }
  }

  scheduleMensaje(mensaje: MensajeDifusion) {
    this.mensajeParaProgramar = mensaje;
    this.showProgramarModal = true;
  }

  onProgramarConfirm(fechaISO: string) {
    if (this.mensajeParaProgramar) {
      this.mensajeService.programarMensaje(this.mensajeParaProgramar.id!, fechaISO).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadMensajes();
            this.closeProgramarModal();
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'programar mensaje');
        }
      });
    }
  }

  onProgramarCancel() {
    this.closeProgramarModal();
  }

  closeProgramarModal() {
    this.showProgramarModal = false;
    this.mensajeParaProgramar = null;
  }

  duplicateMensaje(mensaje: MensajeDifusion) {
    this.mensajeService.duplicarMensaje(mensaje.id!).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMensajes();
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'duplicar mensaje');
      }
    });
  }

  viewMensaje(mensaje: MensajeDifusion) {
    this.mensajeParaVer = mensaje;
    this.showVerModal = true;
  }

  onVerClose() {
    this.closeVerModal();
  }

  closeVerModal() {
    this.showVerModal = false;
    this.mensajeParaVer = null;
  }

  filterPacientes() {
    // Limpiar timeout anterior si existe
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Debounce: esperar 300ms antes de hacer la búsqueda
    this.searchTimeout = setTimeout(() => {
      if (!this.busquedaPacientes || this.busquedaPacientes.trim() === '') {
        // Si no hay búsqueda, cargar todos los pacientes del backend
        this.loadPacientes();
    } else {
        // Si hay búsqueda, usar el backend
        this.loadPacientes(this.busquedaPacientes.trim());
      }
    }, 300);
  }

  selectAllPacientes() {
    this.pacientesFiltrados.forEach(paciente => {
      paciente.seleccionado = true;
    });
    this.allSelected = true;
    this.updateDestinatarios();
  }

  toggleAllPacientes() {
    this.allSelected = !this.allSelected;
    this.pacientesFiltrados.forEach(paciente => {
      paciente.seleccionado = this.allSelected;
    });
    this.updateDestinatarios();
  }

  selectActivePacientes() {
    // Por ahora selecciona todos, pero se puede implementar lógica más específica
    this.selectAllPacientes();
  }

  clearSelection() {
    this.pacientesFiltrados.forEach(paciente => {
      paciente.seleccionado = false;
    });
    this.updateDestinatarios();
  }

  togglePaciente(paciente: PacienteParaDifusion) {
    paciente.seleccionado = !paciente.seleccionado;
    this.updateAllSelectedState();
    this.updateDestinatarios();
  }

  updateAllSelectedState() {
    const selectedCount = this.pacientesFiltrados.filter(p => p.seleccionado).length;
    this.allSelected = selectedCount === this.pacientesFiltrados.length && this.pacientesFiltrados.length > 0;
  }

  updateDestinatarios() {
    this.mensajeData.destinatarios = this.pacientesFiltrados
      .filter(p => p.seleccionado)
      .map(p => p.id);
  }

  getSelectedCount(): number {
    return this.pacientesFiltrados.filter(p => p.seleccionado).length;
  }

  getEstadoLabel(estado: string): string {
    const estados: { [key: string]: string } = {
      'borrador': 'Borrador',
      'programado': 'Programado',
      'enviado': 'Enviado'
    };
    return estados[estado] || estado;
  }

  getTipoLabel(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'general': 'General',
      'urgente': 'Urgente',
      'recordatorio': 'Recordatorio'
    };
    return tipos[tipo] || tipo;
  }

  // Métodos para gestión de destinatarios
  loadDestinatariosActuales(mensajeId: number) {
    this.loadingDestinatarios = true;
    this.mensajeService.getDestinatariosActuales(mensajeId).subscribe({
      next: (response) => {
        this.loadingDestinatarios = false;
        if (response.success) {
          this.destinatariosActuales = response.data;
        } else {
          this.errorHandler.logError(response, 'cargar destinatarios');
        }
      },
      error: (error) => {
        this.loadingDestinatarios = false;
        this.errorHandler.logError(error, 'cargar destinatarios');
      }
    });
  }

  toggleEditDestinatarios() {
    this.editandoDestinatarios = !this.editandoDestinatarios;
    if (this.editandoDestinatarios) {
      this.loadPacientes();
    }
  }

  removeDestinatario(pacienteId: number) {
    if (!this.editingMensaje?.id) return;
    
    this.mensajeService.eliminarDestinatario(this.editingMensaje.id, pacienteId).subscribe({
      next: (response) => {
        if (response.success) {
          this.destinatariosActuales = this.destinatariosActuales.filter(d => d.id !== pacienteId);
          this.updateDestinatarios();
        } else {
          this.errorHandler.logError(response, 'eliminar destinatario');
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'eliminar destinatario');
      }
    });
  }

  addNuevosDestinatarios() {
    if (!this.editingMensaje?.id) return;
    
    const seleccionados = this.pacientesFiltrados.filter(p => p.seleccionado);
    if (seleccionados.length === 0) return;
    
    const destinatariosIds = seleccionados.map(p => p.id);
    
    this.mensajeService.agregarDestinatarios(this.editingMensaje.id, destinatariosIds).subscribe({
      next: (response) => {
        if (response.success) {
          // Agregar a destinatarios actuales
          this.destinatariosActuales = [...this.destinatariosActuales, ...seleccionados];
          // Limpiar selecciones
          this.pacientesFiltrados.forEach(p => p.seleccionado = false);
          this.updateAllSelectedState();
          this.updateDestinatarios();
        } else {
          this.errorHandler.logError(response, 'agregar destinatarios');
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'agregar destinatarios');
      }
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
