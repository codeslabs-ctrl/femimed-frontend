import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ConsultaService } from '../../../services/consulta.service';
import { PatientService } from '../../../services/patient.service';
import { MedicoService } from '../../../services/medico.service';
import { EspecialidadService } from '../../../services/especialidad.service';
import { HistoricoService } from '../../../services/historico.service';
import { ArchivoService } from '../../../services/archivo.service';
import { DateService } from '../../../services/date.service';
import { AuthService } from '../../../services/auth.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { AlertService } from '../../../services/alert.service';
import { PlantillaHistoriaService, PlantillaHistoria } from '../../../services/plantilla-historia.service';
import { AntecedenteTipoService } from '../../../services/antecedente-tipo.service';
import { HistoricoAntecedenteService } from '../../../services/historico-antecedente.service';
import { ConsultaWithDetails } from '../../../models/consulta.model';
import { HistoricoWithDetails } from '../../../services/historico.service';
import { ArchivoAnexo } from '../../../models/archivo.model';
import { AntecedenteMedicoTipo } from '../../../models/antecedente-tipo.model';
import { HistoricoAntecedente, AntecedentesResponse } from '../../../models/historico-antecedente.model';
import { FileUploadComponent } from '../../../components/file-upload/file-upload.component';
import { RemitirPacienteModalComponent } from '../../../components/remitir-paciente-modal/remitir-paciente-modal.component';
import { RichTextEditorComponent } from '../../../components/rich-text-editor/rich-text-editor.component';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-historia-medica',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FileUploadComponent, RemitirPacienteModalComponent, RichTextEditorComponent],
  styleUrls: ['./historia-medica.component.css'],
  template: `
    <div class="historia-medica-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>
            <i class="fas fa-file-medical"></i>
            {{ pageTitle }}
          </h1>
          <p class="page-description">
            {{ pageDescription }}
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="volver()">
            ← Volver al Historial
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
          <h3>Error al cargar el paciente</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" (click)="cargarPaciente()">
            <i class="fas fa-refresh"></i>
            Reintentar
          </button>
        </div>
      </div>

      <!-- Formulario -->
      <div *ngIf="!loading && !error" class="form-container">
        <!-- Información de la Consulta -->
        <div class="info-section">
          <h3>Información del Paciente y Médico</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Paciente:</label>
              <span>{{ consultaData?.paciente_nombre }} {{ consultaData?.paciente_apellidos }}</span>
            </div>
            <div class="info-item">
              <label>Médico:</label>
              <div class="medico-info">
                <div class="medico-nombre">{{ displayMedicoTitulo }} {{ displayMedicoNombre }}</div>
                <div class="medico-especialidad">{{ displayEspecialidadNombre }}</div>
              </div>
            </div>
          </div>
          <!-- Antecedentes del paciente: Ver (si ya tiene) o Añadir (si no tiene) -->
          <div class="antecedentes-paciente-block" *ngIf="consultaData?.paciente_id">
            <!-- Cargando: mostrar estado de carga -->
            <div *ngIf="antecedentesPacienteLoading" class="antecedentes-paciente-loading-inline">
              <i class="fas fa-spinner fa-spin"></i> Cargando antecedentes...
            </div>
            <!-- Paciente SIN antecedentes cargados: botón para añadirlos -->
            <button *ngIf="!antecedentesPacienteLoading && !tieneAntecedentesPacienteParaMostrar()"
              type="button" class="btn btn-sm btn-primary antecedentes-paciente-add"
              (click)="irAAnadirAntecedentes()">
              <i class="fas fa-plus"></i> Añadir antecedentes del paciente
            </button>
            <!-- Paciente CON antecedentes: toggle Ver / Ocultar -->
            <ng-container *ngIf="!antecedentesPacienteLoading && tieneAntecedentesPacienteParaMostrar()">
              <button type="button" class="antecedentes-paciente-toggle" (click)="antecedentesPacienteExpanded = !antecedentesPacienteExpanded">
                {{ antecedentesPacienteExpanded ? '▲ Ocultar antecedentes' : '▼ Ver antecedentes del paciente' }}
              </button>
              <div class="antecedentes-paciente-content" *ngIf="antecedentesPacienteExpanded">
                <ng-container *ngIf="antecedentesPacienteData">
                  <div class="antecedentes-paciente-cat" *ngIf="getAntecedentesPresentesCategoria('medicos').length">
                    <strong>Médicos:</strong>
                    <ul>
                      <li *ngFor="let a of getAntecedentesPresentesCategoria('medicos')">
                        {{ getTipoNombre(a.antecedente_tipo_id) }}<span *ngIf="a.detalle"> — {{ formatDetalleAntecedente(a.detalle) }}</span>
                      </li>
                    </ul>
                  </div>
                  <div class="antecedentes-paciente-cat" *ngIf="getAntecedentesPresentesCategoria('quirurgicos').length">
                    <strong>Quirúrgicos:</strong>
                    <ul>
                      <li *ngFor="let a of getAntecedentesPresentesCategoria('quirurgicos')">
                        {{ getTipoNombre(a.antecedente_tipo_id) }}<span *ngIf="a.detalle"> — {{ formatDetalleAntecedente(a.detalle) }}</span>
                      </li>
                    </ul>
                  </div>
                  <div class="antecedentes-paciente-cat" *ngIf="getAntecedentesPresentesCategoria('habitos').length">
                    <strong>Hábitos:</strong>
                    <ul>
                      <li *ngFor="let a of getAntecedentesPresentesCategoria('habitos')">
                        {{ getTipoNombre(a.antecedente_tipo_id) }}<span *ngIf="a.detalle"> — {{ formatDetalleAntecedente(a.detalle) }}</span>
                      </li>
                    </ul>
                  </div>
                  <div class="antecedentes-paciente-cat" *ngIf="antecedentesPacienteData?.antecedentes_otros">
                    <strong>Otros:</strong>
                    <div class="antecedentes-otros-text" [innerHTML]="antecedentesPacienteData.antecedentes_otros"></div>
                  </div>
                  <a [routerLink]="['/patients', consultaData!.paciente_id, 'antecedentes']" target="_blank" class="antecedentes-paciente-edit-link">Editar antecedentes</a>
                </ng-container>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Selector de Plantillas -->
        <div class="plantillas-section" *ngIf="esEditable">
          <div class="plantillas-header">
            <h3>
              <i class="fas fa-file-alt"></i>
              Plantillas de Historia Médica
            </h3>
          </div>
          <div class="plantillas-controls">
            <div class="plantilla-selector">
              <label for="plantillaSelect">Aplicar plantilla:</label>
              <select 
                id="plantillaSelect" 
                [(ngModel)]="plantillaSeleccionada"
                class="form-control"
                name="plantillaSelect"
                [disabled]="cargandoPlantillas || plantillas.length === 0"
                (change)="onPlantillaChange($event)">
                <option [value]="null">-- Seleccione una plantilla --</option>
                <option *ngFor="let plantilla of plantillas" [value]="plantilla.id">
                  {{ plantilla.nombre }}
                </option>
              </select>
              <button 
                type="button" 
                class="btn btn-sm btn-primary"
                (click)="aplicarPlantilla()"
                [disabled]="!plantillaSeleccionada || cargandoPlantillas || plantillas.length === 0">
                <i class="fas fa-check"></i>
                Aplicar
              </button>
            </div>
            <button 
              type="button" 
              class="btn btn-sm btn-outline"
              (click)="abrirModalGuardarPlantilla()"
              [disabled]="!historiaForm.motivo_consulta && !historiaForm.examenes_medico">
              <i class="fas fa-save"></i>
              Guardar como plantilla
            </button>
          </div>
        </div>

        <!-- Formulario de Historia Médica -->
        <form (ngSubmit)="guardarHistoria()" #historiaFormRef="ngForm">
          <div class="form-section">
            <h3>Historia Médica</h3>
            
            <div class="form-group">
              <label for="motivo_consulta">Resumen Clínico *</label>
              <app-rich-text-editor
                [value]="historiaForm.motivo_consulta"
                [placeholder]="'Describa el motivo de la consulta...'"
                [height]="90"
                (valueChange)="historiaForm.motivo_consulta = $event"
                [class.readonly]="!esEditable">
              </app-rich-text-editor>
            </div>

            <!-- Solo cuando NO es primera vez: Tratamiento cumplido, Evaluaciones, luego Examen Físico y Plan -->
            <ng-container *ngIf="!esPrimeraVez">
              <div class="form-group">
                <label for="tratamiento_cumplido">Tratamiento Cumplido</label>
                <app-rich-text-editor
                  [value]="historiaForm.tratamiento_cumplido"
                  [placeholder]="'Describa el cumplimiento del tratamiento...'"
                  [height]="90"
                  (valueChange)="historiaForm.tratamiento_cumplido = $event"
                  [class.readonly]="!esEditable">
                </app-rich-text-editor>
              </div>
              <div class="form-group">
                <label for="evaluacion_subjetiva">Evaluación Subjetiva</label>
                <app-rich-text-editor
                  [value]="historiaForm.evaluacion_subjetiva"
                  [placeholder]="'Evaluación subjetiva del paciente...'"
                  [height]="90"
                  (valueChange)="historiaForm.evaluacion_subjetiva = $event"
                  [class.readonly]="!esEditable">
                </app-rich-text-editor>
              </div>
              <div class="form-group">
                <label for="evaluacion_complementaria">Evaluación Complementaria</label>
                <app-rich-text-editor
                  [value]="historiaForm.evaluacion_complementaria"
                  [placeholder]="'Evaluación complementaria...'"
                  [height]="90"
                  (valueChange)="historiaForm.evaluacion_complementaria = $event"
                  [class.readonly]="!esEditable">
                </app-rich-text-editor>
              </div>
            </ng-container>

            <div class="form-group">
              <label for="examenes_medico">Examen Físico *</label>
              <app-rich-text-editor
                [value]="historiaForm.examenes_medico"
                [placeholder]="'Ingrese los exámenes físicos del paciente...'"
                [height]="90"
                (valueChange)="historiaForm.examenes_medico = $event"
                [class.readonly]="!esEditable">
              </app-rich-text-editor>
            </div>

            <div class="form-group">
              <label for="examenes_paraclinicos">Exámenes Paraclínicos</label>
              <app-rich-text-editor
                [value]="historiaForm.examenes_paraclinicos"
                [placeholder]="'Ingrese los exámenes paraclínicos del paciente...'"
                [height]="90"
                (valueChange)="historiaForm.examenes_paraclinicos = $event"
                [class.readonly]="!esEditable">
              </app-rich-text-editor>
            </div>

            <div class="form-group">
              <label for="diagnostico">Diagnóstico *</label>
              <app-rich-text-editor
                [value]="historiaForm.diagnostico"
                [placeholder]="'Ingrese el diagnóstico médico...'"
                [height]="90"
                (valueChange)="historiaForm.diagnostico = $event"
                [class.readonly]="!esEditable">
              </app-rich-text-editor>
            </div>

            <div class="form-group">
              <label for="plan">Plan de Tratamiento</label>
              <app-rich-text-editor
                [value]="historiaForm.plan"
                [placeholder]="'Plan de acciones a seguir en el tratamiento...'"
                [height]="90"
                (valueChange)="historiaForm.plan = $event"
                [class.readonly]="!esEditable">
              </app-rich-text-editor>
            </div>
          </div>

          <!-- Sección de Archivos Anexos -->
          <div class="form-section" *ngIf="mode === 'edit' && historiaData?.id">
            <h3>Archivos Anexos</h3>
            
            <!-- Archivos existentes -->
            <div class="archivos-existentes" *ngIf="archivos.length > 0">
              <h4>Archivos adjuntos ({{ archivos.length }})</h4>
              <div class="archivos-lista">
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
                    <button 
                      type="button" 
                      class="btn-download" 
                      (click)="descargarArchivo(archivo)" 
                      title="Descargar">
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                      </svg>
                    </button>
                    <button 
                      *ngIf="esEditable"
                      type="button" 
                      class="btn-delete" 
                      (click)="eliminarArchivo(archivo)" 
                      title="Eliminar">
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Estado de carga de archivos -->
            <div *ngIf="archivosCargando" class="archivos-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Cargando archivos...</span>
            </div>

            <!-- Error al cargar archivos -->
            <div *ngIf="archivosError" class="archivos-error">
              <i class="fas fa-exclamation-triangle"></i>
              <span>{{ archivosError }}</span>
              <button type="button" class="btn btn-sm" (click)="cargarArchivos()">
                Reintentar
              </button>
            </div>

            <!-- Componente para subir archivos -->
            <app-file-upload 
              *ngIf="esEditable"
              [historiaId]="historiaData?.id || 0"
              (filesUpdated)="onArchivosSubidos($event)">
            </app-file-upload>
          </div>

          <!-- Botones de acción -->
          <div class="form-actions" *ngIf="esEditable">
            <button 
              type="button" 
              class="btn btn-outline" 
              (click)="resetForm()"
              [disabled]="isSubmitting">
              <span class="btn-icon">🔄</span>
              <span class="btn-text">Restaurar</span>
            </button>
            
            <!-- Botón de Interconsultas -->
            <button 
              type="button" 
              class="btn btn-info" 
              (click)="abrirModalInterconsultas()"
              [disabled]="isSubmitting || !consultaData?.paciente_id || !tieneHistoriaMedica()"
              [title]="!tieneHistoriaMedica() ? 'El paciente debe tener una historia médica cargada con usted para crear interconsultas' : ''">
              <span class="btn-icon">🔄</span>
              <span class="btn-text">Interconsultas</span>
            </button>
            
            <!-- Botón de Agendar Cita -->
            <button 
              type="button" 
              class="btn btn-success" 
              (click)="agendarCita()"
              [disabled]="isSubmitting || !consultaData?.paciente_id || !puedeAgendarCita()"
              [title]="getAgendarCitaTooltip()">
              <span class="btn-icon">📅</span>
              <span class="btn-text">Agendar Cita</span>
            </button>
            
            <button 
              type="submit" 
              class="btn btn-primary" 
              [disabled]="isSubmitting">
              <span *ngIf="isSubmitting" class="btn-icon">⏳</span>
              <span *ngIf="!isSubmitting" class="btn-icon">💾</span>
              <span class="btn-text">{{isSubmitting ? 'Guardando...' : (mode === 'edit' ? 'Actualizar Historia' : 'Crear Historia')}}</span>
            </button>
          </div>

          <!-- Mensaje de solo lectura -->
          <div *ngIf="!esEditable" class="readonly-message">
            <div class="readonly-content">
              <i class="fas fa-eye"></i>
              <h4>Modo Solo Lectura</h4>
              <p>Esta historia médica pertenece a otro médico. Solo puedes visualizar la información, no editarla.</p>
              <button 
                type="button" 
                class="btn btn-outline" 
                (click)="cambiarAMiHistoria()"
                *ngIf="medicoActual">
                <span class="btn-icon">✏️</span>
                <span class="btn-text">Editar Mi Historia</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>

    <!-- Modal de Interconsultas -->
    <app-remitir-paciente-modal
      [isOpen]="showInterconsultasModal"
      [patient]="pacienteData"
      (close)="cerrarModalInterconsultas()"
      (remisionCreated)="onRemisionCreated($event)">
    </app-remitir-paciente-modal>

    <!-- Modal para Guardar Plantilla -->
    <div *ngIf="mostrarModalPlantilla" class="modal-overlay" (click)="cerrarModalPlantilla()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas fa-file-alt"></i>
            Guardar como Plantilla
          </h3>
          <button type="button" class="modal-close" (click)="cerrarModalPlantilla()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="plantillaNombre">Nombre de la plantilla *</label>
            <input 
              type="text" 
              id="plantillaNombre"
              [(ngModel)]="plantillaForm.nombre"
              class="form-control"
              placeholder="Ej: Consulta general, Control post-operatorio, etc."
              required>
          </div>
          <div class="form-group">
            <label>Vista previa de la plantilla:</label>
            <div class="plantilla-preview">
              <div class="preview-item" *ngIf="plantillaForm.motivo_consulta_template">
                <strong>Resumen Clínico:</strong>
                <div [innerHTML]="plantillaForm.motivo_consulta_template"></div>
              </div>
              <div class="preview-item" *ngIf="plantillaForm.examenes_medico_template">
                <strong>Examenes Fisicos:</strong>
                <div [innerHTML]="plantillaForm.examenes_medico_template"></div>
              </div>
              <div class="preview-item" *ngIf="plantillaForm.diagnostico_template">
                <strong>Diagnóstico:</strong>
                <div [innerHTML]="plantillaForm.diagnostico_template"></div>
              </div>
              <div class="preview-item" *ngIf="plantillaForm.plan_template">
                <strong>Plan:</strong>
                <div [innerHTML]="plantillaForm.plan_template"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" (click)="cerrarModalPlantilla()">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" (click)="guardarPlantilla()">
            <i class="fas fa-save"></i>
            Guardar Plantilla
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .historia-medica-page {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      background: linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%);
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding: 1.75rem 2rem;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.05);
      gap: 1rem;
    }

    .page-header h1 {
      margin: 0 0 0.5rem 0;
      color: #0f172a;
      font-size: 1.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      letter-spacing: -0.02em;
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
      color: var(--color-primary);
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

    .info-section {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 16px;
      padding: 1.75rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }

    .info-section h3 {
      margin: 0 0 1rem 0;
      color: #0f172a;
      font-size: 1.15rem;
      font-weight: 700;
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

    .info-item label {
      font-weight: 600;
      color: #64748b;
      font-size: 0.875rem;
    }

    .info-item span {
      color: #1e293b;
      font-size: 0.875rem;
    }

    .medico-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .antecedentes-paciente-block {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .antecedentes-paciente-toggle {
      background: none;
      border: none;
      color: #0d6efd;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0.25rem 0;
    }
    .antecedentes-paciente-toggle:hover {
      text-decoration: underline;
    }
    .antecedentes-paciente-loading-inline {
      color: #64748b;
      font-size: 0.9rem;
      padding: 0.25rem 0;
    }
    .antecedentes-paciente-add {
      margin-top: 0.25rem;
    }
    .antecedentes-paciente-content {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #fff;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      font-size: 0.875rem;
    }
    .antecedentes-paciente-loading {
      color: #64748b;
    }
    .antecedentes-paciente-empty {
      color: #64748b;
    }
    .antecedentes-paciente-empty a {
      margin-left: 0.5rem;
    }
    .antecedentes-paciente-cat {
      margin-bottom: 0.5rem;
    }
    .antecedentes-paciente-cat ul {
      margin: 0.25rem 0 0 1rem;
      padding: 0;
    }
    .antecedentes-otros-text {
      margin-top: 0.25rem;
      color: #374151;
    }
    .antecedentes-paciente-edit-link {
      display: inline-block;
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: #0d6efd;
    }
    .antecedentes-paciente-edit-link:hover {
      text-decoration: underline;
    }

    .medico-nombre {
      color: #1e293b;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .medico-especialidad {
      color: #64748b;
      font-size: 0.75rem;
      font-style: italic;
    }

    /* Estilos para selector de médico */
    .medico-selector-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1.5rem 0;
    }

    .medico-selector-section h3 {
      color: #1e293b;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .medico-selector {
      margin-bottom: 1.5rem;
    }

    .medico-selector label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .medico-selector select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 0.875rem;
      height: 48px;
      line-height: 1.5;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1rem;
      padding-right: 2.5rem;
      cursor: pointer;
    }

    .medico-selector select:focus {
      outline: none;
      border-color: #f5576c;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .medico-seleccionado-info {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem;
    }

    .medico-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .medico-header h4 {
      color: #1e293b;
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.editable {
      background: #dcfce7;
      color: #166534;
    }

    .badge.readonly {
      background: #fef3c7;
      color: #92400e;
    }

    .medico-specialty {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0 0 0.25rem 0;
    }

    .medico-date {
      color: #9ca3af;
      font-size: 0.75rem;
      margin: 0;
    }

    /* Estilos para campos de solo lectura */
    .form-control.readonly {
      background-color: #f9fafb;
      color: #6b7280;
      cursor: not-allowed;
      border-color: #e5e7eb;
    }

    /* Estilos para rich text editor en modo solo lectura */
    .rich-text-editor.readonly {
      opacity: 0.7;
      pointer-events: none;
    }

    .rich-text-editor.readonly :host ::ng-deep .ql-toolbar {
      display: none;
    }

    .rich-text-editor.readonly :host ::ng-deep .ql-container {
      border: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    .rich-text-editor.readonly :host ::ng-deep .ql-editor {
      color: #6b7280;
      cursor: not-allowed;
    }

    /* Estilos para mensaje de solo lectura */
    .readonly-message {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      text-align: center;
    }

    .readonly-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .readonly-content i {
      font-size: 2rem;
      color: #f59e0b;
      margin-bottom: 1rem;
    }

    .readonly-content h4 {
      color: #92400e;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .readonly-content p {
      color: #92400e;
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
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

    .form-section h3 {
      margin: 0 0 1.5rem 0;
      color: #2c3e50;
      font-size: 1.25rem;
      font-weight: 600;
      border-bottom: 2px solid #f5576c;
      padding-bottom: 0.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 1.5rem;
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
      resize: vertical;
      min-height: 2.25rem;
    }

    textarea.form-control {
      min-height: 80px;
    }

    /* Los selects no deben tener min-height */
    .form-control select,
    select.form-control {
      min-height: auto;
      resize: none;
      height: auto;
    }

    .form-control:focus {
      outline: none;
      border-color: #f5576c;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
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

    .btn-info {
      background: #17a2b8;
      color: white;
      box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
      font-weight: 500;
    }

    .btn-info:hover:not(:disabled) {
      background: #138496;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(23, 162, 184, 0.4);
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

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
    /* Estilos para plantillas */
    .plantillas-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .plantillas-header h3 {
      margin: 0 0 1rem 0;
      color: #1e293b;
      font-size: 1.125rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .plantillas-header h3 i {
      color: var(--color-primary);
    }

    .plantillas-controls {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .plantilla-selector {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex: 1;
      min-width: 300px;
    }

    .plantilla-selector label {
      font-weight: 600;
      color: #64748b;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .plantilla-selector select {
      flex: 1;
      height: 38px;
      min-height: 38px !important;
      max-height: 38px;
      padding: 0.5rem;
      font-size: 0.875rem;
    }

    /* Estilos para modal */
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
      padding: 2rem;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h3 {
      margin: 0;
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .modal-header h3 i {
      color: var(--color-primary);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .modal-close:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .plantilla-preview {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 1rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .preview-item {
      margin-bottom: 1rem;
    }

    .preview-item:last-child {
      margin-bottom: 0;
    }

    .preview-item strong {
      display: block;
      color: #1e293b;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .preview-item div {
      color: #64748b;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  `]
})
export class HistoriaMedicaComponent implements OnInit {
  consultaData: ConsultaWithDetails | null = null;
  historiaData: HistoricoWithDetails | null = null;
  consultaId: number = 0;
  mode: 'create' | 'edit' = 'create';
  loading = true;
  error: string | null = null;
  isSubmitting = false;

  // Contexto de sesión
  currentUser: any = null;
  get isMedico(): boolean {
    return this.currentUser?.rol === 'medico';
  }

  historiaForm = {
    motivo_consulta: '',
    tratamiento_cumplido: '',
    evaluacion_subjetiva: '',
    evaluacion_complementaria: '',
    examenes_medico: '',
    examenes_paraclinicos: '',
    diagnostico: '',
    plan: '',
    antecedentes_otros: ''
  };

  /** True cuando el control es "primera vez" (no se muestran Tratamiento cumplido / Evaluaciones). */
  get esPrimeraVez(): boolean {
    const t = (this.historiaData?.titulo || '').toString().trim().toLowerCase();
    return t === 'primera_vez';
  }

  historiaOriginal: any = null;

  // Propiedades para archivos
  archivos: ArchivoAnexo[] = [];
  archivosCargando = false;
  archivosError: string | null = null;

  // Propiedades para interconsultas
  showInterconsultasModal = false;
  pacienteData: Patient | null = null;

  // Propiedades para selector de médico
  medicosConHistoria: any[] = [];
  medicoSeleccionado: any = null;
  medicoActual: any = null;
  modoVisualizacion: 'lectura' | 'edicion' = 'edicion';
  esEditable = true;
  mostrarSelectorMedico = false;

  // Nuevo flujo por páginas: esta pantalla solo maneja creación/visualización/edición
  historicoId: number | null = null;

  // Propiedades para plantillas
  plantillas: PlantillaHistoria[] = [];
  plantillaSeleccionada: number | null = null;
  cargandoPlantillas = false;
  mostrarModalPlantilla = false;
  modoModalPlantilla: 'crear' | 'editar' = 'crear';
  plantillaForm = {
    nombre: '',
    motivo_consulta_template: '',
    examenes_medico_template: '',
    examenes_paraclinicos_template: '',
    diagnostico_template: '',
    plan_template: '',
    antecedentes_medicos_template: ''
  };

  // Antecedentes estandarizados (catálogo + respuestas por historial)
  antecedentesTiposMedicos: AntecedenteMedicoTipo[] = [];
  antecedentesTiposQuirurgicos: AntecedenteMedicoTipo[] = [];
  antecedentesTiposHabitos: AntecedenteMedicoTipo[] = [];
  antecedentesForm: Record<number, { presente: boolean; detalle: string }> = {};
  loadingAntecedentes = false;
  private antecedentesLoadCount = 0;
  antecedentesMedicosExpanded = false;
  antecedentesQuirurgicosExpanded = false;
  antecedentesHabitosExpanded = false;
  /** Cache para evitar nuevo array en cada change detection (bucle infinito en *ngFor de cirugías). */
  private cirugiaListCache: Record<number, { detalleKey: string; list: { tipo_cirugia: string; ano: string }[] }> = {};

  /** Antecedentes del paciente (bloque solo lectura en Info Paciente y Médico) */
  antecedentesPacienteData: AntecedentesResponse | null = null;
  antecedentesPacienteLoading = false;
  antecedentesPacienteExpanded = false;

  constructor(
    private consultaService: ConsultaService,
    private patientService: PatientService,
    private medicoService: MedicoService,
    private especialidadService: EspecialidadService,
    private historicoService: HistoricoService,
    private archivoService: ArchivoService,
    private dateService: DateService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private plantillaService: PlantillaHistoriaService,
    private antecedenteTipoService: AntecedenteTipoService,
    private historicoAntecedenteService: HistoricoAntecedenteService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.route.params.subscribe(params => {
      this.consultaId = +params['id']; // Ahora es patientId
      if (this.consultaId) {
        this.historicoId = params['historicoId'] ? parseInt(params['historicoId']) : null;
        this.mode = this.historicoId ? 'edit' : 'create';
        this.cargarPaciente();
        if (this.isMedico) {
          this.cargarPlantillas();
        }
      } else {
        this.error = 'ID de paciente no válido';
        this.loading = false;
      }
    });
  }

  cargarPaciente(): void {
    this.loading = true;
    this.error = null;

    this.patientService.getPatientById(this.consultaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Obtener información del médico actual
          const currentUser = this.authService.getCurrentUser();
          const medicoId = currentUser?.medico_id;
          
          if (medicoId) {
            // Cargar información del médico
            this.cargarInformacionMedico(medicoId, response.data);
          } else {
            // Si no hay médico asignado, usar datos básicos
            this.configurarDatosBasicos(response.data);
          }
        } else {
          this.error = 'No se pudo cargar el paciente';
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar paciente');
        this.error = this.errorHandler.getSafeErrorMessage(error, 'cargar paciente');
        this.loading = false;
      }
    });
  }

  cargarInformacionMedico(medicoId: number, patientData: any): void {
    // Obtener información completa del médico
    this.medicoService.getMedicoById(medicoId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const medico = response.data;
          console.log('🔍 Médico cargado:', medico);
          console.log('🔍 Campos disponibles en médico:', Object.keys(medico));
          console.log('🔍 Especialidad ID:', medico.especialidad_id);
          console.log('🔍 Especialidad del médico:', medico.especialidad_nombre);
          
          // Si no tenemos el nombre de la especialidad, cargarlo por separado
          if (!medico.especialidad_nombre && medico.especialidad_id) {
            this.cargarEspecialidad(medico, patientData);
          } else {
            this.configurarDatosMedico(medico, patientData);
          }
        } else {
          // Fallback a datos básicos si no se puede cargar el médico
          this.configurarDatosBasicos(patientData);
        }
        
        this.inicializarPantalla();
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar médico');
        // Fallback a datos básicos en caso de error
        this.configurarDatosBasicos(patientData);
        this.inicializarPantalla();
      }
    });
  }

  cargarEspecialidad(medico: any, patientData: any): void {
    this.especialidadService.getEspecialidadById(medico.especialidad_id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const especialidad = response.data;
          console.log('🔍 Especialidad cargada:', especialidad);
          medico.especialidad_nombre = especialidad.nombre_especialidad;
          this.configurarDatosMedico(medico, patientData);
        } else {
          console.log('❌ No se pudo cargar la especialidad');
          this.configurarDatosMedico(medico, patientData);
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar especialidad');
        this.configurarDatosMedico(medico, patientData);
      }
    });
  }

  configurarDatosMedico(medico: any, patientData: any): void {
    this.consultaData = {
      id: 0,
      paciente_id: patientData.id,
      medico_id: medico.id,
      motivo_consulta: patientData.motivo_consulta || '',
      tipo_consulta: 'primera_vez',
      fecha_pautada: new Date().toISOString().split('T')[0],
      hora_pautada: '00:00',
      duracion_estimada: 30,
      estado_consulta: 'agendada',
      prioridad: 'normal',
      recordatorio_enviado: false,
      fecha_creacion: patientData.fecha_creacion,
      fecha_actualizacion: patientData.fecha_actualizacion,
      paciente_nombre: patientData.nombres,
      paciente_apellidos: patientData.apellidos,
      paciente_cedula: patientData.cedula,
      paciente_telefono: patientData.telefono,
      paciente_email: patientData.email,
      medico_nombre: medico.nombres || 'Médico',
      medico_apellidos: medico.apellidos || 'Actual',
      medico_sexo: medico.sexo ?? null,
      especialidad_nombre: medico.especialidad_nombre || 'Sin especialidad',
      historico_id: patientData.historico_id,
      diagnostico: patientData.diagnostico,
      plan: patientData.plan
    };
    
    this.inicializarPantalla();
  }

  configurarDatosBasicos(patientData: any): void {
    this.consultaData = {
      id: 0,
      paciente_id: patientData.id,
      medico_id: 0,
      motivo_consulta: patientData.motivo_consulta || '',
      tipo_consulta: 'primera_vez',
      fecha_pautada: new Date().toISOString().split('T')[0],
      hora_pautada: '00:00',
      duracion_estimada: 30,
      estado_consulta: 'agendada',
      prioridad: 'normal',
      recordatorio_enviado: false,
      fecha_creacion: patientData.fecha_creacion,
      fecha_actualizacion: patientData.fecha_actualizacion,
      paciente_nombre: patientData.nombres,
      paciente_apellidos: patientData.apellidos,
      paciente_cedula: patientData.cedula,
      paciente_telefono: patientData.telefono,
      paciente_email: patientData.email,
      medico_nombre: 'Médico',
      medico_apellidos: 'No Asignado',
      especialidad_nombre: 'Sin especialidad',
      historico_id: patientData.historico_id,
      diagnostico: patientData.diagnostico,
      plan: patientData.plan
    };
    
    this.inicializarPantalla();
  }
  inicializarPantalla(): void {
    if (!this.consultaData) return;

    this.loadAntecedentesTipos();

    if (!this.historicoId) {
      if (!this.isMedico) {
        this.alertService.showInfo('Solo los médicos pueden crear nuevos controles.');
        this.router.navigate(['/patients', this.consultaId, 'historia-medica']);
        this.loading = false;
        return;
      }

      this.historiaData = null;
      this.mode = 'create';
      this.esEditable = true;
      this.modoVisualizacion = 'edicion';
      this.historiaForm = { 
        motivo_consulta: '', 
        tratamiento_cumplido: '',
        evaluacion_subjetiva: '',
        evaluacion_complementaria: '',
        examenes_medico: '',
        examenes_paraclinicos: '',
        diagnostico: '', 
        plan: '',
        antecedentes_otros: ''
      };
      this.historiaOriginal = { ...this.historiaForm };
      this.archivos = [];
      this.initAntecedentesFormVacío();
      this.loading = false;
      return;
    }

    this.historicoService.getHistoricoById(this.historicoId).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.historiaData = resp.data;
          this.asegurarMedicoSexoEnHistoriaData();
          this.mode = 'edit';
          const medicoId = this.currentUser?.medico_id;
          this.esEditable = this.isMedico && !!medicoId && this.historiaData!.medico_id === medicoId;
          if (this.esEditable && !this.esConsultaPasadaOHoy(this.historiaData)) this.esEditable = false;
          this.modoVisualizacion = this.esEditable ? 'edicion' : 'lectura';
          this.historiaForm = {
            motivo_consulta: this.historiaData!.motivo_consulta || '',
            tratamiento_cumplido: (this.historiaData as any).tratamiento_cumplido || '',
            evaluacion_subjetiva: (this.historiaData as any).evaluacion_subjetiva || '',
            evaluacion_complementaria: (this.historiaData as any).evaluacion_complementaria || '',
            examenes_medico: this.historiaData!.examenes_medico || '',
            examenes_paraclinicos: (this.historiaData as any).examenes_paraclinicos || '',
            diagnostico: this.historiaData!.diagnostico || '',
            plan: this.historiaData!.plan || '',
            antecedentes_otros: this.historiaData!.antecedentes_otros || ''
          };
          this.historiaOriginal = { ...this.historiaForm };
          this.cargarArchivos();
          this.cargarHistoricoAntecedentes(this.historiaData!.id);
          this.loading = false;
        } else {
          this.error = 'No se pudo cargar el control seleccionado';
          this.loading = false;
        }
      },
      error: (error) => {
        const status = (error as any)?.status;
        if (status === 404 && this.consultaData?.paciente_id) {
          this.historicoService.getHistoricoByPaciente(this.consultaData.paciente_id).subscribe({
            next: (listResp) => {
              const list = (listResp.success && listResp.data) ? listResp.data : [];
              const found = list.find(h => h.id === this.historicoId);
              if (!found) {
                this.error = 'No se pudo cargar el control seleccionado';
                this.loading = false;
                return;
              }

              this.historiaData = found;
              this.asegurarMedicoSexoEnHistoriaData();
              this.mode = 'edit';
              const medicoId = this.currentUser?.medico_id;
              this.esEditable = this.isMedico && !!medicoId && this.historiaData.medico_id === medicoId;
              if (this.esEditable && !this.esConsultaPasadaOHoy(this.historiaData)) this.esEditable = false;
              this.modoVisualizacion = this.esEditable ? 'edicion' : 'lectura';
              this.historiaForm = {
                motivo_consulta: this.historiaData.motivo_consulta || '',
                tratamiento_cumplido: (this.historiaData as any).tratamiento_cumplido || '',
                evaluacion_subjetiva: (this.historiaData as any).evaluacion_subjetiva || '',
                evaluacion_complementaria: (this.historiaData as any).evaluacion_complementaria || '',
                examenes_medico: this.historiaData.examenes_medico || '',
                examenes_paraclinicos: (this.historiaData as any).examenes_paraclinicos || '',
                diagnostico: this.historiaData.diagnostico || '',
                plan: this.historiaData.plan || '',
                antecedentes_otros: this.historiaData.antecedentes_otros || ''
              };
              this.historiaOriginal = { ...this.historiaForm };
              this.cargarHistoricoAntecedentes(this.historiaData.id);
              this.cargarArchivos();
              this.loading = false;
            },
            error: (listErr) => {
              this.errorHandler.logError(listErr, 'cargar historial pacientes (fallback)');
              this.error = this.errorHandler.getSafeErrorMessage(listErr, 'cargar historial pacientes');
              this.loading = false;
            }
          });
          return;
        }

        this.errorHandler.logError(error, 'cargar control');
        this.error = this.errorHandler.getSafeErrorMessage(error, 'cargar control');
        this.loading = false;
      }
    });
  }

  /**
   * En edición, carga el médico del control para tener medico_sexo actualizado (Dr./Dra.).
   * Así no dependemos del historico ni del médico logueado (consultaData).
   */
  private asegurarMedicoSexoEnHistoriaData(): void {
    const h = this.historiaData;
    if (!h?.medico_id) return;
    this.medicoService.getMedicoById(h.medico_id).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          const sexo = (resp.data as any).sexo ?? null;
          if (this.historiaData?.medico_id === (resp.data as any).id) {
            this.historiaData = { ...this.historiaData!, medico_sexo: sexo };
          }
        }
      }
    });
  }

  cargarMedicosConHistoria(): void {
    if (!this.consultaData) return;

    this.historicoService.getMedicosConHistoriaByPaciente(this.consultaData.paciente_id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.medicosConHistoria = response.data;
          console.log('✅ Médicos con historia cargados:', this.medicosConHistoria);
          
          // Configurar médico actual
          this.configurarMedicoActual();
        } else {
          this.medicosConHistoria = [];
          this.configurarMedicoActual();
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar médicos con historia');
        this.medicosConHistoria = [];
        this.configurarMedicoActual();
        this.loading = false;
      }
    });
  }

  configurarMedicoActual(): void {
    if (!this.consultaData) return;

    // Obtener información del médico actual
    this.medicoActual = {
      medico_id: this.consultaData.medico_id,
      medico_nombre: this.consultaData.medico_nombre,
      medico_apellidos: this.consultaData.medico_apellidos,
      especialidad_nombre: this.consultaData.especialidad_nombre
    };

    // Verificar si el médico actual tiene historia
    const tieneHistoriaActual = this.medicosConHistoria.some(medico => 
      medico.medico_id === this.medicoActual.medico_id
    );

    // Verificar si hay historial de otros médicos
    const tieneHistoriaOtrosMedicos = this.medicosConHistoria.some(medico => 
      medico.medico_id !== this.medicoActual.medico_id
    );

    if (tieneHistoriaActual && !tieneHistoriaOtrosMedicos) {
      // Solo el médico actual tiene historia, no mostrar selector
      this.mostrarSelectorMedico = false;
      this.seleccionarMedico(this.medicoActual.medico_id);
      console.log('ℹ️ Solo el médico actual tiene historia, modo edición directo');
    } else if (tieneHistoriaOtrosMedicos) {
      // Hay historial de otros médicos, mostrar selector
      this.mostrarSelectorMedico = true;
      this.seleccionarMedico(this.medicoActual.medico_id);
      console.log('ℹ️ Hay historial de otros médicos, mostrando selector');
    } else {
      // No hay historial médico, modo creación directo
      this.mostrarSelectorMedico = false;
      this.mode = 'create';
      this.medicoSeleccionado = this.medicoActual;
      this.esEditable = true;
      this.modoVisualizacion = 'edicion';
      console.log('ℹ️ No hay historial médico, modo creación directo');
    }
  }

  onMedicoChange(event: any): void {
    const selectedMedicoId = parseInt(event.target.value);
    console.log('🔍 ID del médico seleccionado:', selectedMedicoId);
    
    if (selectedMedicoId && !isNaN(selectedMedicoId)) {
      // Buscar el médico completo en la lista
      const medico = this.medicosConHistoria.find(m => m.medico_id === selectedMedicoId) || this.medicoActual;
      this.medicoSeleccionado = medico;
      console.log('🔍 Médico encontrado:', medico);
      
      this.seleccionarMedico(selectedMedicoId);
    } else {
      console.log('❌ ID de médico inválido');
    }
  }

  cambiarAMiHistoria(): void {
    if (!this.medicoActual) return;

    console.log('🔍 Cambiando a mi historia:', this.medicoActual);

    // Configurar para el médico actual
    this.medicoSeleccionado = this.medicoActual;
    this.esEditable = true;
    this.modoVisualizacion = 'edicion';

    // Cargar o crear historia del médico actual
    this.historicoService.getHistoricoByPacienteAndMedico(this.consultaData!.paciente_id, this.medicoActual.medico_id).subscribe({
      next: (response) => {
        console.log('🔍 Respuesta del backend para mi historia:', response);
        
        if (response.success && response.data) {
          // Existe historia del médico actual
          this.mode = 'edit';
          this.historiaData = response.data;
          this.historiaForm = {
            motivo_consulta: this.historiaData.motivo_consulta || '',
            tratamiento_cumplido: (this.historiaData as any).tratamiento_cumplido || '',
            evaluacion_subjetiva: (this.historiaData as any).evaluacion_subjetiva || '',
            evaluacion_complementaria: (this.historiaData as any).evaluacion_complementaria || '',
            examenes_medico: this.historiaData.examenes_medico || '',
            examenes_paraclinicos: (this.historiaData as any).examenes_paraclinicos || '',
            diagnostico: this.historiaData.diagnostico || '',
            plan: this.historiaData.plan || '',
            antecedentes_otros: this.historiaData.antecedentes_otros || ''
          };
          this.historiaOriginal = { ...this.historiaForm };
          this.cargarHistoricoAntecedentes(this.historiaData.id);
          this.cargarArchivos();
          console.log('✅ Mi historia cargada:', this.historiaData);
        } else {
          this.mode = 'create';
          this.historiaData = null;
          this.historiaForm = {
            motivo_consulta: '',
            tratamiento_cumplido: '',
            evaluacion_subjetiva: '',
            evaluacion_complementaria: '',
            examenes_medico: '',
            examenes_paraclinicos: '',
            diagnostico: '',
            plan: '',
            antecedentes_otros: ''
          };
          this.initAntecedentesFormVacío();
          console.log('ℹ️ No existe mi historia, modo creación');
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar mi historia');
        this.mode = 'create';
        this.historiaData = null;
      }
    });
  }

  seleccionarMedico(medicoId: number): void {
    if (!this.consultaData) return;

    console.log('🔍 Seleccionando médico ID:', medicoId);
    console.log('🔍 Médicos disponibles:', this.medicosConHistoria);

    const medico = this.medicosConHistoria.find(m => m.medico_id === medicoId);
    if (!medico) {
      console.log('❌ Médico no encontrado en la lista');
      return;
    }

    console.log('✅ Médico encontrado:', medico);

    this.medicoSeleccionado = medico;
    this.esEditable = medicoId === this.medicoActual.medico_id;
    this.modoVisualizacion = this.esEditable ? 'edicion' : 'lectura';

    console.log('🔍 Es editable:', this.esEditable);
    console.log('🔍 Modo visualización:', this.modoVisualizacion);

    // Cargar historia del médico seleccionado
    this.historicoService.getHistoricoByPacienteAndMedico(this.consultaData.paciente_id, medicoId).subscribe({
      next: (response) => {
        console.log('🔍 Respuesta del backend:', response);
        
        if (response.success && response.data) {
          this.mode = 'edit';
          this.historiaData = response.data;
          if (this.esEditable && !this.esConsultaPasadaOHoy(this.historiaData)) this.esEditable = false;
          this.modoVisualizacion = this.esEditable ? 'edicion' : 'lectura';
          this.historiaForm = {
            motivo_consulta: this.historiaData.motivo_consulta || '',
            tratamiento_cumplido: (this.historiaData as any).tratamiento_cumplido || '',
            evaluacion_subjetiva: (this.historiaData as any).evaluacion_subjetiva || '',
            evaluacion_complementaria: (this.historiaData as any).evaluacion_complementaria || '',
            examenes_medico: this.historiaData.examenes_medico || '',
            examenes_paraclinicos: (this.historiaData as any).examenes_paraclinicos || '',
            diagnostico: this.historiaData.diagnostico || '',
            plan: this.historiaData.plan || '',
            antecedentes_otros: this.historiaData.antecedentes_otros || ''
          };
          this.historiaOriginal = { ...this.historiaForm };
          this.cargarHistoricoAntecedentes(this.historiaData.id);
          this.cargarArchivos();
          console.log('✅ Historia del médico seleccionado cargada:', this.historiaData);
        } else {
          this.mode = 'create';
          this.historiaData = null;
          this.historiaForm = {
            motivo_consulta: '',
            tratamiento_cumplido: '',
            evaluacion_subjetiva: '',
            evaluacion_complementaria: '',
            examenes_medico: '',
            examenes_paraclinicos: '',
            diagnostico: '',
            plan: '',
            antecedentes_otros: ''
          };
          this.initAntecedentesFormVacío();
          console.log('ℹ️ No existe historia para el médico seleccionado');
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar historia del médico');
        this.mode = 'create';
        this.historiaData = null;
      }
    });
  }

  loadAntecedentesTipos(): void {
    this.loadingAntecedentes = true;
    this.antecedentesLoadCount = 0;
    const maybeDone = () => {
      this.antecedentesLoadCount++;
      if (this.antecedentesLoadCount === 3) {
        this.loadingAntecedentes = false;
        this.loadAntecedentesPaciente();
        if (!this.historiaData) this.initAntecedentesFormVacío();
        else if (this.historiaData.id) this.cargarHistoricoAntecedentes(this.historiaData.id);
      }
    };
    this.antecedenteTipoService.getByTipo('antecedentes_medicos').subscribe({
      next: (r) => { if (r.success && r.data) this.antecedentesTiposMedicos = r.data; maybeDone(); },
      error: () => maybeDone()
    });
    this.antecedenteTipoService.getByTipo('antecedentes_quirurgicos').subscribe({
      next: (r) => { if (r.success && r.data) this.antecedentesTiposQuirurgicos = r.data; maybeDone(); },
      error: () => maybeDone()
    });
    this.antecedenteTipoService.getByTipo('habitos_psicobiologicos').subscribe({
      next: (r) => { if (r.success && r.data) this.antecedentesTiposHabitos = r.data; maybeDone(); },
      error: () => maybeDone()
    });
  }

  /** Carga antecedentes del paciente (solo lectura en bloque Info). */
  loadAntecedentesPaciente(): void {
    if (!this.consultaData?.paciente_id) return;
    this.antecedentesPacienteLoading = true;
    this.antecedentesPacienteData = null;
    this.historicoAntecedenteService.getByPacienteId(this.consultaData.paciente_id).subscribe({
      next: (r) => {
        this.antecedentesPacienteLoading = false;
        if (r.success && r.data) this.antecedentesPacienteData = r.data;
      },
      error: () => { this.antecedentesPacienteLoading = false; }
    });
  }

  /** Navega a la página de antecedentes del paciente para añadirlos; tras guardar/cancelar vuelve aquí. */
  irAAnadirAntecedentes(): void {
    if (!this.consultaData?.paciente_id) return;
    const returnUrl = this.router.url;
    this.router.navigate(['/patients', this.consultaData.paciente_id, 'antecedentes'], { queryParams: { returnUrl } });
  }

  getTipoNombre(tipoId: number): string {
    const t = [...this.antecedentesTiposMedicos, ...this.antecedentesTiposQuirurgicos, ...this.antecedentesTiposHabitos].find(x => x.id === tipoId);
    return t?.nombre ?? `Tipo ${tipoId}`;
  }

  /** Formatea detalle para mostrar. Si es JSON de cirugías [{ tipo_cirugia, ano }, ...], devuelve texto legible. */
  formatDetalleAntecedente(detalle: string | null | undefined): string {
    if (detalle == null || String(detalle).trim() === '') return '';
    const s = String(detalle).trim();
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed
          .map((o: { tipo_cirugia?: string; ano?: string }) => {
            const tipo = (o.tipo_cirugia ?? '').trim();
            const ano = (o.ano ?? '').trim();
            return tipo ? (ano ? `${tipo} (${ano})` : tipo) : (ano ? ano : '');
          })
          .filter((x: string) => x)
          .join(', ');
      }
      if (parsed && typeof parsed === 'object' && (parsed.tipo_cirugia != null || parsed.ano != null)) {
        const tipo = (parsed.tipo_cirugia ?? '').trim();
        const ano = (parsed.ano ?? '').trim();
        return tipo ? (ano ? `${tipo} (${ano})` : tipo) : (ano ? ano : '');
      }
    } catch {
      /* no es JSON, se devuelve tal cual */
    }
    return s;
  }

  getAntecedentesPresentesCategoria(categoria: 'medicos' | 'quirurgicos' | 'habitos'): HistoricoAntecedente[] {
    if (!this.antecedentesPacienteData?.antecedentes) return [];
    const list = this.antecedentesPacienteData.antecedentes.filter(a => a.presente);
    const idsMedicos = this.antecedentesTiposMedicos.map(x => x.id).filter((id): id is number => id != null);
    const idsQuirurgicos = this.antecedentesTiposQuirurgicos.map(x => x.id).filter((id): id is number => id != null);
    const idsHabitos = this.antecedentesTiposHabitos.map(x => x.id).filter((id): id is number => id != null);
    if (categoria === 'medicos') return list.filter(a => idsMedicos.includes(a.antecedente_tipo_id));
    if (categoria === 'quirurgicos') return list.filter(a => idsQuirurgicos.includes(a.antecedente_tipo_id));
    return list.filter(a => idsHabitos.includes(a.antecedente_tipo_id));
  }

  tieneAntecedentesPacienteParaMostrar(): boolean {
    if (!this.antecedentesPacienteData) return false;
    const conPresente = (this.antecedentesPacienteData.antecedentes || []).some(a => a.presente);
    const conOtros = !!(this.antecedentesPacienteData.antecedentes_otros && this.antecedentesPacienteData.antecedentes_otros.trim());
    return conPresente || conOtros;
  }

  initAntecedentesFormVacío(): void {
    const map: Record<number, { presente: boolean; detalle: string }> = {};
    [...this.antecedentesTiposMedicos, ...this.antecedentesTiposQuirurgicos, ...this.antecedentesTiposHabitos].forEach(t => {
      if (t.id != null) map[t.id] = { presente: false, detalle: '' };
    });
    this.antecedentesForm = map;
    this.cirugiaListCache = {};
  }

  cargarHistoricoAntecedentes(historicoId: number): void {
    this.historicoAntecedenteService.getByHistoricoId(historicoId).subscribe({
      next: (r) => {
        if (!r.success || !r.data) return;
        const data = r.data as { antecedentes: HistoricoAntecedente[]; antecedentes_otros: string | null };
        const list = data.antecedentes || [];
        const otros = data.antecedentes_otros ?? '';
        const map: Record<number, { presente: boolean; detalle: string }> = {};
        [...this.antecedentesTiposMedicos, ...this.antecedentesTiposQuirurgicos, ...this.antecedentesTiposHabitos].forEach(t => {
          if (t.id == null) return;
          const item = list.find(a => a.antecedente_tipo_id === t.id);
          map[t.id] = item
            ? { presente: item.presente, detalle: item.detalle ?? '' }
            : { presente: false, detalle: '' };
        });
        this.antecedentesForm = map;
        this.historiaForm.antecedentes_otros = otros;
        this.cirugiaListCache = {};
      }
    });
  }

  getAntecedenteForm(tipoId: number): { presente: boolean; detalle: string } {
    if (!this.antecedentesForm[tipoId]) this.antecedentesForm[tipoId] = { presente: false, detalle: '' };
    return this.antecedentesForm[tipoId];
  }

  /** Detalle para requiere_detalle === 'cirugia': JSON array [{ tipo_cirugia, ano }, ...]. Compatible con formato antiguo de un solo objeto. Devuelve la misma referencia cuando el detalle no cambia para evitar bucle en *ngFor. */
  getDetalleCirugiaList(tipoId: number): { tipo_cirugia: string; ano: string }[] {
    const detalle = this.getAntecedenteForm(tipoId).detalle || '';
    const cache = this.cirugiaListCache[tipoId];
    if (cache && cache.detalleKey === detalle) return cache.list;

    let list: { tipo_cirugia: string; ano: string }[] = [];
    if (detalle.trim()) {
      try {
        const parsed = JSON.parse(detalle);
        if (Array.isArray(parsed)) {
          list = parsed.map((o: any) => ({ tipo_cirugia: o.tipo_cirugia ?? '', ano: o.ano ?? '' }));
        } else if (parsed && typeof parsed === 'object' && (parsed.tipo_cirugia != null || parsed.ano != null)) {
          list = [{ tipo_cirugia: parsed.tipo_cirugia ?? '', ano: parsed.ano ?? '' }];
        }
      } catch { /* list queda [] */ }
    }
    this.cirugiaListCache[tipoId] = { detalleKey: detalle, list };
    return list;
  }

  private writeDetalleCirugiaList(tipoId: number, list: { tipo_cirugia: string; ano: string }[]): void {
    const detalle = list.length > 0 ? JSON.stringify(list) : '';
    this.getAntecedenteForm(tipoId).detalle = detalle;
    this.cirugiaListCache[tipoId] = { detalleKey: detalle, list };
  }

  addDetalleCirugia(tipoId: number): void {
    const list = this.getDetalleCirugiaList(tipoId);
    list.push({ tipo_cirugia: '', ano: '' });
    this.writeDetalleCirugiaList(tipoId, list);
  }

  removeDetalleCirugia(tipoId: number, index: number): void {
    const list = this.getDetalleCirugiaList(tipoId);
    list.splice(index, 1);
    this.writeDetalleCirugiaList(tipoId, list);
  }

  setDetalleCirugiaItem(tipoId: number, index: number, field: 'tipo_cirugia' | 'ano', value: string): void {
    const list = this.getDetalleCirugiaList(tipoId);
    if (list[index]) {
      list[index][field] = value;
      this.writeDetalleCirugiaList(tipoId, list);
    }
  }

  onCirugiaPresenteChange(tipoId: number, presente: boolean): void {
    if (!presente) this.writeDetalleCirugiaList(tipoId, []);
  }

  guardarAntecedentes(historicoId: number): void {
    const allTipos = [...this.antecedentesTiposMedicos, ...this.antecedentesTiposQuirurgicos, ...this.antecedentesTiposHabitos];
    const items: HistoricoAntecedente[] = allTipos
      .filter(t => t.id != null)
      .map(t => ({
        paciente_id: 0,
        antecedente_tipo_id: t.id!,
        presente: this.getAntecedenteForm(t.id!).presente,
        detalle: this.getAntecedenteForm(t.id!).detalle || null
      }));
    this.historicoAntecedenteService.saveBulk(historicoId, items, this.historiaForm.antecedentes_otros ?? null).subscribe({
      next: () => {},
      error: (err) => this.errorHandler.logError(err, 'guardar antecedentes')
    });
  }

  guardarHistoria(): void {
    if (this.isSubmitting) return;

    // Permisos: secretaria/admin solo lectura
    if (!this.esEditable) {
      this.alertService.showInfo('Este control pertenece a otro médico. Puede visualizarlo, pero no modificarlo.');
      return;
    }

    // Validaciones básicas (remover HTML tags para validar contenido)
    const motivoText = this.stripHtml(this.historiaForm.motivo_consulta).trim();
    const examenesMedicoText = this.stripHtml(this.historiaForm.examenes_medico).trim();

    if (!motivoText) {
      this.alertService.showWarning('Por favor, ingrese el motivo de la consulta.');
      return;
    }

    // Exámenes médicos solo obligatorios en consulta "primera_vez"
    if (this.esPrimeraVez && !examenesMedicoText) {
      this.alertService.showWarning('Por favor, ingrese los exámenes médicos.');
      return;
    }

    this.isSubmitting = true;

    if (this.mode === 'edit') {
      this.actualizarHistoria();
    } else {
      this.crearHistoria();
    }
  }

  crearHistoria(): void {
    if (!this.consultaData) return;

    const currentUser = this.authService.getCurrentUser();
    const medicoId = currentUser?.medico_id;
    const rol = currentUser?.rol;

    if (rol !== 'medico') {
      this.alertService.showInfo('Solo los médicos pueden crear nuevos controles.');
      this.isSubmitting = false;
      return;
    }

    if (!medicoId) {
      this.alertService.showError('No se pudo identificar el médico actual.');
      this.isSubmitting = false;
      return;
    }

    const historiaData = {
      paciente_id: this.consultaData.paciente_id,
      medico_id: medicoId,
      motivo_consulta: this.historiaForm.motivo_consulta,
      tratamiento_cumplido: this.historiaForm.tratamiento_cumplido,
      evaluacion_subjetiva: this.historiaForm.evaluacion_subjetiva,
      evaluacion_complementaria: this.historiaForm.evaluacion_complementaria,
      examenes_medico: this.historiaForm.examenes_medico,
      examenes_paraclinicos: this.historiaForm.examenes_paraclinicos,
      diagnostico: this.historiaForm.diagnostico,
      plan: this.historiaForm.plan,
      fecha_consulta: new Date().toISOString(),
      consulta_id: this.consultaData.id && this.consultaData.id > 0 ? this.consultaData.id : undefined
    };

    this.historicoService.createHistorico(historiaData).subscribe({
      next: (response) => {
        if (response.success && response.data?.id) {
          this.historiaData = response.data;
          this.mode = 'edit';
          this.cargarArchivos();
          this.alertService.showSuccess('Control creado exitosamente. Ahora puede agregar archivos anexos si lo desea.');
          this.router.navigate(['/patients', this.consultaId, 'historia-medica']);
        } else {
          this.alertService.showError((response as any).error?.message || 'Error al crear la historia médica');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'crear historia médica');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'crear historia médica');
        this.alertService.showError(errorMessage);
        this.isSubmitting = false;
      }
    });
  }

  actualizarHistoria(): void {
    if (!this.historiaData?.id) return;

    const updateData = {
      motivo_consulta: this.historiaForm.motivo_consulta,
      tratamiento_cumplido: this.historiaForm.tratamiento_cumplido,
      evaluacion_subjetiva: this.historiaForm.evaluacion_subjetiva,
      evaluacion_complementaria: this.historiaForm.evaluacion_complementaria,
      examenes_medico: this.historiaForm.examenes_medico,
      examenes_paraclinicos: this.historiaForm.examenes_paraclinicos,
      diagnostico: this.historiaForm.diagnostico,
      plan: this.historiaForm.plan
    };

    const historicoId = this.historiaData.id;
    this.historicoService.updateHistorico(historicoId, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertService.showSuccess('Control actualizado exitosamente');
          this.router.navigate(['/patients', this.consultaId, 'historia-medica']);
        } else {
          this.alertService.showError((response as any).error?.message || 'Error al actualizar la historia médica');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'actualizar historia médica');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'actualizar historia médica');
        this.alertService.showError(errorMessage);
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    if (this.historiaOriginal) {
      // Filtrar conclusiones si existe en historiaOriginal (datos antiguos)
      const { conclusiones, ...historiaSinConclusiones } = this.historiaOriginal as any;
      this.historiaForm = { ...historiaSinConclusiones };
    } else {
      this.historiaForm = {
        motivo_consulta: '',
        tratamiento_cumplido: '',
        evaluacion_subjetiva: '',
        evaluacion_complementaria: '',
        examenes_medico: '',
        examenes_paraclinicos: '',
        diagnostico: '',
        plan: '',
        antecedentes_otros: ''
      };
    }
  }

  /** Consulta ya ocurrió (hoy o pasada). No permitir editar controles de consultas futuras. */
  private esConsultaPasadaOHoy(data: { fecha_consulta?: string } | null): boolean {
    if (!data?.fecha_consulta) return false;
    const d = new Date(data.fecha_consulta);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d.getTime() <= today.getTime();
  }

  get pageTitle(): string {
    if (this.historiaData?.id) {
      return this.esEditable ? 'Editar Control' : 'Ver Control';
    }
    return this.isMedico ? 'Nuevo Control' : 'Historial Médico';
  }

  get pageDescription(): string {
    if (this.historiaData?.id) {
      return this.esEditable ? 'Modificar el control seleccionado' : 'Visualizar el control seleccionado (solo lectura)';
    }
    return this.isMedico
      ? 'Crear un nuevo control para el paciente'
      : 'Puede consultar los controles registrados del paciente';
  }

  /** Título Dr./Dra. Solo usa el médico del control (historiaData); en edición no usar consultaData (es el médico logueado). */
  get displayMedicoTitulo(): string {
    const sexo = this.historiaData ? this.historiaData.medico_sexo : this.consultaData?.medico_sexo;
    return sexo === 'Femenino' ? 'Dra.' : 'Dr.';
  }

  get displayMedicoNombre(): string {
    if (this.historiaData?.medico_nombre || this.historiaData?.medico_apellidos) {
      return `${this.historiaData?.medico_nombre || ''} ${this.historiaData?.medico_apellidos || ''}`.trim();
    }
    return `${this.consultaData?.medico_nombre || ''} ${this.consultaData?.medico_apellidos || ''}`.trim() || 'N/A';
  }

  get displayEspecialidadNombre(): string {
    return this.historiaData?.especialidad_nombre || this.consultaData?.especialidad_nombre || 'Sin especialidad';
  }

  nuevoControl(): void {
    this.router.navigate(['/patients', this.consultaId, 'historia-medica', 'nuevo']);
  }

  volver(): void {
    this.router.navigate(['/patients', this.consultaId, 'historia-medica']);
  }

  formatDate(dateString: string | undefined): string {
    return this.dateService.formatDate(dateString, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  stripHtml(html: string): string {
    if (!html) return '';
    // Crear un elemento temporal para extraer solo el texto
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  // Métodos para manejo de archivos
  cargarArchivos(): void {
    if (!this.historiaData?.id) return;

    this.archivosCargando = true;
    this.archivosError = null;

    this.archivoService.getArchivosByHistoria(this.historiaData.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.archivos = response.data || [];
        } else {
          this.archivosError = 'Error al cargar los archivos';
        }
        this.archivosCargando = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar archivos');
        this.archivosError = 'Error al cargar los archivos';
        this.archivosCargando = false;
      }
    });
  }

  onArchivosSubidos(archivos: ArchivoAnexo[]): void {
    console.log('Archivos subidos:', archivos);
    // Recargar la lista de archivos
    this.cargarArchivos();
  }

  descargarArchivo(archivo: ArchivoAnexo): void {
    this.archivoService.downloadArchivo(archivo.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = archivo.nombre_original;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.errorHandler.logError(error, 'descargar archivo');
        this.alertService.showError('Error al descargar el archivo');
      }
    });
  }

  eliminarArchivo(archivo: ArchivoAnexo): void {
    this.alertService.confirm('¿Está seguro de que desea eliminar este archivo?', 'Eliminar archivo').then((ok) => {
      if (!ok) return;
      this.archivoService.deleteArchivo(archivo.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarArchivos();
          } else {
            this.alertService.showError('Error al eliminar el archivo');
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'eliminar archivo');
          this.alertService.showError('Error al eliminar el archivo');
        }
      });
    });
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

  // Métodos para manejar interconsultas
  tieneHistoriaMedica(): boolean {
    // Si estamos editando una historia, historiaData existe y tiene medico_id
    if (this.historiaData && this.historiaData.medico_id) {
      return true;
    }

    // Si no hay consultaData o medico_id, no hay historia
    if (!this.consultaData?.medico_id) {
      return false;
    }

    // Verificar si el médico actual está en la lista de médicos con historia
    if (this.medicoActual) {
      const tieneHistoriaConMedicoActual = this.medicosConHistoria.some(
        medico => medico.medico_id === this.medicoActual.medico_id
      );
      return tieneHistoriaConMedicoActual;
    }

    // Si no hay medicoActual pero hay consultaData.medico_id, verificar directamente
    const medicoId = this.consultaData?.medico_id;
    if (medicoId) {
      const tieneHistoriaConMedico = this.medicosConHistoria.some(
        medico => medico.medico_id === medicoId
      );
      return tieneHistoriaConMedico;
    }

    return false;
  }

  abrirModalInterconsultas(): void {
    if (!this.consultaData?.paciente_id) {
      this.errorHandler.logError('No hay datos del paciente disponibles', 'verificar datos del paciente');
      return;
    }

    // Verificar que el paciente tenga historia médica con el médico actual
    if (!this.tieneHistoriaMedica()) {
      this.alertService.showWarning('El paciente debe tener una historia médica cargada con usted para crear interconsultas. Por favor, cree primero la historia médica.');
      return;
    }

    // Crear objeto Patient con los datos disponibles del contexto clínico
    this.pacienteData = {
      id: this.consultaData.paciente_id,
      nombres: this.consultaData.paciente_nombre || '',
      apellidos: this.consultaData.paciente_apellidos || '',
      cedula: this.consultaData.paciente_cedula,
      edad: 0, // Se puede obtener del paciente si es necesario
      sexo: 'Femenino' as const,
      email: this.consultaData.paciente_email || '',
      telefono: '',
      fecha_creacion: '',
      fecha_actualizacion: '',
      activo: true // Por defecto activo
    };

    console.log('🔄 Abriendo modal de interconsultas con contexto clínico:', {
      paciente: this.pacienteData,
      diagnostico: this.historiaForm.diagnostico,
      motivoConsulta: this.historiaForm.motivo_consulta,
      consultaId: this.consultaData.id
    });

    this.showInterconsultasModal = true;
  }

  cerrarModalInterconsultas(): void {
    this.showInterconsultasModal = false;
    this.pacienteData = null;
  }

  onRemisionCreated(remision: any): void {
    console.log('✅ Interconsulta creada exitosamente:', remision);
    
    // Usar datos de la remisión que vienen del backend
    const pacienteNombre = remision?.paciente_nombre || this.pacienteData?.nombres || 'N/A';
    const pacienteApellidos = remision?.paciente_apellidos || this.pacienteData?.apellidos || 'N/A';
    const medicoRemitenteNombre = remision?.medico_remitente_nombre || this.medicoActual?.medico_nombre || 'N/A';
    const medicoRemitenteApellidos = remision?.medico_remitente_apellidos || this.medicoActual?.medico_apellidos || 'N/A';
    const medicoRemitenteSexo = remision?.medico_remitente_sexo ?? this.medicoActual?.medico_sexo ?? null;
    const medicoRemitidoNombre = remision?.medico_remitido_nombre || 'N/A';
    const medicoRemitidoApellidos = remision?.medico_remitido_apellidos || 'N/A';
    const medicoRemitidoSexo = remision?.medico_remitido_sexo ?? null;
    
    // Obtener especialidad del médico remitido desde consultaData o remision
    const especialidadNombre = this.consultaData?.especialidad_nombre || 'N/A';
    
    // Mostrar mensaje de éxito con datos básicos (sin motivo en HTML)
    const mensaje = `✅ Paciente remitido exitosamente

📋 Paciente: ${pacienteNombre} ${pacienteApellidos}
${this.pacienteData?.edad ? `👤 Edad: ${this.pacienteData.edad} años` : ''}
${this.pacienteData?.sexo ? `⚧️ Sexo: ${this.pacienteData.sexo}` : ''}

👨‍⚕️ Médico Remitente: ${medicoRemitenteSexo === 'Femenino' ? 'Dra.' : 'Dr.'} ${medicoRemitenteNombre} ${medicoRemitenteApellidos}

👨‍⚕️ Médico Remitido: ${medicoRemitidoSexo === 'Femenino' ? 'Dra.' : 'Dr.'} ${medicoRemitidoNombre} ${medicoRemitidoApellidos}
🏥 Especialidad: ${especialidadNombre}

La remisión ha sido procesada y se ha enviado una notificación al médico de destino.`;

    this.alertService.showSuccess(mensaje);
    
    // Cerrar el modal
    this.cerrarModalInterconsultas();
  }

  // Métodos para agendar cita
  puedeAgendarCita(): boolean {
    // En modo "create" (nuevo control), solo se puede agendar después de guardar
    // En modo "edit", se puede agendar desde el inicio
    if (this.mode === 'create') {
      // En nuevo control, solo habilitar si ya se guardó (tiene historiaData)
      return !!this.historiaData && !!this.historiaData.id;
    } else if (this.mode === 'edit') {
      // En editar, siempre habilitar si hay datos del paciente y médico
      return !!this.consultaData?.paciente_id && !!this.obtenerMedicoId();
    }
    return false;
  }

  obtenerMedicoId(): number | null {
    // Si estamos editando, usar el medico_id de la historia
    if (this.historiaData?.medico_id) {
      return this.historiaData.medico_id;
    }
    // Si hay consultaData, usar el medico_id de la consulta
    if (this.consultaData?.medico_id) {
      return this.consultaData.medico_id;
    }
    // Si el usuario es médico, usar su medico_id
    if (this.currentUser?.medico_id) {
      return this.currentUser.medico_id;
    }
    return null;
  }

  getAgendarCitaTooltip(): string {
    if (!this.consultaData?.paciente_id) {
      return 'No hay datos del paciente disponibles';
    }
    if (this.mode === 'create' && !this.historiaData?.id) {
      return 'Debe guardar el control primero antes de agendar una cita';
    }
    if (!this.obtenerMedicoId()) {
      return 'No hay médico seleccionado';
    }
    return 'Agendar una nueva consulta con este paciente y médico';
  }

  agendarCita(): void {
    if (!this.consultaData?.paciente_id) {
      this.alertService.showError('No hay datos del paciente disponibles para agendar la cita.');
      return;
    }

    const medicoId = this.obtenerMedicoId();
    if (!medicoId) {
      this.alertService.showError('No hay médico seleccionado para agendar la cita.');
      return;
    }

    // Navegar a nueva consulta con paciente preseleccionado
    const queryParams: any = {
      paciente_id: this.consultaData.paciente_id
    };

    // Si el usuario no es médico, también pasar el medico_id
    // Nota: El componente nueva-consulta necesitará soportar este parámetro
    if (this.currentUser?.rol !== 'medico' && medicoId) {
      queryParams.medico_id = medicoId;
    }

    console.log('📅 Navegando a Nueva Consulta con:', queryParams);
    
    this.router.navigate(['/admin/consultas/nueva'], { queryParams }).then(success => {
      if (success) {
        console.log('✅ Navegación exitosa a Nueva Consulta');
      } else {
        console.error('❌ Error en la navegación');
        this.alertService.showError('Error al navegar a la pantalla de Nueva Consulta. Por favor, intente nuevamente.');
      }
    }).catch(error => {
      console.error('❌ Error de navegación:', error);
      this.alertService.showError('Error al navegar a la pantalla de Nueva Consulta. Por favor, intente nuevamente.');
    });
  }

  // Métodos para manejar plantillas
  onPlantillaChange(event: any): void {
    const value = event.target.value;
    this.plantillaSeleccionada = value === 'null' || value === '' ? null : parseInt(value);
    console.log('🔄 Plantilla seleccionada cambiada:', this.plantillaSeleccionada);
  }

  cargarPlantillas(): void {
    this.cargandoPlantillas = true;
    this.plantillaService.obtenerPlantillas(true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.plantillas = response.data;
        }
        this.cargandoPlantillas = false;
      },
      error: (error) => {
        console.error('Error cargando plantillas:', error);
        this.cargandoPlantillas = false;
      }
    });
  }

  aplicarPlantilla(): void {
    console.log('🔄 Aplicar plantilla - plantillaSeleccionada:', this.plantillaSeleccionada);
    console.log('🔄 Plantillas disponibles:', this.plantillas);
    
    if (!this.plantillaSeleccionada) {
      console.warn('⚠️ No hay plantilla seleccionada');
      this.alertService.showWarning('Por favor, seleccione una plantilla');
      return;
    }
    
    // Convertir a número si es string (puede venir del select como string)
    const plantillaId = typeof this.plantillaSeleccionada === 'string' 
      ? parseInt(this.plantillaSeleccionada) 
      : this.plantillaSeleccionada;
    
    const plantilla = this.plantillas.find(p => p.id === plantillaId);
    
    if (!plantilla) {
      console.error('❌ Plantilla no encontrada con ID:', plantillaId);
      this.alertService.showError('No se encontró la plantilla seleccionada');
      return;
    }

    console.log('✅ Plantilla encontrada:', plantilla);
    
    const datosAplicados = this.plantillaService.aplicarPlantilla(plantilla);
    console.log('✅ Datos a aplicar:', datosAplicados);
    
    this.historiaForm.motivo_consulta = datosAplicados.motivo_consulta;
    this.historiaForm.examenes_medico = datosAplicados.examenes_medico || '';
    this.historiaForm.examenes_paraclinicos = (datosAplicados as any).examenes_paraclinicos || '';
    this.historiaForm.diagnostico = datosAplicados.diagnostico;
    this.historiaForm.plan = datosAplicados.plan;
    
    console.log('✅ Plantilla aplicada exitosamente');
    
    // Limpiar selección
    this.plantillaSeleccionada = null;
    
    // Mostrar mensaje de confirmación
    this.alertService.showSuccess('Plantilla aplicada exitosamente');
  }

  abrirModalGuardarPlantilla(): void {
    // Llenar el formulario de plantilla con los datos actuales
    this.plantillaForm = {
      nombre: '',
      motivo_consulta_template: this.historiaForm.motivo_consulta,
      examenes_medico_template: this.historiaForm.examenes_medico,
      examenes_paraclinicos_template: this.historiaForm.examenes_paraclinicos,
      diagnostico_template: this.historiaForm.diagnostico,
      plan_template: this.historiaForm.plan,
      antecedentes_medicos_template: this.historiaForm.antecedentes_otros
    };
    this.modoModalPlantilla = 'crear';
    this.mostrarModalPlantilla = true;
  }

  cerrarModalPlantilla(): void {
    this.mostrarModalPlantilla = false;
    this.plantillaForm = {
      nombre: '',
      motivo_consulta_template: '',
      examenes_medico_template: '',
      examenes_paraclinicos_template: '',
      diagnostico_template: '',
      plan_template: '',
      antecedentes_medicos_template: ''
    };
  }

  guardarPlantilla(): void {
    if (!this.plantillaForm.nombre.trim()) {
      this.alertService.showWarning('Por favor, ingrese un nombre para la plantilla');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const medicoId = currentUser?.medico_id;
    
    if (!medicoId) {
      this.alertService.showError('No se pudo identificar al médico');
      return;
    }

    const plantillaData: Omit<PlantillaHistoria, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> = {
      medico_id: medicoId,
      nombre: this.plantillaForm.nombre.trim(),
      motivo_consulta_template: this.plantillaForm.motivo_consulta_template,
      examenes_medico_template: this.plantillaForm.examenes_medico_template,
      examenes_paraclinicos_template: this.plantillaForm.examenes_paraclinicos_template,
      diagnostico_template: this.plantillaForm.diagnostico_template,
      plan_template: this.plantillaForm.plan_template,
      activo: true
    };

    this.plantillaService.crearPlantilla(plantillaData).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertService.showSuccess('Plantilla guardada exitosamente');
          this.cargarPlantillas();
          this.cerrarModalPlantilla();
        }
      },
      error: (error) => {
        console.error('Error guardando plantilla:', error);
        this.alertService.showError('Error al guardar la plantilla');
      }
    });
  }
}
