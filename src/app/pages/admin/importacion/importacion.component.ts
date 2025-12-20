import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { MedicoService } from '../../../services/medico.service';
import { EspecialidadService } from '../../../services/especialidad.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { APP_CONFIG } from '../../../config/app.config';

interface ImportResult {
  total: number;
  exitosos: number;
  fallidos: number;
  errores: Array<{ archivo: string; error: string }>;
  pacientes_creados: number;
  pacientes_actualizados: number;
  historias_creadas: number;
}

@Component({
  selector: 'app-importacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importacion.component.html',
  styleUrls: ['./importacion.component.css']
})
export class ImportacionComponent implements OnInit {
  selectedFiles: File[] = [];
  medicoId: number | null = null;
  especialidadId: number | null = null;
  medicos: any[] = [];
  especialidades: any[] = [];
  medicosFiltrados: any[] = [];
  importing = false;
  progress = 0;
  result: ImportResult | null = null;
  currentUser: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private medicoService: MedicoService,
    private especialidadService: EspecialidadService,
    private errorHandler: ErrorHandlerService
  ) {
    this.currentUser = this.authService.getCurrentUser();
    
    // Si el usuario es médico, usar su ID
    if (this.currentUser?.rol === 'medico' && this.currentUser?.medico_id) {
      this.medicoId = this.currentUser.medico_id;
    }
  }

  ngOnInit() {
    this.loadEspecialidades();
    
    // Si es admin o secretaria, cargar médicos
    if (this.currentUser?.rol === 'administrador' || this.currentUser?.rol === 'secretaria') {
      this.loadMedicos();
    }
  }

  loadEspecialidades() {
    this.especialidadService.getAllEspecialidades().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.especialidades = response.data;
        }
      },
      error: (error: any) => {
        this.errorHandler.logError(error, 'cargar especialidades');
      }
    });
  }

  loadMedicos() {
    this.medicoService.getAllMedicos().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.medicos = response.data;
          this.medicosFiltrados = response.data;
        }
      },
      error: (error: any) => {
        this.errorHandler.logError(error, 'cargar médicos');
      }
    });
  }

  onEspecialidadChange() {
    if (this.especialidadId) {
      this.medicosFiltrados = this.medicos.filter(m => 
        m.especialidad_id === parseInt(this.especialidadId!.toString())
      );
      // Limpiar selección de médico si ya no está disponible
      if (this.medicoId && !this.medicosFiltrados.find(m => m.id === this.medicoId)) {
        this.medicoId = null;
      }
    } else {
      this.medicosFiltrados = this.medicos;
    }
  }

  onFilesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    // Filtrar solo archivos Word
    this.selectedFiles = files.filter(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return extension === 'docx' || extension === 'doc';
    });

    if (this.selectedFiles.length !== files.length) {
      alert('⚠️ Algunos archivos no son documentos Word y fueron excluidos');
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  clearFiles() {
    this.selectedFiles = [];
    this.result = null;
    this.progress = 0;
  }

  importarArchivos() {
    if (this.selectedFiles.length === 0) {
      alert('❌ Por favor, selecciona al menos un archivo Word');
      return;
    }

    if (!this.medicoId) {
      alert('❌ Por favor, selecciona un médico para asociar las historias médicas');
      return;
    }

    this.importing = true;
    this.progress = 0;
    this.result = null;

    const formData = new FormData();
    
    // Agregar todos los archivos
    this.selectedFiles.forEach(file => {
      formData.append('archivos', file);
    });

    // Agregar medico_id si es necesario
    if (this.medicoId) {
      formData.append('medico_id', this.medicoId.toString());
    }

    const url = `${APP_CONFIG.API_BASE_URL}/importacion/multiple`;

    this.http.post<{ success: boolean; data: ImportResult; error?: any }>(url, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          if (event.body?.success) {
            this.result = event.body.data;
            this.importing = false;
            
            const message = `✅ Importación completada:\n\n` +
                          `Total: ${this.result.total} archivos\n` +
                          `Exitosos: ${this.result.exitosos}\n` +
                          `Fallidos: ${this.result.fallidos}\n` +
                          `Pacientes creados: ${this.result.pacientes_creados}\n` +
                          `Pacientes actualizados: ${this.result.pacientes_actualizados}\n` +
                          `Historias creadas: ${this.result.historias_creadas}`;
            
            alert(message);
          } else {
            this.errorHandler.logError(event.body, 'importar documentos');
            const errorMessage = this.errorHandler.getSafeErrorMessage(event.body, 'importar documentos');
            alert(errorMessage);
            this.importing = false;
          }
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'importar documentos');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'importar documentos');
        alert(errorMessage);
        this.importing = false;
        this.progress = 0;
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

