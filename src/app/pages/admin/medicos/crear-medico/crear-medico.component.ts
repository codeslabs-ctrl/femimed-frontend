import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MedicoService, Medico } from '../../../../services/medico.service';
import { EspecialidadService, Especialidad } from '../../../../services/especialidad.service';
import { FirmaService } from '../../../../services/firma.service';
import { ErrorHandlerService } from '../../../../services/error-handler.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-crear-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-medico.component.html',
  styleUrls: ['./crear-medico.component.css']
})
export class CrearMedicoComponent implements OnInit {
  medicoData: Partial<Medico> = {
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
  
  // Variables para firma digital
  firmaFile: File | null = null;
  firmaPreview: string | null = null;
  uploadingFirma = false;

  // Variables para sello húmedo
  selloFile: File | null = null;
  selloPreview: string | null = null;
  uploadingSello = false;
  
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
    private errorHandler: ErrorHandlerService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadEspecialidades();
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
      
      console.log('Datos del médico a crear:', this.medicoData);
      
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
      
      this.medicoService.createMedico(medicoDataToSend).subscribe({
        next: (response: any) => {
          if (response.success) {
            const medicoId = response.data?.medico?.id || response.data?.id;
            if ((this.firmaFile || this.selloFile) && medicoId) {
              this.uploadFirmaYSelloAfterCreate(medicoId);
            } else {
              this.alertService.show(
                `Médico ${this.medicoData.nombres} ${this.medicoData.apellidos} creado exitosamente. Se ha enviado el email con las credenciales.`,
                'success',
                { navigateTo: '/admin/medicos' }
              );
            }
          }
          this.saving = false;
        },
        error: (error) => {
          this.errorHandler.logError(error, 'crear médico');
          
          // Manejar errores específicos del backend
          let errorMessage = 'Error al crear el médico. Por favor, intente nuevamente.';
          
          if (error.error && error.error.error && error.error.error.message) {
            errorMessage = error.error.error.message;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          if (errorMessage.includes('Email already exists') || errorMessage.includes('email ya está registrado')) {
            this.emailExists = true;
            this.emailChecked = true;
            this.alertService.show('El email ya está registrado en el sistema.', 'error');
          } else if (errorMessage.includes('cédula ya está registrada') || errorMessage.includes('Cédula ya está registrada')) {
            this.cedulaExists = true;
            this.cedulaChecked = true;
            this.alertService.show('La cédula ya está registrada en el sistema.', 'error');
          } else {
            this.alertService.show(errorMessage, 'error');
          }
          
          this.saving = false;
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

  removeSello() {
    this.selloFile = null;
    this.selloPreview = null;
  }

  uploadFirmaYSelloAfterCreate(medicoId: number) {
    const doNavigate = () => {
      this.alertService.show(
        `Médico ${this.medicoData.nombres} ${this.medicoData.apellidos} creado exitosamente. Se ha enviado el email con las credenciales.`,
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
      this.firmaService.subirFirma(medicoId, this.firmaFile).subscribe({
        next: () => {
          this.firmaFile = null;
          this.firmaPreview = null;
          this.uploadingFirma = false;
          uploadSello();
        },
        error: (err) => {
          const msg = err?.error?.error?.message || err?.error?.message || 'No se pudo subir la firma.';
          this.alertService.show(msg, 'error');
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
      this.firmaService.subirSello(medicoId, this.selloFile).subscribe({
        next: () => {
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
            // Filtrar por email exacto
            const existingMedicos = response.data.filter(m => m.email.toLowerCase() === this.medicoData.email!.toLowerCase());
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
            // Filtrar por cédula exacta
            const existingMedicos = response.data.filter(m => m.cedula === this.medicoData.cedula);
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
