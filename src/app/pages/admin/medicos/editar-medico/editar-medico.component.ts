import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MedicoService, Medico } from '../../../../services/medico.service';
import { EspecialidadService, Especialidad } from '../../../../services/especialidad.service';
import { FirmaService } from '../../../../services/firma.service';
import { ErrorHandlerService } from '../../../../services/error-handler.service';

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
    mpps: '',
    cm: ''
  };

  especialidades: Especialidad[] = [];
  saving = false;
  loading = true;
  showSnackbar = false;
  snackbarMessage = '';
  snackbarType: 'success' | 'error' = 'success';
  
  // Variables para firma digital
  firmaFile: File | null = null;
  firmaPreview: string | null = null;
  uploadingFirma = false;
  
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
    private errorHandler: ErrorHandlerService
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
            this.loading = false;
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'cargar datos del médico');
          this.showSnackbarMessage('Error cargando datos del médico', 'error');
          this.loading = false;
        }
      });
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
        this.showSnackbarMessage('Error cargando especialidades', 'error');
      }
    });
  }

  onSubmit() {
    // Verificar validaciones adicionales
    if (this.emailExists && this.emailChecked) {
      this.showSnackbarMessage('❌ Error: El email ya está registrado en el sistema.', 'error');
      return;
    }
    
    if (this.cedulaExists && this.cedulaChecked) {
      this.showSnackbarMessage('❌ Error: La cédula ya está registrada en el sistema.', 'error');
      return;
    }
    
    if (this.validateForm()) {
      this.saving = true;
      this.hideSnackbar();
      
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
        cm: this.medicoData.cm || undefined
      };
      
      this.medicoService.updateMedico(this.medicoData.id!, medicoDataToSend).subscribe({
        next: (response) => {
          if (response.success) {
            // Si hay firma digital seleccionada, subirla después de actualizar el médico
            if (this.firmaFile) {
              this.uploadFirmaAfterUpdate();
            } else {
              this.showSnackbarMessage(
                `✅ Médico ${this.medicoData.nombres} ${this.medicoData.apellidos} actualizado exitosamente.`,
                'success'
              );
              
              // Redirigir después de 2 segundos
              setTimeout(() => {
                this.router.navigate(['/admin/medicos']);
              }, 2000);
            }
          }
          this.saving = false;
        },
        error: (error) => {
          this.errorHandler.logError(error, 'actualizar médico');
          
          let errorMessage = '❌ Error al actualizar el médico. Por favor, intente nuevamente.';
          
          if (error.error && error.error.error && error.error.error.message) {
            errorMessage = `❌ ${error.error.error.message}`;
          }
          
          this.saving = false;
          this.showSnackbarMessage(errorMessage, 'error');
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.medicoData.nombres?.trim()) {
      this.showSnackbarMessage('❌ El nombre es requerido', 'error');
      return false;
    }
    if (!this.medicoData.apellidos?.trim()) {
      this.showSnackbarMessage('❌ Los apellidos son requeridos', 'error');
      return false;
    }
    if (!this.medicoData.email?.trim()) {
      this.showSnackbarMessage('❌ El email es requerido', 'error');
      return false;
    }
    if (!this.medicoData.telefono?.trim()) {
      this.showSnackbarMessage('❌ El teléfono es requerido', 'error');
      return false;
    }
    if (!this.medicoData.especialidad_id || this.medicoData.especialidad_id === 0) {
      this.showSnackbarMessage('❌ La especialidad es requerida', 'error');
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
        this.showSnackbarMessage('❌ Solo se permiten archivos de imagen', 'error');
        return;
      }
      
      // Validar tamaño (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        this.showSnackbarMessage('❌ El archivo no puede ser mayor a 2MB', 'error');
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
          this.showSnackbarMessage('✅ Firma digital subida exitosamente', 'success');
          this.firmaFile = null;
          this.firmaPreview = null;
        } else {
          this.showSnackbarMessage('❌ Error al subir firma digital', 'error');
        }
        this.uploadingFirma = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'subir firma digital');
        let errorMessage = '❌ Error al subir firma digital';
        if (error.error && error.error.error && error.error.error.message) {
          errorMessage = `❌ ${error.error.error.message}`;
        }
        this.showSnackbarMessage(errorMessage, 'error');
        this.uploadingFirma = false;
      }
    });
  }

  removeFirma() {
    this.firmaFile = null;
    this.firmaPreview = null;
  }

  uploadFirmaAfterUpdate() {
    if (!this.firmaFile || !this.medicoData.id) {
      return;
    }
    
    this.uploadingFirma = true;
    
    this.firmaService.subirFirma(this.medicoData.id, this.firmaFile).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.medicoData.firma_digital = response.data.firma_digital;
          this.showSnackbarMessage(
            `✅ Médico ${this.medicoData.nombres} ${this.medicoData.apellidos} actualizado exitosamente con firma digital.`,
            'success'
          );
          this.firmaFile = null;
          this.firmaPreview = null;
        } else {
          this.showSnackbarMessage(
            `✅ Médico ${this.medicoData.nombres} ${this.medicoData.apellidos} actualizado exitosamente. Error al subir firma digital.`,
            'success'
          );
        }
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/admin/medicos']);
        }, 2000);
        
        this.uploadingFirma = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'subir firma digital después de actualizar');
        this.showSnackbarMessage(
          `✅ Médico ${this.medicoData.nombres} ${this.medicoData.apellidos} actualizado exitosamente. Error al subir firma digital.`,
          'success'
        );
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/admin/medicos']);
        }, 2000);
        
        this.uploadingFirma = false;
      }
    });
  }

  volver() {
    this.router.navigate(['/admin/medicos']);
  }

  showSnackbarMessage(message: string, type: 'success' | 'error') {
    this.snackbarMessage = message;
    this.snackbarType = type;
    this.showSnackbar = true;
    
    setTimeout(() => {
      this.hideSnackbar();
    }, 5000);
  }

  hideSnackbar() {
    this.showSnackbar = false;
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
