import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RichTextEditorComponent } from '../../../../components/rich-text-editor/rich-text-editor.component';
import { InformeMedicoService } from '../../../../services/informe-medico.service';
import { PatientService } from '../../../../services/patient.service';
import { MedicoService } from '../../../../services/medico.service';
import { EspecialidadService } from '../../../../services/especialidad.service';
import { ContextualDataService, DatosContextuales } from '../../../../services/contextual-data.service';
import { AuthService } from '../../../../services/auth.service';
import { ErrorHandlerService } from '../../../../services/error-handler.service';
import { HistoricoService } from '../../../../services/historico.service';
import { 
  InformeMedico, 
  TemplateInforme, 
  CrearInformeRequest, 
  ActualizarInformeRequest,
  FiltrosTemplates 
} from '../../../../models/informe-medico.model';

@Component({
  selector: 'app-informe-medico-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RichTextEditorComponent],
  templateUrl: './informe-medico-form.component.html',
  styleUrls: ['./informe-medico-form.component.css']
})
export class InformeMedicoFormComponent implements OnInit {
  informeForm: FormGroup;
  informe: InformeMedico | null = null;
  pacientes: any[] = [];
  medicos: any[] = [];
  especialidades: any[] = [];
  
  // Estados
  cargando = false;
  guardando = false;
  error = '';
  esEdicion = false;
  informeId: number | null = null;
  
  // Valores para rich text editors
  contenidoValue = '';
  observacionesValue = '';

  // Filtros
  especialidadSeleccionada: number | null = null;
  medicosFiltrados: any[] = [];
  
  // Validación de historia médica
  tieneHistoriaMedica = false;
  mensajeHistoriaMedica = '';
  validandoHistoria = false;

  // Datos contextuales
  datosContextuales: DatosContextuales | null = null;
  sugerenciasDisponibles = false;
  historialDisponible = false;

  // Usuario actual
  usuarioActual: any = null;
  esUsuarioMedico = false;
  medicoActual: any = null;

  // Tipos de informe
  tiposInforme = [
    { valor: 'consulta', texto: 'Consulta Médica' },
    { valor: 'examen', texto: 'Examen Médico' },
    { valor: 'procedimiento', texto: 'Procedimiento' },
    { valor: 'seguimiento', texto: 'Seguimiento' },
    { valor: 'emergencia', texto: 'Emergencia' },
    { valor: 'control', texto: 'Control Médico' }
  ];

  // Estados de informe

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private informeMedicoService: InformeMedicoService,
    private patientService: PatientService,
    private medicoService: MedicoService,
    private especialidadService: EspecialidadService,
    public contextualDataService: ContextualDataService,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    private historicoService: HistoricoService
  ) {
    this.informeForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      tipo_informe: ['', Validators.required],
      contenido: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(10000)]],
      paciente_id: ['', Validators.required],
      medico_id: ['', Validators.required],
      fecha_emision: [new Date().toISOString().split('T')[0], Validators.required],
      observaciones: ['', Validators.maxLength(1000)]
    });
  }

  ngOnInit(): void {
    this.verificarUsuarioActual();
    this.cargarDatosIniciales();
    this.verificarModoEdicion();
  }

  verificarUsuarioActual(): void {
    this.authService.currentUser$.subscribe(user => {
      this.usuarioActual = user;
      if (user && user.rol === 'medico' && user.medico_id) {
        this.esUsuarioMedico = true;
        this.medicoActual = user;
        this.errorHandler.logInfo('Usuario médico detectado');
        // Deshabilitar el control de médico ya que está pre-seleccionado
        this.informeForm.get('medico_id')?.disable();
      } else {
        this.esUsuarioMedico = false;
        this.errorHandler.logInfo('Usuario no médico detectado', { rol: user?.rol });
        // Habilitar el control de médico (se deshabilitará si no hay médicos disponibles)
        this.actualizarEstadoControlMedico();
      }
    });
  }
  
  /**
   * Actualiza el estado disabled del control médico según disponibilidad
   */
  private actualizarEstadoControlMedico(): void {
    const medicoControl = this.informeForm.get('medico_id');
    if (!medicoControl) return;
    
    const sinMedicosDisponibles = !this.medicosFiltrados || this.medicosFiltrados.length === 0;
    
    if (sinMedicosDisponibles && !this.esUsuarioMedico) {
      medicoControl.disable();
    } else if (!this.esUsuarioMedico) {
      medicoControl.enable();
    }
  }

  cargarDatosIniciales(): void {
    this.cargando = true;
    
    // Cargar pacientes (usando patrón estándar del sistema)
    this.patientService.getPatientsByMedicoForStats(null).subscribe({
      next: (pacientes: any[]) => {
        this.pacientes = pacientes || [];
        this.errorHandler.logInfo('Pacientes cargados', { cantidad: this.pacientes.length });
      },
      error: (error: any) => {
        this.errorHandler.logError(error, 'cargar pacientes');
      }
    });

    // Cargar médicos - comportamiento diferente según el usuario
    if (this.esUsuarioMedico) {
      // Si es médico, solo cargar su información
      this.medicos = [this.medicoActual];
      this.medicosFiltrados = [this.medicoActual];
      // Pre-seleccionar el médico actual
      this.informeForm.patchValue({
        medico_id: this.medicoActual.medico_id
      });
      // El control ya está deshabilitado en verificarUsuarioActual()
    } else {
      // Si es admin/secretaria, no cargar médicos hasta seleccionar especialidad
      this.medicos = [];
      this.medicosFiltrados = [];
      // Deshabilitar el control hasta que haya médicos disponibles
      this.actualizarEstadoControlMedico();
    }

    // Cargar especialidades
    this.especialidadService.getAllEspecialidades().subscribe({
      next: (response: any) => {
        this.especialidades = response.data || [];
      },
      error: (error: any) => {
        console.error('Error cargando especialidades:', error);
      }
    });

    this.cargando = false;
  }


  verificarModoEdicion(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.esEdicion = true;
        this.informeId = parseInt(params['id']);
        this.cargarInforme();
      }
    });
  }

  cargarInforme(): void {
    if (!this.informeId) return;

    this.cargando = true;
    this.informeMedicoService.obtenerInformePorId(this.informeId).subscribe({
      next: (response) => {
        this.informe = response.data;
        this.cargarDatosEnFormulario();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando informe:', error);
        this.error = 'Error cargando el informe médico';
        this.cargando = false;
      }
    });
  }

  cargarDatosEnFormulario(): void {
    if (!this.informe) return;

    this.informeForm.patchValue({
      titulo: this.informe.titulo,
      tipo_informe: this.informe.tipo_informe,
      contenido: this.informe.contenido,
      paciente_id: this.informe.paciente_id,
      medico_id: this.informe.medico_id,
      fecha_emision: this.informe.fecha_emision.split('T')[0],
      observaciones: this.informe.observaciones
    });

    // Inicializar valores de rich text editors
    this.contenidoValue = this.informe.contenido || '';
    this.observacionesValue = this.informe.observaciones || '';
  }


  // Métodos para manejar cambios en rich text editors
  onContenidoChange(value: string): void {
    this.contenidoValue = value;
    this.informeForm.patchValue({ contenido: value });
  }

  onObservacionesChange(value: string): void {
    this.observacionesValue = value;
    this.informeForm.patchValue({ observaciones: value });
  }


  async guardarInforme(): Promise<void> {
    console.log('🚀 Iniciando guardarInforme...');
    
    if (!this.informeForm) {
      console.error('❌ Formulario no inicializado');
      return;
    }
    
    if (this.informeForm.invalid) {
      console.log('❌ Formulario inválido');
      this.marcarCamposComoTocados();
      return;
    }

    // Validación adicional para admin/secretaria: debe seleccionar especialidad
    if (!this.esUsuarioMedico && !this.especialidadSeleccionada) {
      alert('❌ Error: Debe seleccionar una especialidad antes de crear el informe.');
      return;
    }

    // Validación adicional: verificar que el paciente tenga historia médica para la especialidad
    if (!this.esUsuarioMedico && this.especialidadSeleccionada) {
      const pacienteId = this.informeForm.get('paciente_id')?.value;
      if (pacienteId && !this.tieneHistoriaMedica) {
        alert('❌ Error: El paciente no tiene historia médica registrada para esta especialidad. Debe crear primero una historia médica antes de poder generar un informe.');
        return;
      }
    }

    // Validación adicional: debe seleccionar médico
    if (!this.informeForm.get('medico_id')?.value) {
      alert('❌ Error: Debe seleccionar un médico antes de crear el informe.');
      return;
    }

    this.guardando = true;
    this.error = '';

    try {
      console.log('🚀 Iniciando proceso de guardado...');
      
      // Aplicar firma automáticamente al contenido antes de guardar
      const contenidoOriginal = this.informeForm.get('contenido')?.value;
      const medicoId = this.informeForm.get('medico_id')?.value;
      
      console.log('🔍 Datos del formulario:', {
        contenidoOriginal: contenidoOriginal ? 'Presente' : 'Ausente',
        medicoId: medicoId,
        esEdicion: this.esEdicion,
        informeId: this.informeId
      });
      
      if (medicoId && contenidoOriginal) {
        console.log('🔏 Aplicando firma automáticamente al guardar...');
        const contenidoConFirma = await this.aplicarFirmaAlInforme(contenidoOriginal, medicoId);
        this.informeForm.patchValue({ contenido: contenidoConFirma });
        console.log('✅ Firma aplicada automáticamente');
      }

      // Usar getRawValue() para obtener valores incluso de controles deshabilitados
      const datosFormulario = this.informeForm.getRawValue();
      console.log('📋 Datos del formulario completos:', datosFormulario);
      
      if (this.esEdicion && this.informeId) {
        console.log('📝 Modo edición - actualizando informe');
        this.actualizarInforme(datosFormulario);
      } else {
        console.log('➕ Modo creación - creando informe');
        this.crearInforme(datosFormulario);
      }
    } catch (error) {
      console.error('❌ Error aplicando firma automática:', error);
      // Continuar con el guardado aunque falle la firma
      // Usar getRawValue() para obtener valores incluso de controles deshabilitados
      const datosFormulario = this.informeForm.getRawValue();
      
      if (this.esEdicion && this.informeId) {
        this.actualizarInforme(datosFormulario);
      } else {
        this.crearInforme(datosFormulario);
      }
    }
  }

  crearInforme(datos: any): void {
    const informeRequest: CrearInformeRequest = {
      titulo: datos.titulo,
      tipo_informe: datos.tipo_informe,
      contenido: datos.contenido,
      paciente_id: parseInt(datos.paciente_id), // Convertir a número
      medico_id: parseInt(datos.medico_id), // Asegurar que sea número
      template_id: undefined, // Valor por defecto
      estado: 'finalizado', // Valor por defecto
      fecha_emision: datos.fecha_emision,
      observaciones: datos.observaciones
    };

    const informeCompleto = {
      ...informeRequest,
      estado: datos.estado || 'borrador', // Asegurar que el estado no sea undefined
      fecha_emision: datos.fecha_emision || new Date().toISOString().split('T')[0], // Asegurar que la fecha no sea undefined
      creado_por: parseInt(datos.medico_id) // Agregar campo requerido por el backend
    };
    
    // Log temporal para debugging
    console.log('🔍 Datos que se envían al backend:', JSON.stringify(informeCompleto, null, 2));
    
    this.informeMedicoService.crearInforme(informeCompleto).subscribe({
      next: (response) => {
        this.errorHandler.logInfo('Informe creado exitosamente', response);
        this.guardando = false;
        
        // Verificar que el ID existe antes de navegar
        const informeId = response?.id || response?.data?.id;
        if (response && informeId) {
          console.log('✅ ID del informe encontrado:', informeId);
          alert('✅ Informe médico creado exitosamente');
          this.router.navigate(['/admin/informes-medicos', informeId, 'resumen']);
        } else {
          console.error('❌ Error: No se recibió ID del informe creado');
          console.error('❌ Respuesta completa:', response);
          alert('✅ Informe creado exitosamente, pero hubo un problema con la navegación. Por favor, ve a la lista de informes.');
          this.router.navigate(['/admin/informes-medicos/lista']);
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'crear informe médico');
        this.error = 'Error creando el informe médico';
        this.guardando = false;
        
        // Log temporal para debugging del error
        console.log('❌ Error completo del backend:', error);
        console.log('❌ Error body:', error.error);
        console.log('❌ Error message:', error.message);
        
        // Mostrar alert con mensaje seguro
        const safeMessage = this.errorHandler.getSafeErrorMessage(error, 'crear informe médico');
        alert(safeMessage);
      }
    });
  }

  actualizarInforme(datos: any): void {
    if (!this.informeId) return;

    const informeRequest: ActualizarInformeRequest = {
      titulo: datos.titulo,
      tipo_informe: datos.tipo_informe,
      contenido: datos.contenido,
      estado: 'finalizado', // Valor por defecto
      observaciones: datos.observaciones
    };

    this.informeMedicoService.actualizarInforme(this.informeId, informeRequest).subscribe({
      next: (response) => {
        alert('Informe médico actualizado exitosamente');
        this.router.navigate(['/admin/informes-medicos']);
      },
      error: (error) => {
        console.error('Error actualizando informe:', error);
        this.error = 'Error actualizando el informe médico';
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    if (confirm('¿Está seguro de que desea cancelar? Los cambios no guardados se perderán.')) {
      this.router.navigate(['/admin/informes-medicos']);
    }
  }


  marcarCamposComoTocados(): void {
    if (!this.informeForm) return;
    Object.keys(this.informeForm.controls).forEach(key => {
      const control = this.informeForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  obtenerErrorCampo(campo: string): string {
    if (!this.informeForm) return '';
    const control = this.informeForm.get(campo);
    if (!control) return '';
    if (control.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.obtenerNombreCampo(campo)} es requerido`;
      }
      if (control.errors['minlength']) {
        return `${this.obtenerNombreCampo(campo)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['maxlength']) {
        return `${this.obtenerNombreCampo(campo)} no puede exceder ${control.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  obtenerNombreCampo(campo: string): string {
    const nombres: { [key: string]: string } = {
      'titulo': 'Título',
      'tipo_informe': 'Tipo de Informe',
      'contenido': 'Contenido',
      'paciente_id': 'Paciente',
      'medico_id': 'Médico',
      'estado': 'Estado',
      'fecha_emision': 'Fecha de Emisión',
      'observaciones': 'Observaciones'
    };
    return nombres[campo] || campo;
  }

  obtenerTipoInformeTexto(tipo: string): string {
    return this.informeMedicoService.obtenerTipoInformeTexto(tipo);
  }

  obtenerEstadoTexto(estado: string): string {
    return this.informeMedicoService.obtenerEstadoTexto(estado);
  }

  formatearFecha(fecha: string): string {
    return this.informeMedicoService.formatearFecha(fecha);
  }

  // =====================================================
  // MÉTODOS PARA DATOS CONTEXTUALES
  // =====================================================

  /**
   * Carga datos contextuales cuando se selecciona paciente y médico
   */
  async cargarDatosContextuales(): Promise<void> {
    const pacienteId = this.informeForm.get('paciente_id')?.value;
    const medicoId = this.informeForm.get('medico_id')?.value;

    console.log('🔍 Cargando datos contextuales:', { pacienteId, medicoId });

    if (pacienteId && medicoId) {
      try {
        console.log('📡 Llamando al servicio contextual...');
        this.datosContextuales = await this.contextualDataService.obtenerDatosContextualesSeguro(pacienteId, medicoId);
        this.errorHandler.logInfo('Datos contextuales obtenidos');
        
        if (this.datosContextuales) {
          this.sugerenciasDisponibles = this.contextualDataService.tieneSugerencias(this.datosContextuales);
          this.historialDisponible = this.contextualDataService.tieneHistorial(this.datosContextuales);
          console.log('✅ Sugerencias disponibles:', this.sugerenciasDisponibles);
          console.log('✅ Historial disponible:', this.historialDisponible);
          
          // Aplicar automáticamente las sugerencias al campo contenido
          await this.aplicarSugerenciasAutomaticamente();
        }
      } catch (error) {
        console.error('❌ Error cargando datos contextuales:', error);
        this.datosContextuales = null;
        this.sugerenciasDisponibles = false;
        this.historialDisponible = false;
      }
    } else {
      console.log('⚠️ Faltan datos: pacienteId o medicoId no seleccionados');
      this.datosContextuales = null;
      this.sugerenciasDisponibles = false;
      this.historialDisponible = false;
    }
  }

  /**
   * Aplica firma digital al contenido del informe
   */
  async aplicarFirmaAlInforme(contenido: string, medicoId: number): Promise<string> {
    console.log('🔏 Aplicando firma digital al informe...');
    
    try {
      // Obtener datos del médico
      const medico = this.medicos.find(m => m.id === medicoId);
      if (!medico) {
        console.log('⚠️ Médico no encontrado para firma');
        return contenido;
      }

      console.log('👨‍⚕️ Datos del médico para firma:', medico);
      console.log('🔏 Firma digital disponible:', !!medico.firma_digital);

      const firmaHTML = medico.firma_digital 
        ? this.generarFirmaConImagen(medico)
        : this.generarFirmaSistema(medico);

      const contenidoConFirma = contenido + `
        <div class="firma-medica">
          <hr style="margin: 30px 0; border: 1px solid #ddd;">
          <div style="text-align: center; margin: 20px 0;">
            ${firmaHTML}
          </div>
        </div>
      `;

      console.log('✅ Firma aplicada al informe');
      return contenidoConFirma;
    } catch (error) {
      console.error('❌ Error aplicando firma:', error);
      return contenido;
    }
  }

  /**
   * Genera firma con imagen personalizada
   */
  private generarFirmaConImagen(medico: any): string {
    return `
      <div class="firma-personalizada">
        <p><strong>Dr. ${medico.nombres} ${medico.apellidos}</strong></p>
        <p>Cédula Profesional: ${medico.cedula_profesional || 'No especificada'}</p>
        <p>Especialidad: ${medico.especialidad || 'No especificada'}</p>
        <div style="margin: 20px 0;">
          <img src="data:image/png;base64,${medico.firma_digital}" 
               alt="Firma del Dr. ${medico.nombres}" 
               style="max-width: 200px; max-height: 100px;">
        </div>
        <p><em>Firma Digital Personalizada</em></p>
        <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
      </div>
    `;
  }

  /**
   * Genera firma del sistema cuando no hay imagen personalizada
   */
  private generarFirmaSistema(medico: any): string {
    return `
      <div class="firma-sistema">
        <p><strong>Dr. ${medico.nombres} ${medico.apellidos}</strong></p>
        <p>Cédula Profesional: ${medico.cedula_profesional || 'No especificada'}</p>
        <p>Especialidad: ${medico.especialidad || 'No especificada'}</p>
        <p>Teléfono: ${medico.telefono || 'No especificada'}</p>
        <p>Email: ${medico.email || 'No especificada'}</p>
        <hr style="margin: 10px 0; width: 200px;">
        <p><strong>Firma Digital del Sistema</strong></p>
        <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
        <p><em>Documento generado electrónicamente</em></p>
      </div>
    `;
  }


  /**
   * Aplica sugerencias automáticamente al campo contenido
   */
  async aplicarSugerenciasAutomaticamente(): Promise<void> {
    console.log('🤖 Aplicando sugerencias automáticamente...');
    
    if (this.datosContextuales?.ultimoInforme) {
      const ultimoInforme = this.datosContextuales.ultimoInforme;
      console.log('📄 Último informe para auto-aplicar:', ultimoInforme);
      
      // Verificar si el campo contenido está vacío o tiene poco contenido
      const contenidoActual = this.informeForm.get('contenido')?.value;
      console.log('📝 Contenido actual:', contenidoActual);
      
      if (!contenidoActual || contenidoActual.trim().length < 50) {
        let contenidoSugerido = '';
        
        // Agregar datos del paciente
        if (this.datosContextuales.paciente) {
          console.log('👤 Datos del paciente para auto-aplicar:', this.datosContextuales.paciente);
          console.log('👤 Edad del paciente:', this.datosContextuales.paciente.edad);
          
          contenidoSugerido += `<h2>Datos del Paciente</h2>`;
          contenidoSugerido += `<p><strong>Nombre:</strong> ${this.datosContextuales.paciente.nombres} ${this.datosContextuales.paciente.apellidos}</p>`;
          contenidoSugerido += `<p><strong>Edad:</strong> ${this.datosContextuales.paciente.edad || 'No especificada'} años</p>`;
          contenidoSugerido += `<p><strong>Cédula:</strong> ${this.datosContextuales.paciente.cedula}</p>`;
          contenidoSugerido += `<p><strong>Teléfono:</strong> ${this.datosContextuales.paciente.telefono}</p>`;
          contenidoSugerido += `<p><strong>Email:</strong> ${this.datosContextuales.paciente.email}</p>`;
          contenidoSugerido += `<hr>`;
        }
        
        // Agregar datos del médico
        if (this.datosContextuales.medico) {
          contenidoSugerido += `<h2>Datos del Médico</h2>`;
          contenidoSugerido += `<p><strong>Dr.</strong> ${this.datosContextuales.medico.nombres} ${this.datosContextuales.medico.apellidos}</p>`;
          contenidoSugerido += `<p><strong>Especialidad:</strong> ${this.datosContextuales.medico.especialidad}</p>`;
          contenidoSugerido += `<hr>`;
        }
        
        // Agregar datos del último informe
        if (ultimoInforme.motivo_consulta) {
          contenidoSugerido += `<h3>Motivo de Consulta:</h3><p>${ultimoInforme.motivo_consulta}</p>`;
        }
        
        if (ultimoInforme.diagnostico) {
          contenidoSugerido += `<h3>Diagnóstico:</h3><p>${ultimoInforme.diagnostico}</p>`;
        }
        
        if (ultimoInforme.tratamiento) {
          contenidoSugerido += `<h3>Tratamiento:</h3><p>${ultimoInforme.tratamiento}</p>`;
        }
        
        if (ultimoInforme.conclusiones) {
          contenidoSugerido += `<h3>Conclusiones:</h3><p>${ultimoInforme.conclusiones}</p>`;
        }
        
        console.log('✨ Contenido auto-aplicado:', contenidoSugerido);
        
        if (contenidoSugerido) {
          // Aplicar firma digital al contenido
          const medicoId = this.informeForm.get('medico_id')?.value;
          if (medicoId) {
            const contenidoConFirma = await this.aplicarFirmaAlInforme(contenidoSugerido, medicoId);
            this.informeForm.patchValue({ contenido: contenidoConFirma });
            this.contenidoValue = contenidoConFirma;
            console.log('✅ Sugerencias y firma aplicadas automáticamente al formulario');
          } else {
            this.informeForm.patchValue({ contenido: contenidoSugerido });
            this.contenidoValue = contenidoSugerido;
            console.log('✅ Sugerencias aplicadas automáticamente al formulario (sin firma - médico no seleccionado)');
          }
        }
      } else {
        console.log('⚠️ El contenido ya tiene suficiente texto, no se aplican sugerencias automáticas');
      }
    } else {
      console.log('❌ No hay último informe disponible para auto-aplicar');
    }
  }

  /**
   * Aplica sugerencias del último informe al formulario
   */
  aplicarSugerencias(): void {
    console.log('🎯 Aplicando sugerencias...');
    console.log('📋 Datos contextuales:', this.datosContextuales);
    
    if (this.datosContextuales?.ultimoInforme) {
      const ultimoInforme = this.datosContextuales.ultimoInforme;
      console.log('📄 Último informe:', ultimoInforme);
      
      // Aplicar sugerencias a campos específicos si están vacíos
      const contenidoActual = this.informeForm.get('contenido')?.value;
      console.log('📝 Contenido actual:', contenidoActual);
      
      if (!contenidoActual || contenidoActual.trim().length < 50) {
        let contenidoSugerido = '';
        
        if (ultimoInforme.motivo_consulta) {
          contenidoSugerido += `<h3>Motivo de Consulta:</h3><p>${ultimoInforme.motivo_consulta}</p>`;
        }
        
        if (ultimoInforme.diagnostico) {
          contenidoSugerido += `<h3>Diagnóstico:</h3><p>${ultimoInforme.diagnostico}</p>`;
        }
        
        if (ultimoInforme.tratamiento) {
          contenidoSugerido += `<h3>Tratamiento:</h3><p>${ultimoInforme.tratamiento}</p>`;
        }
        
        if (ultimoInforme.conclusiones) {
          contenidoSugerido += `<h3>Conclusiones:</h3><p>${ultimoInforme.conclusiones}</p>`;
        }
        
        console.log('✨ Contenido sugerido:', contenidoSugerido);
        
        if (contenidoSugerido) {
          this.informeForm.patchValue({ contenido: contenidoSugerido });
          this.contenidoValue = contenidoSugerido;
          console.log('✅ Sugerencias aplicadas al formulario');
        }
      } else {
        console.log('⚠️ El contenido ya tiene suficiente texto, no se aplican sugerencias');
      }
    } else {
      console.log('❌ No hay último informe disponible');
    }
  }

  /**
   * Aplica una sugerencia específica
   */
  aplicarSugerenciaEspecifica(campo: string): void {
    console.log('🎯 Aplicando sugerencia específica para:', campo);
    
    if (this.datosContextuales?.ultimoInforme) {
      const ultimoInforme = this.datosContextuales.ultimoInforme;
      let valorSugerido = '';
      
      switch (campo) {
        case 'motivo_consulta':
          valorSugerido = ultimoInforme.motivo_consulta;
          break;
        case 'diagnostico':
          valorSugerido = ultimoInforme.diagnostico;
          break;
        case 'tratamiento':
          valorSugerido = ultimoInforme.tratamiento;
          break;
        case 'conclusiones':
          valorSugerido = ultimoInforme.conclusiones;
          break;
      }
      
      console.log('📝 Valor sugerido:', valorSugerido);
      
      if (valorSugerido) {
        // Agregar al contenido existente
        const contenidoActual = this.informeForm.get('contenido')?.value || '';
        const nuevoContenido = contenidoActual + `<h3>${this.obtenerNombreCampo(campo)}:</h3><p>${valorSugerido}</p>`;
        
        console.log('📄 Contenido actual:', contenidoActual);
        console.log('✨ Nuevo contenido:', nuevoContenido);
        
        this.informeForm.patchValue({ contenido: nuevoContenido });
        this.contenidoValue = nuevoContenido;
        console.log('✅ Sugerencia específica aplicada');
      } else {
        console.log('⚠️ No hay valor sugerido para el campo:', campo);
      }
    } else {
      console.log('❌ No hay datos contextuales disponibles');
    }
  }

  /**
   * Maneja el cambio de paciente
   */
  onPacienteSeleccionado(): void {
    const pacienteId = this.informeForm.get('paciente_id')?.value;
    const especialidadId = this.especialidadSeleccionada;
    
    // Si hay especialidad seleccionada, revalidar historia médica
    if (pacienteId && especialidadId) {
      this.validarHistoriaMedicaPorEspecialidad(pacienteId, especialidadId);
    } else {
      // Limpiar mensaje si no hay especialidad
      this.tieneHistoriaMedica = false;
      this.mensajeHistoriaMedica = '';
    }
    
    this.cargarDatosContextuales();
  }

  /**
   * Maneja el cambio de médico
   */
  onMedicoSeleccionado(): void {
    this.cargarDatosContextuales();
  }

  /**
   * Maneja el cambio de especialidad (solo para admin/secretaria)
   */
  onEspecialidadSeleccionada(): void {
    const especialidadId = this.especialidadSeleccionada;
    const pacienteId = this.informeForm.get('paciente_id')?.value;
    
    // Limpiar estado anterior
    this.tieneHistoriaMedica = false;
    this.mensajeHistoriaMedica = '';
    this.medicosFiltrados = [];
    this.informeForm.patchValue({ medico_id: '' });
    
    if (!especialidadId) {
      this.actualizarEstadoControlMedico();
      return;
    }
    
    // Si no hay paciente seleccionado, solo cargar médicos
    if (!pacienteId) {
      this.cargarMedicosPorEspecialidad(especialidadId);
      return;
    }
    
    // Validar historia médica antes de cargar médicos
    this.validarHistoriaMedicaPorEspecialidad(pacienteId, especialidadId);
  }
  
  /**
   * Valida si el paciente tiene historia médica para la especialidad seleccionada
   */
  validarHistoriaMedicaPorEspecialidad(pacienteId: number, especialidadId: number): void {
    this.validandoHistoria = true;
    this.tieneHistoriaMedica = false;
    this.mensajeHistoriaMedica = '';
    
    this.historicoService.verificarHistoriaPorEspecialidad(pacienteId, especialidadId).subscribe({
      next: (response: any) => {
        this.validandoHistoria = false;
        this.tieneHistoriaMedica = response.data?.tiene_historia || false;
        
        if (this.tieneHistoriaMedica) {
          // Si tiene historia, cargar médicos de la especialidad
          this.mensajeHistoriaMedica = '';
          this.cargarMedicosPorEspecialidad(especialidadId);
        } else {
          // Si no tiene historia, mostrar mensaje y no permitir seleccionar médico
          this.mensajeHistoriaMedica = '⚠️ El paciente no tiene historia médica registrada para esta especialidad. Debe crear primero una historia médica antes de poder generar un informe.';
          this.medicosFiltrados = [];
          this.informeForm.patchValue({ medico_id: '' });
          this.actualizarEstadoControlMedico();
        }
      },
      error: (error: any) => {
        this.validandoHistoria = false;
        console.error('Error verificando historia médica:', error);
        this.errorHandler.logError(error, 'verificar historia médica por especialidad');
        // En caso de error, permitir continuar pero mostrar advertencia
        this.mensajeHistoriaMedica = '⚠️ No se pudo verificar la historia médica. Por favor, verifique manualmente.';
        this.cargarMedicosPorEspecialidad(especialidadId);
      }
    });
  }
  
  /**
   * Carga los médicos de una especialidad
   */
  cargarMedicosPorEspecialidad(especialidadId: number): void {
    this.medicoService.getMedicosByEspecialidad(especialidadId).subscribe({
      next: (response: any) => {
        this.medicosFiltrados = response.data || [];
        // Limpiar selección de médico
        this.informeForm.patchValue({ medico_id: '' });
        // Actualizar estado disabled del control
        this.actualizarEstadoControlMedico();
      },
      error: (error: any) => {
        console.error('Error cargando médicos por especialidad:', error);
        this.medicosFiltrados = [];
        this.actualizarEstadoControlMedico();
      }
    });
  }

  /**
   * Formatea datos del paciente para mostrar
   */
  formatearDatosPaciente(): string {
    if (this.datosContextuales?.paciente) {
      return this.contextualDataService.formatearDatosPaciente(this.datosContextuales.paciente);
    }
    return '';
  }

  /**
   * Formatea datos del médico para mostrar
   */
  formatearDatosMedico(): string {
    if (this.datosContextuales?.medico) {
      return this.contextualDataService.formatearDatosMedico(this.datosContextuales.medico);
    }
    return '';
  }

  /**
   * Formatea fecha del último informe
   */
  formatearFechaUltimoInforme(): string {
    if (this.datosContextuales?.ultimoInforme) {
      return this.contextualDataService.formatearFecha(this.datosContextuales.ultimoInforme.fecha_consulta);
    }
    return '';
  }

  /**
   * Calcula días transcurridos desde el último informe
   */
  calcularDiasUltimoInforme(): number {
    if (this.datosContextuales?.ultimoInforme) {
      return this.contextualDataService.calcularDiasTranscurridos(this.datosContextuales.ultimoInforme.fecha_consulta);
    }
    return 0;
  }

  // Getters para validación (con verificación null-safe)
  get titulo() { return this.informeForm?.get('titulo'); }
  get tipo_informe() { return this.informeForm?.get('tipo_informe'); }
  get contenido() { return this.informeForm?.get('contenido'); }
  get paciente_id() { return this.informeForm?.get('paciente_id'); }
  get medico_id() { return this.informeForm?.get('medico_id'); }
  get estado() { return this.informeForm?.get('estado'); }
  get fecha_emision() { return this.informeForm?.get('fecha_emision'); }
  get observaciones() { return this.informeForm?.get('observaciones'); }
}
