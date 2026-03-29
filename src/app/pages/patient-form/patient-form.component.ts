import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { AlertService } from '../../services/alert.service';
import { Patient } from '../../models/patient.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.css']
})
export class PatientFormComponent implements OnInit {
  patient: Partial<Patient> = {
    nombres: '',
    apellidos: '',
    cedula: '',
    edad: 0,
    sexo: 'Femenino',
    email: '',
    telefono: '',
    remitido_por: ''
  };
  isEdit = false;
  loading = false;
  patientId: number | null = null;
  showSuccessActions = false;
  patientCreated = false;
  loadingPatientData = false;

  // Variables para validación de email
  emailExists = false;
  emailChecked = false;
  emailValidationTimeout: any;
  
  // Variables para validación de cédula
  cedulaExists = false;
  cedulaChecked = false;
  cedulaValidationTimeout: any;

  // Variables para validación de teléfono
  telefonoExists = false;
  telefonoChecked = false;
  telefonoValidationTimeout: any;
  
  // Variables para lógica de médico
  currentMedicoId: number | null = null;
  shouldCreateNewHistory = false;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    // Obtener el médico actual del usuario autenticado
    const currentUser = this.authService.getCurrentUser();
    this.currentMedicoId = currentUser?.medico_id || null;
    console.log('🔍 Médico actual:', this.currentMedicoId);

    // Verificar si es modo edición
    this.patientId = this.route.snapshot.params['id'];
    this.isEdit = !!this.patientId;
    
    console.log('🔍 Modo edición:', this.isEdit);
    console.log('🔍 Patient ID:', this.patientId);

    if (this.isEdit && this.patientId) {
      this.loadPatient();
    }
  }

  loadPatient() {
    if (this.patientId) {
      this.loading = true;
      this.patientService.getPatientById(this.patientId).subscribe({
        next: (response) => {
          if (response.success) {
            this.patient = response.data;
          } else {
            const errorMessage = (response as any).error?.message || 'Error cargando paciente';
            this.alertService.show(`${errorMessage} Por favor, recarga la página e intente nuevamente.`, 'error');
          }
          this.loading = false;
        },
        error: (error) => {
          this.errorHandler.logError(error, 'cargar paciente');
          this.loading = false;
          const bodyMessage = error?.error?.error?.message ?? error?.error?.message;
          this.alertService.show(bodyMessage || this.errorHandler.getSafeErrorMessage(error, 'cargar paciente'), 'error');
        }
      });
    }
  }

  onSubmit(form: any) {
    // Verificar validaciones adicionales
    if (this.emailExists && this.emailChecked) {
      this.alertService.show('El email ya está registrado en el sistema.', 'error');
      return;
    }
    if (this.cedulaExists && this.cedulaChecked) {
      this.alertService.show('La cédula ya está siendo usada por otro paciente.', 'error');
      return;
    }
    if (this.telefonoExists && this.telefonoChecked) {
      this.alertService.show('El teléfono ya está siendo usado por otro paciente.', 'error');
      return;
    }
    if (form.valid) {
      if (this.isEdit) {
        this.updatePatient();
      } else {
        this.createPatient();
      }
    } else {
      this.alertService.show('Por favor, complete todos los campos requeridos correctamente.', 'error');
    }
  }

  createPatient() {
    this.loading = true;
    
    // Solo enviar datos básicos del paciente
    const patientData = {
      nombres: this.patient.nombres!,
      apellidos: this.patient.apellidos!,
      cedula: this.patient.cedula,
      edad: this.patient.edad!,
      sexo: this.patient.sexo!,
      email: this.patient.email!,
      telefono: this.patient.telefono!,
      remitido_por: this.patient.remitido_por ?? undefined,
      activo: true // Los pacientes nuevos siempre se crean como activos
    };

    console.log('🔍 Datos del paciente a enviar:', patientData);
    
    this.patientService.createPatient(patientData)
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          if (response.success) {
            const newPatientId = (response.data as any)?.id;
            console.log('🔍 ID del paciente obtenido:', newPatientId);
            if (newPatientId) {
              this.patientId = newPatientId;
              this.loading = false;
              this.loadingPatientData = true;
              this.patientService.getPatientById(newPatientId).subscribe({
                next: (loadRes) => {
                  this.loadingPatientData = false;
                  if (loadRes.success && loadRes.data) {
                    this.patient = loadRes.data;
                    this.patientCreated = true;
                    this.showSuccessActions = true;
                  } else {
                    this.patientCreated = true;
                    this.showSuccessActions = true;
                  }
                },
                error: () => {
                  this.loadingPatientData = false;
                  this.patientCreated = true;
                  this.showSuccessActions = true;
                }
              });
            } else {
              this.patientCreated = true;
              this.showSuccessActions = true;
              this.loading = false;
            }
          } else {
            const errorMessage = (response as any).error?.message || 'Error creando paciente';
            this.alertService.show(`${errorMessage} Por favor, intente nuevamente.`, 'error');
            this.loading = false;
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'crear paciente');
          this.loading = false;
          // Ver en consola el cuerpo completo del 400 para depurar
          console.warn('Crear paciente - respuesta de error del servidor:', error?.error);
          const bodyMessage = error?.error?.error?.message ?? error?.error?.message ?? error?.message;
          const errorMessage = typeof bodyMessage === 'string' ? bodyMessage : 'Error de conexión creando paciente';
          if (errorMessage.includes('email ya está registrado') || errorMessage.includes('Email ya está registrado')) {
            this.emailExists = true;
            this.emailChecked = true;
            this.alertService.show('El email ya está registrado en el sistema.', 'error');
          } else if (errorMessage.includes('cédula ya está registrada') || errorMessage.includes('Cédula ya está registrada')) {
            this.cedulaExists = true;
            this.cedulaChecked = true;
            this.alertService.show('La cédula ya está siendo usada por otro paciente.', 'error');
          } else if (errorMessage.includes('teléfono') && (errorMessage.includes('ya está') || errorMessage.includes('registrado'))) {
            this.telefonoExists = true;
            this.telefonoChecked = true;
            this.alertService.show('El teléfono ya está siendo usado por otro paciente.', 'error');
          } else if (/Transaction failed|violates not-null|historico_pacientes|consulta_id|relation\s+"/i.test(errorMessage || '')) {
            this.alertService.show('No se pudo completar el registro del paciente. Por favor, intente de nuevo.', 'error');
          } else {
            this.alertService.show(errorMessage || this.errorHandler.getSafeErrorMessage(error, 'crear paciente'), 'error');
          }
        }
      });
  }

  updatePatient() {
    this.loading = true;
    
    // Solo actualizar datos básicos del paciente
    const updateData: Partial<Patient> = {
      nombres: this.patient.nombres!,
      apellidos: this.patient.apellidos!,
      cedula: this.patient.cedula,
      edad: this.patient.edad!,
      sexo: this.patient.sexo!,
      email: this.patient.email!,
      telefono: this.patient.telefono!,
      remitido_por: this.patient.remitido_por ?? undefined
    };

    console.log('🔍 Datos a actualizar:', updateData);
    
    this.patientService.updatePatient(this.patientId!, updateData)
      .subscribe({
        next: (response) => {
          this.loading = false;
          
          if (response.success) {
            this.alertService.show('Paciente actualizado exitosamente.', 'success', { navigateTo: '/patients' });
          } else {
            const errorMessage = (response as any).error?.message || 'Error actualizando paciente';
            this.alertService.show(`${errorMessage} Por favor, verifica los datos e intenta nuevamente.`, 'error');
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorHandler.logError(error, 'actualizar paciente');
          
          // Verificar si es un error de autenticación real (solo si el interceptor no lo manejó)
          const status = error?.status || error?.error?.status;
          
          if (status === 401 || status === 403) {
            // Verificar si es realmente un error de autenticación o de validación
            const errorMessage = error?.error?.message || error?.message || '';
            const isValidationError = this.isValidationErrorMessage(errorMessage);
            
            if (isValidationError) {
              const validationMessage = this.extractValidationMessage(errorMessage);
              this.alertService.show(`${validationMessage} Por favor, corrige los datos e intenta nuevamente.`, 'error');
            } else {
              this.alertService.show('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'error');
            }
          } else if (status === 400 || status === 422) {
            const msg = (error?.error?.error?.message ?? error?.error?.message ?? error?.message ?? '') as string;
            if (msg.includes('teléfono') && (msg.includes('ya está') || msg.includes('registrado'))) {
              this.telefonoExists = true;
              this.telefonoChecked = true;
            }
            if (msg.includes('email') && (msg.includes('ya está') || msg.includes('registrado'))) {
              this.emailExists = true;
              this.emailChecked = true;
            }
            if (msg.includes('cédula') && (msg.includes('ya está') || msg.includes('registrada'))) {
              this.cedulaExists = true;
              this.cedulaChecked = true;
            }
            const validationMessage = this.extractValidationMessage(msg);
            this.alertService.show(`${validationMessage} Por favor, corrige los datos e intenta nuevamente.`, 'error');
          } else if (status >= 500) {
            this.alertService.show('Error del servidor. Por favor, intenta nuevamente en unos momentos. Si el problema persiste, contacta al administrador.', 'error');
          } else if (status === 0) {
            this.alertService.show('Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.', 'error');
          } else {
            const errMsg = error?.error?.error?.message ?? this.errorHandler.getSafeErrorMessage(error, 'actualizar paciente');
            this.alertService.show(`${errMsg} Por favor, intenta nuevamente.`, 'error');
          }
        }
      });
  }

  /**
   * Verifica si un mensaje de error indica un problema de validación
   */
  private isValidationErrorMessage(message: string): boolean {
    if (!message) return false;
    
    const validationKeywords = [
      'email',
      'cedula',
      'duplicate',
      'ya existe',
      'validation',
      'validación',
      'requerido',
      'required',
      'inválido',
      'invalid',
      'formato',
      'format',
      'vacío',
      'empty',
      'longitud',
      'length'
    ];
    
    const lowerMessage = message.toLowerCase();
    return validationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Extrae un mensaje de validación más claro del error
   */
  private extractValidationMessage(errorMessage: string): string {
    if (!errorMessage) {
      return 'Los datos proporcionados no son válidos.';
    }
    
    // Mensajes comunes y sus traducciones más claras
    const messageMap: Record<string, string> = {
      'email': 'El correo electrónico ya está siendo usado por otro paciente.',
      'cedula': 'La cédula ya está siendo usada por otro paciente.',
      'teléfono': 'El teléfono ya está siendo usado por otro paciente.',
      'telefono': 'El teléfono ya está siendo usado por otro paciente.',
      'duplicate': 'Ya existe un registro con estos datos.',
      'ya existe': 'Ya existe un registro con estos datos.',
      'requerido': 'Por favor, completa todos los campos requeridos.',
      'required': 'Por favor, completa todos los campos requeridos.',
      'inválido': 'Los datos proporcionados no son válidos.',
      'invalid': 'Los datos proporcionados no son válidos.'
    };
    
    // Buscar coincidencias en el mensaje
    for (const [key, value] of Object.entries(messageMap)) {
      if (errorMessage.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    // Si no hay coincidencia, devolver el mensaje original (sanitizado)
    return errorMessage.length > 200 
      ? errorMessage.substring(0, 200) + '...' 
      : errorMessage;
  }

  askForConsulta(patientId?: number | null) {
    const patientName = `${this.patient.nombres} ${this.patient.apellidos}`.trim();
    const message = `Paciente registrado exitosamente.\n\nPaciente: ${patientName || 'Nuevo paciente'}\n\n¿Desea agendar una consulta médica ahora?\n\n• Aceptar: Será redirigido al formulario de nueva consulta\n• Cancelar: Volverá a la lista de pacientes`;
    this.alertService.confirm(message, '¿Agendar consulta?').then((userWantsConsulta) => {
      if (userWantsConsulta) {
        const idToUse = patientId || this.patientId;
        if (idToUse) {
          this.router.navigate(['/admin/consultas/nueva'], { queryParams: { paciente_id: idToUse } });
        } else {
          this.router.navigate(['/admin/consultas/nueva']);
        }
      } else {
        this.askForAntecedentes(patientId || this.patientId);
      }
    });
  }

  askForAntecedentes(patientId?: number | null) {
    if (!patientId) {
      this.router.navigate(['/patients']);
      return;
    }
    const message = '¿Desea cargar los antecedentes del paciente ahora?\n\n• Aceptar: Irá a la pantalla de antecedentes (médicos, quirúrgicos, hábitos, otros)\n• Cancelar: Volverá a la lista de pacientes';
    this.alertService.confirm(message, '¿Cargar antecedentes?').then((wantsAntecedentes) => {
      if (wantsAntecedentes) {
        this.router.navigate(['/patients', patientId, 'antecedentes']);
      } else {
        this.router.navigate(['/patients']);
      }
    });
  }

  goToList() {
    this.router.navigate(['/patients']);
  }

  onCancel() {
    this.router.navigate(['/patients']);
  }

  // Validación de email
  validateEmail() {
    if (this.patient.email && this.patient.email.length > 0) {
      clearTimeout(this.emailValidationTimeout);
      this.emailValidationTimeout = setTimeout(() => {
        this.patientService.checkEmailAvailability(this.patient.email!).subscribe({
          next: (response) => {
            // response.exists = true significa que el email ya está registrado
            // En modo edición, debemos verificar que no sea el paciente actual
            if (this.isEdit && this.patientId && response.exists) {
              // Si estamos editando, necesitamos verificar si el email pertenece al paciente actual
              // Para esto, obtenemos el paciente por email para comparar IDs
              this.patientService.getPatientByEmail(this.patient.email!).subscribe({
                next: (patientResponse) => {
                  if (patientResponse.success && patientResponse.data) {
                    this.emailExists = patientResponse.data.id !== this.patientId;
                  } else {
                    this.emailExists = false;
                  }
                  this.emailChecked = true;
                },
                error: () => {
                  // Si hay error, asumimos que el email está disponible
                  this.emailExists = false;
                  this.emailChecked = true;
                }
              });
            } else {
              // En modo creación, si exists es true, el email está duplicado
              this.emailExists = response.exists;
              this.emailChecked = true;
            }
          },
          error: (error) => {
            // Solo loguear errores reales (500, problemas de red, etc.)
            this.errorHandler.logError(error, 'validar email');
            // En caso de error, asumimos que el email está disponible
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
    if (this.patient.cedula && this.patient.cedula.length > 0) {
      // Validar formato de cédula venezolana
      const cedulaPattern = /^[VEJPG][0-9]{3,8}$/;
      if (!cedulaPattern.test(this.patient.cedula)) {
        // Marcar como inválida si no cumple el formato
        console.log('Formato de cédula inválido');
        this.cedulaExists = false;
        this.cedulaChecked = false;
        return;
      }
      
      // Si el formato es válido, verificar duplicados
      clearTimeout(this.cedulaValidationTimeout);
      this.cedulaValidationTimeout = setTimeout(() => {
        this.patientService.searchPatientsByCedula(this.patient.cedula!).subscribe({
          next: (response) => {
            // Si es modo edición, excluir el paciente actual
            if (this.isEdit && this.patientId) {
              const otherPatients = response.data.filter(p => p.id !== this.patientId);
              this.cedulaExists = otherPatients.length > 0;
            } else {
              this.cedulaExists = response.data.length > 0;
            }
            this.cedulaChecked = true;
          },
          error: (error) => {
            // Solo loguear errores reales (no 404, que es esperado cuando no hay resultados)
            if (error.status !== 404 && error.status !== 0) {
              this.errorHandler.logError(error, 'validar cédula');
            }
            // Si hay error o no hay resultados, la cédula está disponible
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

  // Validación de teléfono (duplicado)
  validateTelefono() {
    const telefono = this.patient.telefono ? String(this.patient.telefono).replace(/\D/g, '').trim() : '';
    if (telefono.length >= 10) {
      clearTimeout(this.telefonoValidationTimeout);
      this.telefonoValidationTimeout = setTimeout(() => {
        this.patientService.searchPatientsByTelefono(this.patient.telefono!).subscribe({
          next: (response) => {
            if (this.isEdit && this.patientId) {
              const otherPatients = response.data.filter(p => p.id !== this.patientId);
              this.telefonoExists = otherPatients.length > 0;
            } else {
              this.telefonoExists = response.data.length > 0;
            }
            this.telefonoChecked = true;
          },
          error: () => {
            this.telefonoExists = false;
            this.telefonoChecked = true;
          }
        });
      }, 500);
    } else {
      this.telefonoExists = false;
      this.telefonoChecked = telefono.length === 0 ? false : true;
    }
  }

  // Método para formatear fechas
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE');
  }
}