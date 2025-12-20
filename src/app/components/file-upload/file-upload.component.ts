import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArchivoService } from '../../services/archivo.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ArchivoAnexo, ArchivoFormData } from '../../models/archivo.model';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="file-upload-container">
      <!-- Lista de archivos existentes eliminada - se muestran en "Archivos Anexos Existentes" -->

      <!-- Formulario para subir nuevo archivo -->
      <div class="upload-form">
        <div class="form-group">
          <label for="fileInput" class="file-input-label">
            <span class="upload-icon">📎</span>
            Seleccionar Archivos (máx. 5)
          </label>
          <input 
            type="file" 
            id="fileInput" 
            #fileInput
            (change)="onFilesSelected($event)"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.xls,.xlsx"
            class="file-input"
            multiple
          >
        </div>

        <!-- Lista de archivos seleccionados -->
        <div class="selected-files" *ngIf="selectedFiles.length > 0">
          <h5>Archivos seleccionados ({{ selectedFiles.length }}/5):</h5>
          <div class="file-list">
            <div class="file-item" *ngFor="let file of selectedFiles; let i = index">
              <div class="file-info">
                <span class="file-icon">📄</span>
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">({{ formatFileSize(file.size) }})</span>
              </div>
              <button 
                type="button" 
                class="btn-remove" 
                (click)="removeFile(i)"
                title="Eliminar archivo"
              >
                ❌
              </button>
            </div>
          </div>
        </div>

        <!-- Descripciones para cada archivo -->
        <div class="form-group" *ngIf="selectedFiles.length > 0">
          <label>Descripciones de los archivos</label>
          <div class="descriptions-container">
            <div class="description-item" *ngFor="let file of selectedFiles; let i = index">
              <label class="description-label">{{ file.name }}:</label>
              <textarea 
                [(ngModel)]="fileDescriptions[i]"
                placeholder="Describe brevemente el contenido de este archivo..."
                class="description-input"
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="upload-actions" *ngIf="selectedFiles.length > 0">
          <button 
            type="button" 
            class="btn-upload" 
            (click)="uploadFiles()"
            [disabled]="isUploading"
          >
            <span *ngIf="!isUploading">📤 Subir {{ selectedFiles.length }} Archivo(s)</span>
            <span *ngIf="isUploading">⏳ Subiendo...</span>
          </button>
          <button 
            type="button" 
            class="btn-cancel" 
            (click)="cancelUpload()"
            [disabled]="isUploading"
          >
            Cancelar
          </button>
        </div>
      </div>

      <!-- Mensaje de error -->
      <div class="error-message" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .file-upload-container {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      margin-top: 1rem;
    }

    .section-title {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .existing-files {
      margin-bottom: 1.5rem;
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 0.5rem;
      background: #f9fafb;
    }

    .file-info {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .file-icon {
      font-size: 1.5rem;
      margin-right: 0.75rem;
    }

    .file-details {
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .file-meta {
      font-size: 0.8rem;
      color: #6b7280;
      display: flex;
      gap: 1rem;
    }

    .file-description {
      font-size: 0.85rem;
      color: #6b7280;
      margin-top: 0.25rem;
      font-style: italic;
    }

    .file-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-download, .btn-delete {
      background: none;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-download:hover {
      background: #dbeafe;
      border-color: #3b82f6;
    }

    .btn-delete:hover {
      background: #fee2e2;
      border-color: #ef4444;
    }

    .upload-form {
      border-top: 1px solid #e5e7eb;
      padding-top: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .file-input-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f3f4f6;
      border: 2px dashed #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
      color: #374151;
    }

    .file-input-label:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }

    .file-input {
      display: none;
    }

    .upload-icon {
      font-size: 1.2rem;
    }

    .description-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.9rem;
      resize: vertical;
      min-height: 60px;
    }

    .description-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .upload-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .btn-upload {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-upload:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-upload:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-cancel {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.9rem;
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
    }

    .info-message {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 1rem;
    }

    .info-message p {
      margin: 0;
      color: #0369a1;
      font-size: 0.9rem;
    }

    .selected-files {
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .selected-files h5 {
      margin: 0 0 0.75rem 0;
      color: #374151;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .file-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    .file-icon {
      font-size: 1rem;
    }

    .file-name {
      font-weight: 500;
      color: #374151;
      flex: 1;
    }

    .file-size {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .btn-remove {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 3px;
      transition: background-color 0.2s;
    }

    .btn-remove:hover {
      background: #fee2e2;
    }

    .descriptions-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .description-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .description-label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #374151;
    }
  `]
})
export class FileUploadComponent implements OnInit {
  @Input() historiaId!: number;
  @Output() filesUpdated = new EventEmitter<ArchivoAnexo[]>();

  archivos: ArchivoAnexo[] = [];
  selectedFiles: File[] = [];
  fileDescriptions: string[] = [];
  isUploading: boolean = false;
  errorMessage: string = '';

  constructor(
    private archivoService: ArchivoService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    // Solo cargar archivos si hay un historiaId válido
    if (this.historiaId > 0) {
      this.loadArchivos();
    }
  }

  loadArchivos() {
    this.archivoService.getArchivosByHistoria(this.historiaId).subscribe({
      next: (response) => {
        if (response.success) {
          this.archivos = response.data;
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar archivos');
        this.errorMessage = 'Error al cargar los archivos';
      }
    });
  }

  onFilesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    if (files.length === 0) return;

    // Validar número máximo de archivos
    if (files.length > 5) {
      this.errorMessage = 'Máximo 5 archivos permitidos.';
      return;
    }

    // Validar cada archivo
    for (const file of files) {
      // Validar tamaño (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = `El archivo "${file.name}" es demasiado grande. Máximo 10MB.`;
        return;
      }

      // Validar tipo de archivo
      const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      
      if (!isValidType) {
        this.errorMessage = `Tipo de archivo no permitido para "${file.name}". Solo se permiten: PDF, DOC, DOCX, JPG, PNG, TXT, XLS, XLSX`;
        return;
      }
    }

    this.selectedFiles = files;
    this.fileDescriptions = new Array(files.length).fill('');
    this.errorMessage = '';
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) return;

    if (this.historiaId <= 0) {
      this.errorMessage = 'No se puede subir archivos sin un historial médico válido';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    this.archivoService.uploadArchivos(this.historiaId, this.selectedFiles, this.fileDescriptions).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Agregar todos los archivos nuevos al inicio de la lista
          if (Array.isArray(response.data)) {
            this.archivos.unshift(...response.data);
          } else {
            this.archivos.unshift(response.data);
          }
          
          this.selectedFiles = [];
          this.fileDescriptions = [];
          this.errorMessage = '';
          this.filesUpdated.emit(this.archivos);
        }
        this.isUploading = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'subir archivos');
        this.errorMessage = 'Error al subir los archivos';
        this.isUploading = false;
      }
    });
  }

  // Método de compatibilidad
  uploadFile() {
    this.uploadFiles();
  }

  cancelUpload() {
    this.selectedFiles = [];
    this.fileDescriptions = [];
    this.errorMessage = '';
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.fileDescriptions.splice(index, 1);
  }

  downloadFile(archivo: ArchivoAnexo) {
    this.archivoService.downloadArchivo(archivo.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo.nombre_original;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        this.errorHandler.logError(error, 'descargar archivo');
        this.errorMessage = 'Error al descargar el archivo';
      }
    });
  }

  deleteFile(archivo: ArchivoAnexo) {
    if (confirm(`¿Estás seguro de que quieres eliminar el archivo "${archivo.nombre_original}"?`)) {
      this.archivoService.deleteArchivo(archivo.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.archivos = this.archivos.filter(a => a.id !== archivo.id);
            this.filesUpdated.emit(this.archivos);
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'eliminar archivo');
          this.errorMessage = 'Error al eliminar el archivo';
        }
      });
    }
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.startsWith('text/')) return '📄';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
