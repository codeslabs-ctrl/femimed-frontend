import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MedicoService, Medico } from '../../../../services/medico.service';
import { EspecialidadService, Especialidad } from '../../../../services/especialidad.service';
import { FirmaService } from '../../../../services/firma.service';
import { ErrorHandlerService } from '../../../../services/error-handler.service';
import { AlertService } from '../../../../services/alert.service';
import { APP_CONFIG } from '../../../../config/app.config';

@Component({
  selector: 'app-editar-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-medico.component.html',
  styleUrls: ['./editar-medico.component.css']
})
export class EditarMedicoComponent implements OnInit {
  medicoData: Partial<Medico> = {
    id: 0,
    nombres: '',
    apellidos: '',
    cedula: '',
    email: '',
    telefono: '',
    especialidad_id: 0,
    sexo: null,
    mpps: '',
    cm: '',
    titulacion: '',
    contacto_redes: ''
  };

  especialidades: Especialidad[] = [];
  saving = false;
  loading = true;
  
  // Variables para firma digital
  firmaFile: File | null = null;
  firmaPreview: string | null = null;
  uploadingFirma = false;
  firmaActualUrl: string | null = null;

  // Variables para sello húmedo
  selloFile: File | null = null;
  selloPreview: string | null = null;
  uploadingSello = false;
  selloActualUrl: string | null = null;
  
  // Variables para validación de email
  emailExists = false;
  emailChecked = false;
  emailValidationTimeout: any;
  
  // Variables para validación de cédula
  cedulaExists = false;
  cedulaChecked = false;
  cedulaValidationTimeout: any;

  constructor(
    private medicoService: MedicoService,
    private especialidadService: EspecialidadService,
    private firmaService: FirmaService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadEspecialidades();
    this.loadMedicoData();
  }

  loadMedicoData() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.medicoService.getMedicoById(parseInt(id)).subscribe({
        next: (response) => {
          if (response.success) {
            this.medicoData = response.data;
            // Construir URL completa de la firma si existe
            if (this.medicoData.firma_digital) {
              this.firmaActualUrl = this.getFirmaUrl(this.medicoData.firma_digital);
            } else {
              this.firmaActualUrl = null;
            }
            if (this.medicoData.sello_humedo) {
              this.selloActualUrl = this.getSelloUrl(this.medicoData.sello_humedo);
            } else {
              this.selloActualUrl = null;
            }
            this.loading = false;
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'cargar datos del médico');
          this.alertService.show('Error cargando datos del médico', 'error');
          this.loading = false;
        }
      });
    }
  }

  /**
   * Construye la URL completa de la firma digital
   * @param firmaPath Ruta relativa de la firma (ej: "assets/firmas/medico_1_firma.png")
   * @returns URL completa de la firma
   */
  getFirmaUrl(firmaPath: string | null | undefined): string | null {
    if (!firmaPath) {
      return null;
    }
    
    // Si ya es una URL completa (http:// o https://), retornarla tal cual
    if (firmaPath.startsWith('http://') || firmaPath.startsWith('https://')) {
      console.log('🔍 [EditarMedico] URL ya es completa:', firmaPath);
      return firmaPath;
    }
    
    // Si tenemos el ID del médico, usar el endpoint del API
    if (this.medicoData.id) {
      const apiBaseUrl = APP_CONFIG.API_BASE_URL;
      const firmaUrl = `${apiBaseUrl}/firmas/${this.medicoData.id}/imagen`;
      console.log('🔍 [EditarMedico] Construyendo URL de firma (endpoint API):', {
        firmaPath,
        medicoId: this.medicoData.id,
        apiBaseUrl,
        firmaUrl
      });
      return firmaUrl;
    }
    
    // Fallback: construir URL directa (para compatibilidad)
    const apiBaseUrl = APP_CONFIG.API_BASE_URL;
    const url = new URL(apiBaseUrl);
    const baseUrl = `${url.protocol}//${url.host}`;
    const normalizedPath = firmaPath.startsWith('/') ? firmaPath : `/${firmaPath}`;
    const fullUrl = `${baseUrl}${normalizedPath}`;
    
    console.log('🔍 [EditarMedico] Construyendo URL de firma (fallback):', {
      firmaPath,
      apiBaseUrl,
      baseUrl,
      normalizedPath,
      fullUrl
    });
    
    try {
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) return null;
      return fullUrl;
    } catch (error) {
      console.error('❌ [EditarMedico] Error construyendo URL:', error);
      return null;
    }
  }

  /** URL de la imagen del sello húmedo (misma carpeta que la firma en el backend) */
  getSelloUrl(selloPath: string | null | undefined): string | null {
    if (!selloPath || !this.medicoData.id) return null;
    if (selloPath.startsWith('http://') || selloPath.startsWith('https://')) return selloPath;
    const apiBaseUrl = APP_CONFIG.API_BASE_URL;
    return `${apiBaseUrl}/firmas/${this.medicoData.id}/sello/imagen`;
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
        this.alertService.show('Error cargando especialidades', 'error');
      }
    });
  }

  onSubmit() {
    // Verificar validaciones adicionales
    if (this.emailExists && this.emailChecked) {
      this.alertService.show('El email ya está registrado en el sistema.', 'error');
      return;
    }
    
    if (this.cedulaExists && this.cedulaChecked) {
      this.alertService.show('La cédula ya está registrada en el sistema.', 'error');
      return;
    }
    
    if (this.validateForm()) {
      this.saving = true;
      this.alertService.close();
      
      console.log('Datos del médico a actualizar:', this.medicoData);
      
      // Asegurar que especialidad_id sea un número y que todos los campos requeridos estén presentes
      const medicoDataToSend = {
        nombres: this.medicoData.nombres!,
        apellidos: this.medicoData.apellidos!,
        cedula: this.medicoData.cedula,
        email: this.medicoData.email!,
        telefono: this.medicoData.telefono!,
        especialidad_id: Number(this.medicoData.especialidad_id),
        mpps: this.medicoData.mpps || undefined,
        cm: this.medicoData.cm || undefined,
        titulacion: this.medicoData.titulacion || undefined,
        contacto_redes: this.medicoData.contacto_redes || undefined
      };
      
      this.medicoService.updateMedico(this.medicoData.id!, medicoDataToSend).subscribe({
        next: (response) => {
          if (response.success) {
            if (this.firmaFile || this.selloFile) {
              this.uploadFirmaYSelloAfterUpdate();
            } else {
              this.alertService.show(
                `Médico ${this.medicoData.nombres} ${this.medicoData.apellidos} actualizado exitosamente.`,
                'success',
                { navigateTo: '/admin/medicos' }
              );
            }
          }
          this.saving = false;
        },
        error: (error) => {
          this.errorHandler.logError(error, 'actualizar médico');
          
          let errorMessage = 'Error al actualizar el médico. Por favor, intente nuevamente.';
          if (error.error && error.error.error && error.error.error.message) {
            errorMessage = error.error.error.message;
          }
          this.saving = false;
          this.alertService.show(errorMessage, 'error');
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.medicoData.nombres?.trim()) {
      this.alertService.show('El nombre es requerido', 'error');
      return false;
    }
    if (!this.medicoData.apellidos?.trim()) {
      this.alertService.show('Los apellidos son requeridos', 'error');
      return false;
    }
    if (!this.medicoData.email?.trim()) {
      this.alertService.show('El email es requerido', 'error');
      return false;
    }
    if (!this.medicoData.telefono?.trim()) {
      this.alertService.show('El teléfono es requerido', 'error');
      return false;
    }
    if (!this.medicoData.especialidad_id || this.medicoData.especialidad_id === 0) {
      this.alertService.show('La especialidad es requerida', 'error');
      return false;
    }
    return true;
  }

  // Métodos para manejo de firma digital
  onFirmaSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.alertService.show('Solo se permiten archivos de imagen', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.alertService.show('El archivo no puede ser mayor a 2MB', 'error');
        return;
      }
      
      this.firmaFile = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.firmaPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadFirma() {
    if (!this.firmaFile || !this.medicoData.id) {
      return;
    }
    
    this.uploadingFirma = true;
    
    this.firmaService.subirFirma(this.medicoData.id, this.firmaFile).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.medicoData.firma_digital = response.data.firma_digital;
          // Actualizar URL de la firma actual
          this.firmaActualUrl = this.getFirmaUrl(response.data.firma_digital);
          this.alertService.show('Firma digital subida exitosamente', 'success');
          this.firmaFile = null;
          this.firmaPreview = null;
        } else {
          this.alertService.show('Error al subir firma digital', 'error');
        }
        this.uploadingFirma = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'subir firma digital');
        let errorMessage = 'Error al subir firma digital';
        if (error.error && error.error.error && error.error.error.message) {
          errorMessage = error.error.error.message;
        }
        this.alertService.show(errorMessage, 'error');
        this.uploadingFirma = false;
      }
    });
  }

  removeFirma() {
    this.firmaFile = null;
    this.firmaPreview = null;
  }

  onSelloSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.alertService.show('Solo se permiten archivos de imagen', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.alertService.show('El archivo no puede ser mayor a 2MB', 'error');
        return;
      }
      this.selloFile = file;
      const reader = new FileReader();
      reader.onload = (e) => { this.selloPreview = e.target?.result as string; };
      reader.readAsDataURL(file);
    }
  }

  uploadSello() {
    if (!this.selloFile || !this.medicoData.id) return;
    this.uploadingSello = true;
    this.firmaService.subirSello(this.medicoData.id, this.selloFile).subscribe({
      next: (response) => {
        if (response.success && response.data?.sello_humedo) {
          this.medicoData.sello_humedo = response.data.sello_humedo;
          this.selloActualUrl = this.getSelloUrl(response.data.sello_humedo);
          this.alertService.show('Sello húmedo subido exitosamente', 'success');
          this.selloFile = null;
          this.selloPreview = null;
        } else {
          this.alertService.show('Error al subir sello húmedo', 'error');
        }
        this.uploadingSello = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'subir sello húmedo');
        const msg = error?.error?.error?.message || error?.error?.message || 'Error al subir sello húmedo';
        this.alertService.show(msg, 'error');
        this.uploadingSello = false;
      }
    });
  }

  removeSello() {
    this.selloFile = null;
    this.selloPreview = null;
  }

  uploadFirmaYSelloAfterUpdate() {
    if (!this.medicoData.id) return;
    const doNavigate = () => {
      this.alertService.show(
        `Médico ${this.medicoData.nombres} ${this.medicoData.apellidos} actualizado exitosamente.`,
        'success',
        { navigateTo: '/admin/medicos' }
      );
    };
    const uploadFirma = (): void => {
      if (!this.firmaFile) {
        uploadSello();
        return;
      }
      this.uploadingFirma = true;
      this.firmaService.subirFirma(this.medicoData.id!, this.firmaFile).subscribe({
        next: (r) => {
          if (r.success && r.data?.firma_digital) {
            this.medicoData.firma_digital = r.data.firma_digital;
            this.firmaActualUrl = this.getFirmaUrl(r.data.firma_digital);
          }
          this.firmaFile = null;
          this.firmaPreview = null;
          this.uploadingFirma = false;
          uploadSello();
        },
        error: () => {
          this.uploadingFirma = false;
          uploadSello();
        }
      });
    };
    const uploadSello = (): void => {
      if (!this.selloFile) {
        doNavigate();
        return;
      }
      this.uploadingSello = true;
      this.firmaService.subirSello(this.medicoData.id!, this.selloFile).subscribe({
        next: (r) => {
          if (r.success && r.data?.sello_humedo) {
            this.medicoData.sello_humedo = r.data.sello_humedo;
            this.selloActualUrl = this.getSelloUrl(r.data.sello_humedo);
          }
          this.selloFile = null;
          this.selloPreview = null;
          this.uploadingSello = false;
          doNavigate();
        },
        error: (err) => {
          const msg = err?.error?.error?.message || err?.error?.message || 'No se pudo subir el sello.';
          this.alertService.show(msg, 'error');
          this.uploadingSello = false;
          doNavigate();
        }
      });
    };
    uploadFirma();
  }

  volver() {
    this.router.navigate(['/admin/medicos']);
  }

  // Validación de email
  validateEmail() {
    if (this.medicoData.email && this.medicoData.email.length > 0) {
      clearTimeout(this.emailValidationTimeout);
      this.emailValidationTimeout = setTimeout(() => {
        this.medicoService.searchMedicos(this.medicoData.email!).subscribe({
          next: (response) => {
            // Filtrar por email exacto y excluir el médico actual
            const existingMedicos = response.data.filter(m => 
              m.email.toLowerCase() === this.medicoData.email!.toLowerCase() && 
              m.id !== this.medicoData.id
            );
            this.emailExists = existingMedicos.length > 0;
            this.emailChecked = true;
          },
          error: (error) => {
            this.errorHandler.logError(error, 'validar email');
            this.emailExists = false;
            this.emailChecked = true;
          }
        });
      }, 500);
    } else {
      this.emailExists = false;
      this.emailChecked = false;
    }
  }

  // Validación de cédula
  validateCedula() {
    if (this.medicoData.cedula && this.medicoData.cedula.length > 0) {
      // Validar formato de cédula venezolana
      const cedulaPattern = /^[VEJPG][0-9]{7,8}$/;
      if (!cedulaPattern.test(this.medicoData.cedula)) {
        console.log('Formato de cédula inválido');
        this.cedulaExists = false;
        this.cedulaChecked = false;
        return;
      }
      
      // Si el formato es válido, verificar duplicados
      clearTimeout(this.cedulaValidationTimeout);
      this.cedulaValidationTimeout = setTimeout(() => {
        this.medicoService.searchMedicos(this.medicoData.cedula!).subscribe({
          next: (response) => {
            // Filtrar por cédula exacta y excluir el médico actual
            const existingMedicos = response.data.filter(m => 
              m.cedula === this.medicoData.cedula && 
              m.id !== this.medicoData.id
            );
            this.cedulaExists = existingMedicos.length > 0;
            this.cedulaChecked = true;
          },
          error: (error) => {
            this.errorHandler.logError(error, 'validar cédula');
            this.cedulaExists = false;
            this.cedulaChecked = true;
          }
        });
      }, 500);
    } else {
      this.cedulaExists = false;
      this.cedulaChecked = false;
    }
  }
}
