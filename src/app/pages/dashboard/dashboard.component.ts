import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { RemisionService } from '../../services/remision.service';
import { AuthService } from '../../services/auth.service';
import { ConsultaService } from '../../services/consulta.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { FinalizarConsultaModalComponent } from '../../components/finalizar-consulta-modal/finalizar-consulta-modal.component';
import { ServiciosService, FinalizarConsultaRequest } from '../../services/servicios.service';
import { Patient } from '../../models/patient.model';
import { User } from '../../models/user.model';
import { ConsultaWithDetails } from '../../models/consulta.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FinalizarConsultaModalComponent],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <p *ngIf="currentUser?.rol === 'administrador'">Panel de administración - Todos los pacientes</p>
        <p *ngIf="currentUser?.rol === 'medico'">Mis pacientes y consultas médicas</p>
        <p *ngIf="currentUser?.rol === 'secretaria'">Gestión de consultas y pacientes - Secretaría</p>
        <p *ngIf="!currentUser">Gestion de pacientes y consultas médicas</p>
        <p class="doctor-info" *ngIf="currentUser">
          <span *ngIf="currentUser.rol === 'administrador'">
            👑 {{ getDoctorFullName() || currentUser.username || 'Administrador' }}
            <span *ngIf="currentUser.especialidad" class="specialty">- {{ currentUser.especialidad }}</span>
          </span>
          <span *ngIf="currentUser.rol === 'medico'">
            👨‍⚕️ {{ getDoctorFullName() || currentUser.username || 'Médico' }}
            <span *ngIf="currentUser.especialidad" class="specialty">- {{ currentUser.especialidad }}</span>
          </span>
          <span *ngIf="currentUser.rol === 'secretaria'">
            📋 Secretaría
          </span>
        </p>
        <p class="info-note" *ngIf="currentUser?.rol === 'medico' && !currentUser?.medico_id">
          ⚠️ ID de médico no disponible - mostrando todos los pacientes
        </p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H16c-.8 0-1.54.5-1.85 1.26L13.5 12H11v8h2v-6h2.5l1.5 6H20zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9.5C9 8.12 7.88 7 6.5 7S4 8.12 4 9.5V15h-.5v7h4z"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ totalPatients }}</h3>
            <p>Total Pacientes</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ femalePatients }}</h3>
            <p>Pacientes Femeninas</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ malePatients }}</h3>
            <p>Pacientes Masculinos</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ recentPatients }}</h3>
            <p>Pacientes Recientes</p>
          </div>
        </div>
      </div>

      <!-- Sección de Consultas del Día -->
      <div class="consultas-section">
        <div class="section-header">
          <h3 class="section-title">
            📅 Consultas del Día
            <span class="count-badge" *ngIf="consultasDelDia.length > 0">{{ consultasDelDia.length }}</span>
          </h3>
          <button class="btn-refresh" (click)="refreshConsultas()" [disabled]="loadingConsultas">
            <span [class.spinner]="loadingConsultas"></span>
            {{ loadingConsultas ? 'Cargando...' : '🔄 Actualizar' }}
          </button>
        </div>

        <div class="consultas-grid" *ngIf="!loadingConsultas">
          <div *ngIf="consultasDelDia.length === 0" class="empty-state">
            <div class="empty-state-icon">📅</div>
            <div class="empty-state-title">No hay consultas programadas para hoy</div>
            <div class="empty-state-description">No se encontraron consultas médicas para el día de hoy.</div>
          </div>

          <div *ngFor="let consulta of consultasDelDia" class="consulta-card" [class]="getConsultaCardClass(consulta)">
            <div class="consulta-header">
              <div class="hora">{{ formatTime(consulta.hora_pautada) }}</div>
              <div class="estado" [class]="'estado-' + consulta.estado_consulta">
                {{ getEstadoText(consulta.estado_consulta) }}
              </div>
            </div>
            
            <div class="consulta-body">
              <div class="paciente-info">
                <div class="paciente-nombre">{{ consulta.paciente_nombre }} {{ consulta.paciente_apellidos }}</div>
                <div class="paciente-cedula" *ngIf="consulta.paciente_cedula">Cédula: {{ consulta.paciente_cedula }}</div>
              </div>
              
              <div class="medico-info">
                <div class="medico-nombre">{{ consulta.medico_nombre }} {{ consulta.medico_apellidos }}</div>
                <div class="medico-especialidad" *ngIf="consulta.especialidad_nombre">{{ consulta.especialidad_nombre }}</div>
              </div>
              
              <div class="motivo" *ngIf="consulta.motivo_consulta">
                {{ consulta.motivo_consulta }}
              </div>
              
              <div class="tipo-consulta" *ngIf="consulta.tipo_consulta">
                <span class="tipo-badge">{{ getTipoConsultaText(consulta.tipo_consulta) }}</span>
              </div>
            </div>
            
            <div class="consulta-actions">
              <button class="btn btn-view" (click)="verConsulta(consulta)">
                👁️ Ver
              </button>
              <button class="btn btn-history" (click)="addHistoria(consulta)"
                      *ngIf="(consulta.estado_consulta === 'agendada' || consulta.estado_consulta === 'reagendada') && currentUser?.rol === 'medico'">
                📝 Historia Paciente
              </button>
              <button class="btn btn-success" (click)="finalizarConsulta(consulta)" 
                      *ngIf="consulta.estado_consulta === 'completada' && canFinalizarConsulta()">
                ✅ Finalizar
              </button>
              <button class="btn btn-warning" (click)="reagendarConsulta(consulta)"
                      *ngIf="(consulta.estado_consulta === 'agendada' || consulta.estado_consulta === 'reagendada' || consulta.estado_consulta === 'por_agendar') && canReagendarConsulta()">
                📅 Reagendar
              </button>
              <button class="btn btn-danger" (click)="cancelarConsulta(consulta)"
                      *ngIf="consulta.estado_consulta === 'agendada' || consulta.estado_consulta === 'reagendada' || consulta.estado_consulta === 'por_agendar'">
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="loadingConsultas" class="loading-consultas">
          <div class="spinner"></div>
          <p>Cargando consultas del día...</p>
        </div>
      </div>

      <!-- Accesos Directos - Solo para administradores -->
      <div class="quick-actions" *ngIf="currentUser?.rol === 'administrador'">
        <h3>Accesos Directos</h3>
        <div class="actions-grid">
          <a routerLink="/patients" class="action-card">
            <div class="action-icon pacientes">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H16c-.8 0-1.54.5-1.85 1.26L13.5 12H11v8h2v-6h2.5l1.5 6H20zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9.5C9 8.12 7.88 7 6.5 7S4 8.12 4 9.5V15h-.5v7h4z"/>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Gestionar Pacientes</div>
              <div class="action-description">Ver, agregar y editar pacientes</div>
            </div>
          </a>

          <a routerLink="/admin/medicos" class="action-card">
            <div class="action-icon medicos">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Gestionar Médicos</div>
              <div class="action-description">Administrar médicos y especialidades</div>
            </div>
          </a>
          
          <a routerLink="/admin/consultas" class="action-card">
            <div class="action-icon consultas">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Gestión de Consultas</div>
              <div class="action-description">Administrar citas y consultas</div>
            </div>
          </a>
          
          <a routerLink="/admin/remisiones" class="action-card">
            <div class="action-icon remisiones">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Gestionar Remisiones</div>
              <div class="action-description">Administrar remisiones entre médicos</div>
            </div>
          </a>
          
          <a routerLink="/admin/informes-medicos" class="action-card">
            <div class="action-icon informes">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                <path d="M8,12H16V14H8V12M8,16H13V18H8V16"/>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Informes Médicos</div>
              <div class="action-description">Crear y gestionar informes con firma digital</div>
            </div>
          </a>
          
          <a routerLink="/admin/finanzas" class="action-card" *ngIf="currentUser?.rol === 'finanzas' || currentUser?.rol === 'administrador'">
            <div class="action-icon finanzas">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Panel de Finanzas</div>
              <div class="action-description">Gestionar ingresos y reportes financieros</div>
            </div>
          </a>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
            </div>
            </div>

    <!-- Modal Ver Consulta -->
    <div *ngIf="showVerModal" class="modal-overlay" (click)="closeVerModal()">
      <div class="modal-content modal-large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Detalles de la Consulta</h3>
          <button class="close-btn" (click)="closeVerModal()">×</button>
          </div>
        <div class="modal-body" *ngIf="selectedConsulta">
          <div class="consulta-details">
            <div class="detail-section">
              <h4>Información del Paciente</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Nombre:</strong> {{ selectedConsulta.paciente_nombre }}
                </div>
                <div class="detail-item">
                  <strong>Cédula:</strong> {{ selectedConsulta.paciente_cedula }}
                </div>
                <div class="detail-item">
                  <strong>Teléfono:</strong> {{ selectedConsulta.paciente_telefono }}
                </div>
        </div>
      </div>

            <div class="detail-section">
              <h4>Información Médica</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Médico:</strong> {{ selectedConsulta.medico_nombre }} {{ selectedConsulta.medico_apellidos }}
                </div>
                <div class="detail-item">
                  <strong>Especialidad:</strong> {{ selectedConsulta.especialidad_nombre }}
                </div>
                <div class="detail-item">
                  <strong>Fecha:</strong> {{ selectedConsulta.fecha_pautada }}
                </div>
                <div class="detail-item">
                  <strong>Hora:</strong> {{ formatTime(selectedConsulta.hora_pautada) }}
                </div>
                <div class="detail-item">
                  <strong>Estado:</strong> 
                  <span [class]="'estado-' + selectedConsulta.estado_consulta">
                    {{ getEstadoText(selectedConsulta.estado_consulta) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section" *ngIf="selectedConsulta.motivo_consulta">
              <h4>Motivo de Consulta</h4>
              <div class="motivo-content">{{ selectedConsulta.motivo_consulta }}</div>
            </div>

            <div class="detail-section" *ngIf="selectedConsulta.observaciones">
              <h4>Observaciones</h4>
              <div class="motivo-content">{{ selectedConsulta.observaciones }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Finalizar Consulta con Servicios -->
    <app-finalizar-consulta-modal
      *ngIf="showFinalizarConServiciosModal"
      [consultaInfo]="selectedConsulta"
      [isVisible]="showFinalizarConServiciosModal"
      (close)="closeFinalizarConServiciosModal()"
      (finalizar)="confirmarFinalizarConServicios($event)">
    </app-finalizar-consulta-modal>

    <!-- Modal Cancelar Consulta -->
    <div *ngIf="showCancelarModal" class="modal-overlay" (click)="closeCancelarModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Cancelar Consulta</h3>
          <button class="close-btn" (click)="closeCancelarModal()">×</button>
        </div>
        <div class="modal-body" *ngIf="selectedConsulta">
          <div class="consulta-info">
            <strong>Paciente:</strong> {{ selectedConsulta.paciente_nombre }}<br>
            <strong>Médico:</strong> {{ selectedConsulta.medico_nombre }} {{ selectedConsulta.medico_apellidos }}<br>
            <strong>Fecha:</strong> {{ selectedConsulta.fecha_pautada }} - {{ formatTime(selectedConsulta.hora_pautada) }}
          </div>
          
          <div class="form-group">
            <label>Motivo de Cancelación *</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" name="motivoCancelacion" value="paciente_no_asistio" [(ngModel)]="motivoCancelacion">
                <span class="radio-label">Paciente no asistió</span>
              </label>
              <label class="radio-option">
                <input type="radio" name="motivoCancelacion" value="emergencia_medica" [(ngModel)]="motivoCancelacion">
                <span class="radio-label">Emergencia médica</span>
              </label>
              <label class="radio-option">
                <input type="radio" name="motivoCancelacion" value="reagendamiento" [(ngModel)]="motivoCancelacion">
                <span class="radio-label">Reagendamiento</span>
              </label>
              <label class="radio-option">
                <input type="radio" name="motivoCancelacion" value="otro" [(ngModel)]="motivoCancelacion">
                <span class="radio-label">Otro</span>
              </label>
            </div>
          </div>
          
          <div class="form-group" *ngIf="motivoCancelacion === 'otro'">
            <label for="motivoCancelacionOtro">Especifique el motivo *</label>
            <input 
              type="text" 
              id="motivoCancelacionOtro"
              [(ngModel)]="motivoCancelacionOtro" 
              class="form-control"
              placeholder="Ingrese el motivo de cancelación..."
              required>
          </div>
          
          <div class="form-group">
            <label for="detallesCancelacion">Detalles Adicionales</label>
            <textarea 
              id="detallesCancelacion"
              [(ngModel)]="detallesCancelacion" 
              class="form-control textarea"
              placeholder="Detalles adicionales (opcional)..."
              rows="2">
            </textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-clear" (click)="closeCancelarModal()">Cancelar</button>
          <button class="btn btn-danger" (click)="confirmarCancelar()" 
                  [disabled]="!motivoCancelacion || (motivoCancelacion === 'otro' && !motivoCancelacionOtro.trim()) || isSubmitting">
            {{isSubmitting ? 'Cancelando...' : 'Confirmar Cancelación'}}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Reagendar Consulta -->
    <div *ngIf="showReagendarModal" class="modal-overlay" (click)="closeReagendarModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Reagendar Consulta</h3>
          <button class="close-btn" (click)="closeReagendarModal()">×</button>
        </div>
        <div class="modal-body" *ngIf="selectedConsulta">
          <div class="consulta-info">
            <strong>Paciente:</strong> {{ selectedConsulta.paciente_nombre }}<br>
            <strong>Médico:</strong> {{ selectedConsulta.medico_nombre }} {{ selectedConsulta.medico_apellidos }}<br>
            <strong>Fecha Actual:</strong> {{ selectedConsulta.fecha_pautada }} - {{ formatTime(selectedConsulta.hora_pautada) }}
          </div>
          
          <div class="form-group">
            <label for="nuevaFechaReagendar">Nueva Fecha *</label>
            <input 
              type="date" 
              id="nuevaFechaReagendar"
              [(ngModel)]="nuevaFechaReagendar" 
              class="form-control"
              [min]="getTodayDate()"
              required>
          </div>
          
          <div class="form-group">
            <label for="nuevaHoraReagendar">Nueva Hora *</label>
            <input 
              type="time" 
              id="nuevaHoraReagendar"
              [(ngModel)]="nuevaHoraReagendar" 
              class="form-control"
              required>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-clear" (click)="closeReagendarModal()">Cancelar</button>
          <button class="btn btn-warning" (click)="confirmarReagendar()" 
                  [disabled]="!nuevaFechaReagendar || !nuevaHoraReagendar || isSubmitting">
            {{isSubmitting ? 'Reagendando...' : 'Confirmar Reagendamiento'}}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2C2C2C;
      margin-bottom: 0.5rem;
      font-family: 'Montserrat', sans-serif;
    }

    .dashboard-header p {
      font-size: 1.1rem;
      color: #666666;
      font-family: 'Montserrat', sans-serif;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #7A9CC6, #5A7A9A);
      border-radius: 50%;
      color: white;
      box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
      transition: all 0.3s ease;
    }

    .stat-icon svg {
      width: 28px;
      height: 28px;
    }

    .stat-card:hover .stat-icon {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(233, 30, 99, 0.4);
    }

    .stat-content h3 {
      font-size: 2rem;
      font-weight: 700;
      color: #2C2C2C;
      margin: 0;
      font-family: 'Montserrat', sans-serif;
    }

    .stat-content p {
      color: #666666;
      margin: 0;
      font-family: 'Montserrat', sans-serif;
    }

    .dashboard-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      font-family: 'Montserrat', sans-serif;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }

    .btn svg {
      width: 18px;
      height: 18px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #7A9CC6, #5A7A9A);
      color: white;
      box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(233, 30, 99, 0.4);
    }

    .btn-secondary {
      background: #F5F5F5;
      color: #2C2C2C;
      border: 1px solid #7A9CC6;
    }

    .btn-secondary:hover {
      background: #7A9CC6;
      color: white;
      transform: translateY(-2px);
    }

    .section-divider {
      height: 3px;
      background: linear-gradient(90deg, #7A9CC6, #F5F5F5, #7A9CC6);
      margin: 2rem 0 1.5rem 0;
      border-radius: 2px;
      box-shadow: 0 2px 4px rgba(233, 30, 99, 0.2);
    }

    .recent-patients h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2C2C2C;
      margin-bottom: 1rem;
      font-family: 'Montserrat', sans-serif;
    }

    .patients-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .patient-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .patient-info h4 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #2C2C2C;
      margin-bottom: 0.25rem;
      font-family: 'Montserrat', sans-serif;
    }

    .patient-info p {
      color: #666666;
      font-size: 0.9rem;
      margin: 0;
      font-family: 'Montserrat', sans-serif;
    }

    .patient-email {
      color: #7A9CC6 !important;
    }

    .patient-actions .btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-family: 'Montserrat', sans-serif;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-sm svg {
      width: 14px;
      height: 14px;
    }

    .loading {
      text-align: center;
      padding: 2rem;
    }

    .loading p {
      margin-top: 1rem;
      color: #666666;
      font-family: 'Montserrat', sans-serif;
    }

    /* Estilos para Consultas del Día */
    .consultas-section {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .consultas-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .consultas-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2C2C2C;
      margin: 0;
      font-family: 'Montserrat', sans-serif;
    }

    .consultas-count {
      background: linear-gradient(135deg, #7A9CC6, #5A7A9A);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: 'Montserrat', sans-serif;
    }

    .refresh-btn {
      background: #F5F5F5;
      border: 1px solid #7A9CC6;
      color: #7A9CC6;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: 'Montserrat', sans-serif;
    }

    .refresh-btn:hover {
      background: #7A9CC6;
      color: white;
      transform: translateY(-1px);
    }

    .consultas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.25rem;
      padding: 1rem 0;
      max-height: 600px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #7A9CC6 #f1f5f9;
    }

    .consultas-grid::-webkit-scrollbar {
      width: 6px;
    }

    .consultas-grid::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    .consultas-grid::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #7A9CC6, #5A7A9A);
      border-radius: 3px;
    }

    .consultas-grid::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #5A7A9A, #AD1457);
    }

    .consulta-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 1rem;
      padding: 1.5rem;
      padding-bottom: 1.25rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      min-height: 240px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .consulta-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #7A9CC6, #5A7A9A, #3B82F6);
      border-radius: 1rem 1rem 0 0;
    }

    .consulta-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      border-color: #7A9CC6;
    }

    .consulta-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f1f5f9;
      position: relative;
    }

    .consulta-header::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 40px;
      height: 2px;
      background: linear-gradient(90deg, #7A9CC6, #5A7A9A);
      border-radius: 1px;
    }

    .hora {
      font-weight: 700;
      color: #1e293b;
      font-size: 1rem;
      font-family: 'Montserrat', sans-serif;
      background: linear-gradient(135deg, #7A9CC6, #5A7A9A);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .estado {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-family: 'Montserrat', sans-serif;
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

    .consulta-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .paciente-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.5rem 0.6rem;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 0.4rem;
      border-left: 3px solid #3B82F6;
      margin-bottom: 0.5rem;
    }

    .paciente-nombre {
      font-weight: 600;
      color: #1e293b;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .paciente-cedula {
      font-weight: 400;
      color: #64748b;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.7rem;
      margin-left: 1.2rem;
    }

    .paciente-nombre::before {
      content: '';
      width: 14px;
      height: 14px;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      border-radius: 50%;
      display: inline-block;
      margin-right: 0.4rem;
      position: relative;
      box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
    }

    .paciente-nombre::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3);
    }

    .medico-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.5rem 0.6rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 0.4rem;
      border-left: 3px solid #7A9CC6;
      margin-bottom: 0.5rem;
    }

    .medico-nombre {
      font-weight: 600;
      color: #1e293b;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .medico-especialidad {
      font-weight: 400;
      color: #64748b;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.7rem;
      font-style: italic;
      margin-left: 1.2rem;
    }

    .medico-nombre::before {
      content: '';
      width: 14px;
      height: 14px;
      background: linear-gradient(135deg, #7A9CC6, #5A7A9A);
      border-radius: 50%;
      display: inline-block;
      margin-right: 0.4rem;
      position: relative;
      box-shadow: 0 1px 3px rgba(233, 30, 99, 0.3);
    }

    .medico-nombre::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3);
    }

    .motivo {
      color: #64748b;
      font-size: 0.85rem;
      font-family: 'Montserrat', sans-serif;
      line-height: 1.5;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      position: relative;
      max-height: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .motivo::before {
      content: '📄';
      position: absolute;
      top: -6px;
      left: 8px;
      background: white;
      padding: 0 0.25rem;
      font-size: 0.7rem;
    }

    .tipo-consulta {
      margin-bottom: 0.5rem;
    }

    .tipo-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1rem;
      border-radius: 1rem;
      font-size: 0.8rem;
      font-weight: 700;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      color: #3730a3;
      font-family: 'Montserrat', sans-serif;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .consulta-actions {
      display: flex;
      gap: 0.4rem;
      justify-content: flex-start;
      flex-wrap: wrap;
      margin-top: auto;
      padding-top: 0.75rem;
      padding-bottom: 0.25rem;
      border-top: 1px solid #f1f5f9;
      overflow: visible;
      width: 100%;
    }

    .consulta-actions .btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 600;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Montserrat', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      position: relative;
      overflow: hidden;
      min-width: 70px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .consulta-actions .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }

    .consulta-actions .btn:hover::before {
      left: 100%;
    }

    .consulta-actions .btn-view {
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      color: white;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.25);
    }

    .consulta-actions .btn-view:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(59, 130, 246, 0.4);
    }

    .consulta-actions .btn-edit {
      background: linear-gradient(135deg, #F59E0B, #D97706);
      color: white;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .consulta-actions .btn-edit:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
    }

    .consulta-actions .btn-history {
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
    }

    .consulta-actions .btn-history:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(16, 185, 129, 0.4);
    }

    .consulta-actions .btn-success {
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
    }

    .consulta-actions .btn-success:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(16, 185, 129, 0.4);
    }

    .consulta-actions .btn-warning {
      background: linear-gradient(135deg, #F59E0B, #D97706);
      color: white;
      box-shadow: 0 2px 6px rgba(245, 158, 11, 0.25);
    }

    .consulta-actions .btn-warning:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(245, 158, 11, 0.4);
    }

    .consulta-actions .btn-danger {
      background: linear-gradient(135deg, #EF4444, #DC2626);
      color: white;
      box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);
    }

    .consulta-actions .btn-danger:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(239, 68, 68, 0.4);
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: #6b7280;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 1rem;
      border: 2px dashed #cbd5e1;
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 1.5rem;
      opacity: 0.6;
    }

    .empty-state-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #374151;
      margin-bottom: 0.75rem;
      font-family: 'Montserrat', sans-serif;
    }

    .empty-state-description {
      font-size: 0.9rem;
      color: #64748b;
      font-family: 'Montserrat', sans-serif;
      line-height: 1.6;
    }

    .loading-consultas {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: #6b7280;
    }

    .loading-consultas p {
      margin-top: 1rem;
      font-family: 'Montserrat', sans-serif;
    }

    /* Estilos para modales */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-large {
      max-width: 800px;
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
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .consulta-info {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      border-left: 3px solid #7A9CC6;
    }

    .consulta-details {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .detail-section h4 {
      color: #1e293b;
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.75rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #7A9CC6;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .detail-item {
      color: #64748b;
      font-size: 0.9rem;
    }

    .detail-item strong {
      color: #1e293b;
      font-weight: 600;
    }

    .motivo-content {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      color: #64748b;
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #374151;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #7A9CC6;
      box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1);
    }

    .textarea {
      resize: vertical;
      min-height: 80px;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .radio-option {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: background-color 0.2s;
    }

    .radio-option:hover {
      background: #f8fafc;
    }

    .radio-option input[type="radio"] {
      margin-right: 0.75rem;
      accent-color: #7A9CC6;
    }

    .radio-label {
      color: #374151;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
      background: #f8fafc;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #059669;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: #d97706;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .modal-content {
        width: 95%;
        margin: 1rem;
      }
      
      .detail-grid {
        grid-template-columns: 1fr;
      }
      
      .modal-footer {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
        justify-content: center;
      }
    }

    /* Estilos para Accesos Directos */
    .quick-actions {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .quick-actions h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2C2C2C;
      margin-bottom: 1.5rem;
      font-family: 'Montserrat', sans-serif;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      text-decoration: none;
      transition: all 0.3s ease;
      transition: all 0.3s ease;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      background: white;
    }

    .action-icon {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }

    .action-icon svg {
      width: 28px;
      height: 28px;
    }

    .action-card:hover .action-icon {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    }

    .action-icon.pacientes {
      background: linear-gradient(135deg, #7A9CC6, #5A7A9A);
    }

    .action-icon.medicos {
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
    }

    .action-icon.consultas {
      background: linear-gradient(135deg, #10B981, #059669);
    }

    .action-icon.remisiones {
      background: linear-gradient(135deg, #F59E0B, #D97706);
    }

    .action-icon.informes {
      background: linear-gradient(135deg, #8B5CF6, #7C3AED);
    }

    .action-icon.finanzas {
      background: linear-gradient(135deg, #059669, #047857);
    }

    .action-content {
      flex: 1;
    }

    .action-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
      font-family: 'Montserrat', sans-serif;
    }

    .action-description {
      font-size: 0.875rem;
      color: #6b7280;
      font-family: 'Montserrat', sans-serif;
    }

    @media (max-width: 768px) {
      .dashboard-header h1 {
        font-size: 1.5rem;
      }

      .dashboard-header p {
        font-size: 0.9rem;
      }

      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .stat-card {
        padding: 1rem;
        flex-direction: column;
      text-align: center;
        gap: 0.5rem;
      }

      .stat-icon {
        width: 50px;
        height: 50px;
        font-size: 2rem;
      }

      .stat-content h3 {
        font-size: 1.5rem;
      }

      .stat-content p {
        font-size: 0.8rem;
      }

      .dashboard-actions {
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }

      .patients-grid {
        grid-template-columns: 1fr;
      }

      .patient-card {
        padding: 1rem;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .dashboard-header h1 {
        font-size: 1.25rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .stat-card {
        padding: 0.75rem;
      }

      .stat-icon {
        width: 40px;
        height: 40px;
        font-size: 1.5rem;
      }

      .stat-content h3 {
        font-size: 1.25rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  totalPatients = 0;
  femalePatients = 0;
  malePatients = 0;
  recentPatients = 0;
  recentPatientsList: Patient[] = [];
  loading = true;
  currentUser: User | null = null;
  
  // Propiedades para consultas del día
  consultasDelDia: ConsultaWithDetails[] = [];
  loadingConsultas = false;
  
  // Propiedades para modales
  showVerModal = false;
  showFinalizarModal = false;
  showCancelarModal = false;
  showReagendarModal = false;
  showFinalizarConServiciosModal = false;
  selectedConsulta: ConsultaWithDetails | null = null;
  diagnosticoPreliminar = '';
  observacionesFinalizar = '';
  motivoCancelacion = '';
  motivoCancelacionOtro = '';
  detallesCancelacion = '';
  // Propiedades para reagendamiento
  nuevaFechaReagendar = '';
  nuevaHoraReagendar = '';
  isSubmitting = false;

  constructor(
    private patientService: PatientService,
    private remisionService: RemisionService,
    private authService: AuthService,
    private consultaService: ConsultaService,
    private serviciosService: ServiciosService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
      this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Cargar estadísticas de pacientes
    // Para administradores y secretarias: null (todos los pacientes)
    // Para médicos: su medico_id específico
    const medicoIdForStats = (this.currentUser?.rol === 'administrador' || this.currentUser?.rol === 'secretaria') ? null : (this.currentUser?.medico_id || null);
    this.patientService.getPatientsByMedicoForStats(medicoIdForStats)
      .subscribe({
        next: (patients) => {
          // Calcular estadísticas desde el array de pacientes
          this.totalPatients = patients.length;
          this.femalePatients = patients.filter(p => p.sexo === 'Femenino').length;
          this.malePatients = patients.filter(p => p.sexo === 'Masculino').length;
          
          // Calcular pacientes recientes (últimos 30 días)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          this.recentPatients = patients.filter(p => {
            const createdDate = new Date(p.fecha_creacion);
            return createdDate >= thirtyDaysAgo;
          }).length;
          
          // Obtener lista de pacientes recientes (últimos 5)
          this.recentPatientsList = patients
            .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
            .slice(0, 5);
          
          this.loading = false;
        },
        error: (error) => {
          this.errorHandler.logError(error, 'cargar datos del dashboard');
          this.loading = false;
        }
      });

    // Cargar consultas del día
    this.loadConsultasDelDia();
  }

  loadConsultasDelDia(): void {
    console.log('🔍 Dashboard - loadConsultasDelDia iniciando...');
    this.loadingConsultas = true;
    this.consultaService.getConsultasDelDia().subscribe({
      next: (response) => {
        console.log('✅ Dashboard - Consultas del día cargadas:', response);
        this.consultasDelDia = response.data;
        this.loadingConsultas = false;
        
        if (this.consultasDelDia && this.consultasDelDia.length > 0) {
          console.log('📋 Primera consulta del día:', this.consultasDelDia[0]);
          console.log('📋 especialidad_id en primera consulta:', (this.consultasDelDia[0] as any).especialidad_id);
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar consultas del día');
        this.loadingConsultas = false;
      }
    });
  }

  refreshConsultas(): void {
    this.loadConsultasDelDia();
  }

  getDoctorFullName(): string {
    if (!this.currentUser) return '';
    const nombres = this.currentUser.nombres || '';
    const apellidos = this.currentUser.apellidos || '';
    const fullName = `${nombres} ${apellidos}`.trim();
    return fullName || ''; // Retorna string vacío si ambos son undefined/null
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
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

  getEstadoClass(estado: string): string {
    return `estado-${estado}`;
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

  getConsultaCardClass(consulta: ConsultaWithDetails): string {
    const baseClass = 'consulta-card';
    const estadoClass = `estado-${consulta.estado_consulta}`;
    return `${baseClass} ${estadoClass}`;
  }

  // Método para ver consulta
  verConsulta(consulta: ConsultaWithDetails): void {
    this.selectedConsulta = consulta;
    this.showVerModal = true;
  }

  // Método para añadir historia médica
  addHistoria(consulta: ConsultaWithDetails): void {
    // Navegar al formulario de historia médica del paciente
    this.router.navigate(['/patients', consulta.paciente_id, 'historia-medica']);
  }

  // Método para finalizar consulta
  finalizarConsulta(consulta: ConsultaWithDetails): void {
    console.log('🔍 Dashboard - finalizarConsulta llamada');
    console.log('📋 Consulta seleccionada:', consulta);
    console.log('📋 especialidad_id:', (consulta as any).especialidad_id);
    console.log('📋 especialidad_nombre:', (consulta as any).especialidad_nombre);
    
    // Navegar al componente de finalización
    this.router.navigate(['/admin/consultas', consulta.id, 'finalizar']);
  }

  canFinalizarConsulta(): boolean {
    return this.currentUser?.rol === 'secretaria' || this.currentUser?.rol === 'administrador';
  }

  canReagendarConsulta(): boolean {
    return this.currentUser?.rol === 'secretaria' || this.currentUser?.rol === 'administrador';
  }

  reagendarConsulta(consulta: ConsultaWithDetails): void {
    console.log('🔍 Dashboard - reagendarConsulta llamada');
    console.log('📋 Consulta seleccionada:', consulta);
    this.selectedConsulta = consulta;
    this.nuevaFechaReagendar = consulta.fecha_pautada || '';
    this.nuevaHoraReagendar = consulta.hora_pautada || '';
    this.showReagendarModal = true;
  }

  // Método para cancelar consulta
  cancelarConsulta(consulta: ConsultaWithDetails): void {
    this.selectedConsulta = consulta;
    this.motivoCancelacion = '';
    this.motivoCancelacionOtro = '';
    this.detallesCancelacion = '';
    this.isSubmitting = false;
    this.showCancelarModal = true;
  }

  // Métodos para cerrar modales
  closeVerModal(): void {
    this.showVerModal = false;
    this.selectedConsulta = null;
  }

  closeFinalizarModal(): void {
    this.showFinalizarModal = false;
    this.selectedConsulta = null;
    this.diagnosticoPreliminar = '';
    this.observacionesFinalizar = '';
  }

  closeFinalizarConServiciosModal(): void {
    this.showFinalizarConServiciosModal = false;
    this.selectedConsulta = null;
  }

  confirmarFinalizarConServicios(data: FinalizarConsultaRequest): void {
    if (!this.selectedConsulta) return;

    this.isSubmitting = true;
    this.serviciosService.finalizarConsultaConServicios(this.selectedConsulta.id, data).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.showFinalizarConServiciosModal = false;
        this.selectedConsulta = null;
        this.loadConsultasDelDia();
        alert('Consulta finalizada exitosamente');
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.errorHandler.logError(error, 'finalizar consulta');
        alert('Error al finalizar la consulta');
      }
    });
  }

  closeCancelarModal(): void {
    this.showCancelarModal = false;
    this.selectedConsulta = null;
    this.motivoCancelacion = '';
    this.motivoCancelacionOtro = '';
    this.detallesCancelacion = '';
  }

  closeReagendarModal(): void {
    this.showReagendarModal = false;
    this.selectedConsulta = null;
    this.nuevaFechaReagendar = '';
    this.nuevaHoraReagendar = '';
    this.isSubmitting = false;
  }

  confirmarReagendar(): void {
    if (!this.selectedConsulta) return;

    if (!this.nuevaFechaReagendar || !this.nuevaHoraReagendar) {
      alert('⚠️ Fecha y hora requeridas\n\nPor favor, seleccione una nueva fecha y hora para la consulta.');
      return;
    }

    this.isSubmitting = true;

    this.consultaService.reagendarConsulta(this.selectedConsulta.id!, this.nuevaFechaReagendar, this.nuevaHoraReagendar).subscribe({
      next: (response) => {
        alert('📅 Consulta reagendada exitosamente\n\nLa consulta ha sido reagendada para la nueva fecha y hora.');
        this.closeReagendarModal();
        this.loadConsultasDelDia();
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'reagendar consulta');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'reagendar consulta');
        alert(errorMessage);
        this.isSubmitting = false;
      }
    });
  }

  // Método para confirmar finalización
  confirmarFinalizar(): void {
    if (!this.selectedConsulta) return;

    const data = {
      diagnostico_preliminar: this.diagnosticoPreliminar,
      observaciones: this.observacionesFinalizar || undefined
    };

    this.consultaService.finalizarConsulta(this.selectedConsulta.id!, data).subscribe({
      next: (response) => {
        alert('✅ Consulta finalizada exitosamente\n\nLa consulta ha sido marcada como completada y se ha registrado en el historial del paciente.');
        this.closeFinalizarModal();
        this.loadConsultasDelDia();
      },
      error: (error) => {
        this.errorHandler.logError(error, 'finalizar consulta');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'finalizar consulta');
        alert(errorMessage);
      }
    });
  }

  // Método para confirmar cancelación
  confirmarCancelar(): void {
    if (!this.selectedConsulta) return;

    let motivoFinal = this.motivoCancelacion;
    if (motivoFinal === 'otro') {
      motivoFinal = this.motivoCancelacionOtro;
    }

    this.isSubmitting = true;

    this.consultaService.cancelarConsulta(this.selectedConsulta.id!, motivoFinal).subscribe({
      next: (response) => {
        alert('⚠️ Consulta cancelada exitosamente\n\nLa consulta ha sido cancelada y el paciente será notificado. Puede reagendar la cita si es necesario.');
        this.closeCancelarModal();
        this.loadConsultasDelDia();
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
}
