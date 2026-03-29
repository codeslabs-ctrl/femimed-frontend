import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { RichTextEditorComponent } from '../../../../components/rich-text-editor/rich-text-editor.component';
import { InformeMedicoService } from '../../../../services/informe-medico.service';
import { PatientService } from '../../../../services/patient.service';
import { MedicoService } from '../../../../services/medico.service';
import { EspecialidadService } from '../../../../services/especialidad.service';
import { ContextualDataService, DatosContextuales } from '../../../../services/contextual-data.service';
import { AuthService } from '../../../../services/auth.service';
import { ErrorHandlerService } from '../../../../services/error-handler.service';
import { AlertService } from '../../../../services/alert.service';
import { HistoricoService } from '../../../../services/historico.service';
import { HistoricoAntecedenteService } from '../../../../services/historico-antecedente.service';
import { AntecedenteTipoService } from '../../../../services/antecedente-tipo.service';
import { ClinicaAtencionService, ClinicaAtencion } from '../../../../services/clinica-atencion.service';
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
  /** Timestamp del último reemplazo programático; ignoramos valueChange del editor durante 400 ms tras él para no sobrescribir con la versión (posiblemente truncada) de Quill */
  private ultimoReemplazoProgramatico = 0;

  // Filtros
  especialidadSeleccionada: number | null = null;
  medicosFiltrados: any[] = [];
  clinicasAtencion: ClinicaAtencion[] = [];
  
  // Validación de historia médica
  tieneHistoriaMedica = false;
  mensajeHistoriaMedica = '';
  validandoHistoria = false;

  // Datos contextuales
  datosContextuales: DatosContextuales | null = null;
  sugerenciasDisponibles = false;
  historialDisponible = false;

  // Checkboxes "Incluir en el informe" (origen: antecedente_paciente e historico_pacientes)
  incluirAntecedentes = false;
  historicoParaSecciones: any = null; // historico paciente-médico para antecedentes y datos
  /** IDs de controles (historico_pacientes) seleccionados para incluir en el informe */
  controlesSeleccionadosIds: number[] = [];
  /** Valor del dropdown "añadir control" (solo cuando hay muchos controles) */
  controlIdParaAnadir: number | null = null;

  @ViewChild('editorContenido') editorContenido?: RichTextEditorComponent;

  // Usuario actual
  usuarioActual: any = null;
  esUsuarioMedico = false;
  medicoActual: any = null;

  // Getters para habilitar/deshabilitar checks según datos disponibles
  get paciente_id() { return this.informeForm?.get('paciente_id'); }
  get medico_id() { return this.informeForm?.get('medico_id'); }
  get contenido() { return this.informeForm?.get('contenido'); }
  get titulo() { return this.informeForm?.get('titulo'); }
  get tipo_informe() { return this.informeForm?.get('tipo_informe'); }
  get fecha_emision() { return this.informeForm?.get('fecha_emision'); }
  get clinica_atencion_id() { return this.informeForm?.get('clinica_atencion_id'); }
  get observaciones() { return this.informeForm?.get('observaciones'); }
  /** True si el paciente tiene antecedentes cargados (para mostrar u ocultar el check). */
  tieneAntecedentes = false;
  get tieneHistorialConsultas(): boolean {
    const list = this.datosContextuales?.historialConsultas;
    return !!list && Array.isArray(list) && list.length > 0;
  }
  /** Si hay 5 o menos controles, se muestran checkboxes; si hay más, dropdown + lista */
  get usarCheckboxesControles(): boolean {
    const n = this.datosContextuales?.historialConsultas?.length ?? 0;
    return n > 0 && n <= 5;
  }
  /** Controles aún no añadidos, para el dropdown (orden: más recientes primero) */
  get controlesDisponiblesParaDropdown(): any[] {
    const list = this.datosContextuales?.historialConsultas ?? [];
    return list.filter((c: any) => !this.controlesSeleccionadosIds.includes(c.id));
  }
  /** Controles ya elegidos para el informe (orden por ID ascendente: menor a mayor) */
  get controlesIncluidos(): any[] {
    const list = this.datosContextuales?.historialConsultas ?? [];
    return list
      .filter((c: any) => this.controlesSeleccionadosIds.includes(c.id))
      .sort((a: any, b: any) => (a.id - b.id));
  }

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
    private historicoService: HistoricoService,
    private historicoAntecedenteService: HistoricoAntecedenteService,
    private antecedenteTipoService: AntecedenteTipoService,
    private clinicaAtencionService: ClinicaAtencionService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {
    this.informeForm = this.fb.group({
      titulo: [''],
      tipo_informe: [''],
      contenido: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(100000)]],
      paciente_id: ['', Validators.required],
      medico_id: ['', Validators.required],
      fecha_emision: [new Date().toISOString().split('T')[0], Validators.required],
      clinica_atencion_id: [null as number | null, Validators.required],
      observaciones: ['', Validators.maxLength(1000)]
    });
  }

  ngOnInit(): void {
    this.verificarUsuarioActual();
    this.cargarDatosIniciales();
    this.verificarModoEdicion();
    this.verificarQueryParams();
  }

  verificarQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['paciente_id']) {
        const pacienteId = parseInt(params['paciente_id']);
        if (pacienteId && !isNaN(pacienteId)) {
          // Esperar a que los pacientes se carguen antes de preseleccionar
          setTimeout(() => {
            this.informeForm.patchValue({
              paciente_id: pacienteId
            });
            // Disparar el evento de cambio para cargar datos contextuales
            const pacienteControl = this.informeForm.get('paciente_id');
            if (pacienteControl) {
              pacienteControl.updateValueAndValidity();
            }
          }, 500);
        }
      }
    });
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

    // Clínicas de atención (para dropdown)
    this.clinicaAtencionService.list(true).subscribe({
      next: (res) => { this.clinicasAtencion = res.data || []; },
      error: (err) => this.errorHandler.logError(err, 'cargar clínicas de atención')
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
      clinica_atencion_id: this.informe.clinica_atencion_id ?? null,
      observaciones: this.informe.observaciones
    });

    // Inicializar valores de rich text editors
    this.contenidoValue = this.informe.contenido || '';
    this.observacionesValue = this.informe.observaciones || '';
    // En edición, asegurar que el médico esté en la lista para firma/datos
    const medicoInforme = (this.informe as any).medicos;
    if (medicoInforme && !this.medicos.find((m: any) => m.id === medicoInforme.id)) {
      this.medicos = [...this.medicos, medicoInforme];
      this.medicosFiltrados = [...this.medicosFiltrados, medicoInforme];
    }
    // Cargar datos contextuales para el panel "Incluir en el informe" en edición
    this.cargarDatosContextuales();
  }


  // Métodos para manejar cambios en rich text editors
  onContenidoChange(value: string): void {
    if (Date.now() - this.ultimoReemplazoProgramatico < 400) return;
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

    // Validar clínica de atención primero: mostrar mensaje en pantalla y modal elegante
    const clinicaId = this.informeForm.get('clinica_atencion_id')?.value;
    if (clinicaId == null || clinicaId === '') {
      this.error = 'Debe seleccionar la clínica de atención.';
      this.marcarCamposComoTocados();
      this.cdr.detectChanges();
      this.alertService.showError('Debe seleccionar la clínica de atención.');
      return;
    }
    this.error = '';

    if (this.informeForm.invalid) {
      console.log('❌ Formulario inválido');
      this.marcarCamposComoTocados();
      return;
    }

    // Validación adicional para admin/secretaria: debe seleccionar especialidad
    if (!this.esUsuarioMedico && !this.especialidadSeleccionada) {
      this.alertService.showError('Debe seleccionar una especialidad antes de crear el informe.');
      return;
    }

    // Validación adicional: verificar que el paciente tenga historia médica para la especialidad
    if (!this.esUsuarioMedico && this.especialidadSeleccionada) {
      const pacienteId = this.informeForm.get('paciente_id')?.value;
      if (pacienteId && !this.tieneHistoriaMedica) {
        this.alertService.showError('El paciente no tiene historia médica registrada para esta especialidad. Debe crear primero una historia médica antes de poder generar un informe.');
        return;
      }
    }

    // Validación adicional: debe seleccionar médico
    if (!this.informeForm.get('medico_id')?.value) {
      this.alertService.showError('Debe seleccionar un médico antes de crear el informe.');
      return;
    }

    this.guardando = true;
    this.error = '';

    try {
      console.log('🚀 Iniciando proceso de guardado...');
      // Fuente de verdad al guardar: leer del editor (getValue) para enviar exactamente lo que se ve
      const contenidoDelEditor = (this.editorContenido?.getValue?.() ?? '').trim();
      const contenidoParaGuardar = contenidoDelEditor || (this.contenidoValue || this.informeForm.get('contenido')?.value || '').trim();
      const medicoId = this.informeForm.get('medico_id')?.value;

      if (medicoId && contenidoParaGuardar) {
        console.log('🔏 Aplicando firma automáticamente al guardar...');
        const contenidoConFirma = await this.aplicarFirmaAlInforme(contenidoParaGuardar, medicoId);
        this.informeForm.patchValue({ contenido: contenidoConFirma });
        this.contenidoValue = contenidoConFirma;
        console.log('✅ Firma aplicada automáticamente');
      }

      const datosFormulario = this.informeForm.getRawValue();
      // Usar contenido con firma si se aplicó; si no, el editor actual (evita guardar incompleto)
      const contenidoDelEditorActual = (this.editorContenido?.getValue?.() ?? '').trim();
      const contenidoFinal = (this.contenidoValue || contenidoDelEditorActual || datosFormulario.contenido || '').trim();
      if (contenidoFinal) datosFormulario.contenido = contenidoFinal;
      console.log('📋 Contenido a persistir (length):', contenidoFinal.length);
      
      if (this.esEdicion && this.informeId) {
        console.log('📝 Modo edición - actualizando informe');
        this.actualizarInforme(datosFormulario);
      } else {
        console.log('➕ Modo creación - creando informe');
        this.crearInforme(datosFormulario);
      }
    } catch (error) {
      console.error('❌ Error aplicando firma automática:', error);
      const datosFormulario = this.informeForm.getRawValue();
      const delEditor = (this.editorContenido?.getValue?.() ?? '').trim();
      const contenidoFinal = (delEditor || this.contenidoValue || datosFormulario.contenido || '').trim();
      if (contenidoFinal) datosFormulario.contenido = contenidoFinal;
      
      if (this.esEdicion && this.informeId) {
        this.actualizarInforme(datosFormulario);
      } else {
        this.crearInforme(datosFormulario);
      }
    }
  }

  crearInforme(datos: any): void {
    const pacienteId = parseInt(datos.paciente_id);
    const medicoId = parseInt(datos.medico_id);

    // El contenido ya viene con toda la información (datos del paciente, médico y historia médica)
    // desde aplicarSugerenciasAutomaticamente, por lo que NO debemos agregar nada más
    // Solo usamos el contenido tal cual está en el formulario
    let contenidoFinal = datos.contenido || '';
    
    // NO agregar historia médica aquí porque ya fue agregada por aplicarSugerenciasAutomaticamente
    // El contenido del formulario ya tiene todo lo necesario
    // Solo proceder a crear el informe con el contenido tal cual está
    this.continuarCreacionInforme(datos, pacienteId, medicoId, contenidoFinal);
  }

  private continuarCreacionInforme(datos: any, pacienteId: number, medicoId: number, contenidoFinal: string): void {
    // Verificar si el contenido tiene duplicación antes de guardar
    const tieneDuplicacion = this.detectarDuplicacionContenido(contenidoFinal);
    if (tieneDuplicacion) {
      console.warn('⚠️ ADVERTENCIA: El contenido parece tener duplicación. Limpiando...');
      contenidoFinal = this.limpiarContenidoDuplicado(contenidoFinal);
    }
    
    const informeRequest: CrearInformeRequest = {
      titulo: datos.titulo,
      tipo_informe: datos.tipo_informe,
      contenido: contenidoFinal,
      paciente_id: pacienteId,
      medico_id: medicoId,
      template_id: undefined,
      estado: 'finalizado',
      fecha_emision: datos.fecha_emision,
      clinica_atencion_id: datos.clinica_atencion_id ?? null,
      observaciones: datos.observaciones
    };

    const informeCompleto = {
      ...informeRequest,
      estado: datos.estado || 'borrador',
      fecha_emision: datos.fecha_emision || new Date().toISOString().split('T')[0],
      creado_por: medicoId
    };
    
    console.log('🔍 Datos que se envían al backend:');
    console.log('📄 Contenido (primeros 1000 caracteres):', contenidoFinal.substring(0, 1000));
    console.log('📄 Longitud del contenido:', contenidoFinal.length);
    
    this.informeMedicoService.crearInforme(informeCompleto).subscribe({
      next: (response) => {
        this.errorHandler.logInfo('Informe creado exitosamente', response);
        this.guardando = false;
        
        const informeId = response?.id || response?.data?.id;
        if (response && informeId) {
          console.log('✅ ID del informe encontrado:', informeId);
          this.alertService.showSuccess('Informe médico creado exitosamente', { navigateTo: `/admin/informes-medicos/${informeId}/resumen` });
        } else {
          console.error('❌ Error: No se recibió ID del informe creado');
          this.alertService.showSuccess('Informe creado exitosamente, pero hubo un problema con la navegación. Por favor, ve a la lista de informes.', { navigateTo: '/admin/informes-medicos/lista' });
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'crear informe médico');
        this.error = 'Error creando el informe médico';
        this.guardando = false;
        const safeMessage = this.errorHandler.getSafeErrorMessage(error, 'crear informe médico');
        this.alertService.showError(safeMessage);
      }
    });
  }

  actualizarInforme(datos: any): void {
    if (!this.informeId) return;

    const contenidoDelEditor = (this.editorContenido?.getValue?.() ?? '').trim();
    const contenidoActual = (datos.contenido ?? contenidoDelEditor ?? this.contenidoValue ?? '') || '';
    const contenidoStr = typeof contenidoActual === 'string' ? contenidoActual : String(contenidoActual);

    const informeRequest: ActualizarInformeRequest = {
      observaciones: datos.observaciones ?? '',
      contenido: contenidoStr
    };
    const puedeEditarContenido = this.informe && this.informe.estado !== 'firmado' && this.informe.estado !== 'enviado';
    if (puedeEditarContenido) {
      if (datos.titulo !== undefined && datos.titulo !== null) informeRequest.titulo = String(datos.titulo);
      if (datos.tipo_informe !== undefined && datos.tipo_informe !== null) informeRequest.tipo_informe = String(datos.tipo_informe);
    }
    if (datos.clinica_atencion_id !== undefined) informeRequest.clinica_atencion_id = datos.clinica_atencion_id ?? null;

    console.log('[actualizarInforme] Enviando PUT keys:', Object.keys(informeRequest), 'contenido length:', informeRequest.contenido?.length ?? 0);

    this.informeMedicoService.actualizarInforme(this.informeId, informeRequest).subscribe({
      next: (response) => {
        this.alertService.showSuccess('Informe médico actualizado exitosamente', { navigateTo: '/admin/informes-medicos' });
      },
      error: (error) => {
        console.error('Error actualizando informe:', error);
        this.error = 'Error actualizando el informe médico';
        this.guardando = false;
        const mensaje = this.errorHandler.getSafeErrorMessage(error, 'actualizar informe médico');
        this.alertService.showError(mensaje);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/informes-medicos']);
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
      'clinica_atencion_id': 'Clínica de atención',
      'observaciones': 'Observaciones',
      'examenes_paraclinicos': 'Exámenes paraclínicos',
      'examenes_medico': 'Examen físico'
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
        this.datosContextuales = await this.contextualDataService.obtenerDatosContextualesSeguro(pacienteId, medicoId, 36);
        this.controlesSeleccionadosIds = [];
        this.controlIdParaAnadir = null;
        this.errorHandler.logInfo('Datos contextuales obtenidos');
        
        if (this.datosContextuales) {
          this.sugerenciasDisponibles = this.contextualDataService.tieneSugerencias(this.datosContextuales);
          this.historialDisponible = this.contextualDataService.tieneHistorial(this.datosContextuales);
          console.log('✅ Sugerencias disponibles:', this.sugerenciasDisponibles);
          console.log('✅ Historial disponible:', this.historialDisponible);
          // Histórico paciente-médico para construir sección de antecedentes al añadir
          try {
            const historicoRes = await firstValueFrom(
              this.historicoService.getHistoricoByPacienteAndMedico(parseInt(pacienteId), parseInt(medicoId))
            );
            this.historicoParaSecciones = historicoRes?.data ?? null;
          } catch {
            this.historicoParaSecciones = null;
          }
          // ¿El paciente tiene antecedentes cargados? (para mostrar u ocultar el check)
          try {
            const antRes = await firstValueFrom(this.historicoAntecedenteService.getByPacienteId(parseInt(pacienteId)));
            const data = (antRes?.success && antRes?.data) ? antRes.data : null;
            const lista = data && typeof data === 'object' && (data as any).antecedentes ? (data as any).antecedentes : [];
            const otros = data && typeof data === 'object' && (data as any).antecedentes_otros != null ? String((data as any).antecedentes_otros).trim() : '';
            this.tieneAntecedentes = (lista.some((a: any) => !!a.presente)) || otros.length > 0;
            if (!this.tieneAntecedentes) this.incluirAntecedentes = false;
          } catch {
            this.tieneAntecedentes = false;
            this.incluirAntecedentes = false;
          }
          this.cdr.detectChanges();
        }
      } catch (error) {
        console.error('❌ Error cargando datos contextuales:', error);
        this.datosContextuales = null;
        this.sugerenciasDisponibles = false;
        this.historialDisponible = false;
        this.historicoParaSecciones = null;
        this.tieneAntecedentes = false;
      }
    } else {
      console.log('⚠️ Faltan datos: pacienteId o medicoId no seleccionados');
      this.datosContextuales = null;
      this.sugerenciasDisponibles = false;
      this.historialDisponible = false;
      this.historicoParaSecciones = null;
      this.tieneAntecedentes = false;
      this.controlesSeleccionadosIds = [];
      this.controlIdParaAnadir = null;
    }
  }

  haySeccionSeleccionada(): boolean {
    return !!(
      (this.incluirAntecedentes && this.tieneAntecedentes) ||
      this.controlesSeleccionadosIds.length > 0
    );
  }

  /** Navega a la página de antecedentes del paciente para añadirlos; tras guardar/cancelar vuelve aquí (nuevo o editar informe). */
  irAAnadirAntecedentes(): void {
    const pacienteId = this.informeForm.get('paciente_id')?.value;
    if (!pacienteId) return;
    const returnUrl = this.router.url;
    this.router.navigate(['/patients', pacienteId, 'antecedentes'], { queryParams: { returnUrl } });
  }

  isControlSeleccionado(id: number): boolean {
    return this.controlesSeleccionadosIds.includes(id);
  }

  toggleControlId(id: number): void {
    const idx = this.controlesSeleccionadosIds.indexOf(id);
    if (idx === -1) {
      this.controlesSeleccionadosIds = [...this.controlesSeleccionadosIds, id];
    } else {
      this.controlesSeleccionadosIds = this.controlesSeleccionadosIds.filter(x => x !== id);
    }
  }

  anadirControlDesdeDropdown(controlId: number): void {
    if (controlId && !this.controlesSeleccionadosIds.includes(controlId)) {
      this.controlesSeleccionadosIds = [...this.controlesSeleccionadosIds, controlId];
    }
  }

  onAnadirControlFromDropdown(): void {
    if (this.controlIdParaAnadir) {
      this.anadirControlDesdeDropdown(this.controlIdParaAnadir);
      this.controlIdParaAnadir = null;
    }
  }

  quitarControlIncluido(id: number): void {
    this.controlesSeleccionadosIds = this.controlesSeleccionadosIds.filter(x => x !== id);
  }

  /** Etiqueta para identificar el control: titulo-YYYYMMDD-id (ej. primera_vez-20260312-54) */
  etiquetaControl(c: any): string {
    if (!c) return '';
    const titulo = (c.titulo ?? 'control').toString().trim() || 'control';
    const d = c.fecha_consulta ? new Date(c.fecha_consulta) : null;
    const yyyymmdd = d ? d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') : '';
    const id = c.id ?? '';
    return `${titulo}-${yyyymmdd}-${id}`;
  }

  /** Primeras palabras del motivo para etiqueta en dropdown */
  resumenMotivo(c: any, maxLen: number = 40): string {
    const t = this.stripHtmlTexto(c?.motivo_consulta);
    if (!t) return '';
    return t.length <= maxLen ? t : t.slice(0, maxLen) + '…';
  }

  /** Convierte a texto plano para evitar HTML anidado que corte el contenido en el editor */
  private stripHtmlTexto(val: string | null | undefined): string {
    if (val == null || typeof val !== 'string') return '';
    return val.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  async anadirSeccionesSeleccionadas(): Promise<void> {
    if (!this.haySeccionSeleccionada()) return;
    const partes: string[] = [];
    const pacienteId = this.informeForm.get('paciente_id')?.value;
    const medicoId = this.informeForm.get('medico_id')?.value;

    if (this.incluirAntecedentes && this.historicoParaSecciones?.id) {
      const { html: antHtml, antecedentes_otros } = await this.buildAntecedentesEstandarizadosHTML(this.historicoParaSecciones.id);
      if (antHtml) partes.push(antHtml);
      if (antecedentes_otros && String(antecedentes_otros).trim() !== '' && String(antecedentes_otros).trim() !== '<p></p>') {
        const otrosTexto = this.stripHtmlTexto(antecedentes_otros);
        if (otrosTexto) partes.push(`<h3><strong>Otros antecedentes:</strong></h3><p>${this.escapeHtml(otrosTexto)}</p>`);
      }
    }
    if (this.controlesSeleccionadosIds.length && this.datosContextuales?.historialConsultas?.length) {
      const controlesIncluidos = this.controlesIncluidos;
      if (controlesIncluidos.length) {
        controlesIncluidos.forEach((c: any) => {
          const fecha = c.fecha_consulta ? this.contextualDataService.formatearFecha(c.fecha_consulta) : '';
          if (fecha) partes.push(`<p><strong>${this.escapeHtml(fecha)}</strong></p>`);
          const motivo = this.stripHtmlTexto(c.motivo_consulta);
          if (motivo) partes.push(`<p><strong>Resumen Clínico:</strong> ${this.escapeHtml(motivo)}</p>`);
          const paraclin = this.stripHtmlTexto(c.examenes_paraclinicos);
          if (paraclin) partes.push(`<p><strong>Exámenes paraclínicos:</strong> ${this.escapeHtml(paraclin)}</p>`);
          const examFis = this.stripHtmlTexto(c.examenes_medico);
          if (examFis) partes.push(`<p><strong>Examen físico:</strong> ${this.escapeHtml(examFis)}</p>`);
          const diag = this.stripHtmlTexto(c.diagnostico);
          if (diag) partes.push(`<p><strong>Diagnóstico:</strong> ${this.escapeHtml(diag)}</p>`);
          const trat = this.stripHtmlTexto(c.tratamiento);
          if (trat) partes.push(`<p><strong>Tratamiento:</strong> ${this.escapeHtml(trat)}</p>`);
          const concl = this.stripHtmlTexto(c.conclusiones);
          if (concl) partes.push(`<p><strong>Conclusiones:</strong> ${this.escapeHtml(concl)}</p>`);
          partes.push('<p><br></p>');
        });
      }
    }
    if (partes.length === 0) return;
    const html = partes.join('');
    // Reemplazar todo el contenido (no concatenar). Marcar reemplazo para no sobrescribir con lo que emita Quill (puede venir truncado).
    this.ultimoReemplazoProgramatico = Date.now();
    this.contenidoValue = html;
    this.informeForm.patchValue({ contenido: html });
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.editorContenido) {
        this.editorContenido.setValue(html);
      }
    }, 0);
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

  /** Valor considerado "no especificado" para no mostrarlo en la firma. */
  private static readonly NO_ESPECIFICADA = 'No especificada';

  /**
   * Genera firma con imagen personalizada. Siempre incluye nombre del médico; solo incluye Cédula/Especialidad si existen y no son "No especificada".
   */
  private generarFirmaConImagen(medico: any): string {
    const partes: string[] = [];
    partes.push(`<p><strong>${medico.sexo === 'Femenino' ? 'Dra.' : 'Dr.'} ${medico.nombres} ${medico.apellidos}</strong></p>`);
    if (medico.cedula_profesional && medico.cedula_profesional.trim() !== '' && medico.cedula_profesional !== InformeMedicoFormComponent.NO_ESPECIFICADA) {
      partes.push(`<p>Cédula Profesional: ${medico.cedula_profesional}</p>`);
    }
    if (medico.especialidad && medico.especialidad.trim() !== '' && medico.especialidad !== InformeMedicoFormComponent.NO_ESPECIFICADA) {
      partes.push(`<p>Especialidad: ${medico.especialidad}</p>`);
    }
    partes.push('<div style="margin: 20px 0;">');
    partes.push(`<img src="data:image/png;base64,${medico.firma_digital}" alt="Firma" style="max-width: 200px; max-height: 100px;">`);
    partes.push('</div>');
    return `<div class="firma-personalizada">${partes.join('')}</div>`;
  }

  /**
   * Genera firma del sistema cuando no hay imagen. Siempre incluye nombre; solo Cédula, Especialidad, Teléfono, Email si existen y no son "No especificada".
   */
  private generarFirmaSistema(medico: any): string {
    const partes: string[] = [];
    partes.push(`<p><strong>${medico.sexo === 'Femenino' ? 'Dra.' : 'Dr.'} ${medico.nombres} ${medico.apellidos}</strong></p>`);
    if (medico.cedula_profesional && medico.cedula_profesional.trim() !== '' && medico.cedula_profesional !== InformeMedicoFormComponent.NO_ESPECIFICADA) {
      partes.push(`<p>Cédula Profesional: ${medico.cedula_profesional}</p>`);
    }
    if (medico.especialidad && medico.especialidad.trim() !== '' && medico.especialidad !== InformeMedicoFormComponent.NO_ESPECIFICADA) {
      partes.push(`<p>Especialidad: ${medico.especialidad}</p>`);
    }
    if (medico.telefono && medico.telefono.trim() !== '' && medico.telefono !== InformeMedicoFormComponent.NO_ESPECIFICADA) {
      partes.push(`<p>Teléfono: ${medico.telefono}</p>`);
    }
    if (medico.email && medico.email.trim() !== '' && medico.email !== InformeMedicoFormComponent.NO_ESPECIFICADA) {
      partes.push(`<p>Email: ${medico.email}</p>`);
    }
    return `<div class="firma-sistema">${partes.join('')}</div>`;
  }

  /**
   * Construye HTML de antecedentes estandarizados (antecedente_paciente) e incluye antecedentes_otros del paciente.
   */
  private async buildAntecedentesEstandarizadosHTML(historicoId: number): Promise<{ html: string; antecedentes_otros: string | null }> {
    try {
      const [antRes, tiposMedRes, tiposQuirurRes, tiposHabRes] = await Promise.all([
        firstValueFrom(this.historicoAntecedenteService.getByHistoricoId(historicoId)),
        firstValueFrom(this.antecedenteTipoService.getByTipo('antecedentes_medicos')),
        firstValueFrom(this.antecedenteTipoService.getByTipo('antecedentes_quirurgicos')),
        firstValueFrom(this.antecedenteTipoService.getByTipo('habitos_psicobiologicos'))
      ]);
      const data = (antRes?.success && antRes?.data) ? antRes.data : null;
      const lista = data && typeof data === 'object' && (data as any).antecedentes
        ? (data as any).antecedentes
        : (Array.isArray(data) ? data : []);
      const antecedentes_otros = data && typeof data === 'object' && (data as any).antecedentes_otros !== undefined
        ? (data as any).antecedentes_otros
        : null;
      const tiposMed = (tiposMedRes?.success && tiposMedRes?.data) ? tiposMedRes.data : [];
      const tiposQuirur = (tiposQuirurRes?.success && tiposQuirurRes?.data) ? tiposQuirurRes.data : [];
      const tiposHab = (tiposHabRes?.success && tiposHabRes?.data) ? tiposHabRes.data : [];
      const tipoId = (x: number | string | undefined) => (x != null ? Number(x) : NaN);
      const mapaNombres: Record<number, string> = {};
      [...tiposMed, ...tiposQuirur, ...tiposHab].forEach(t => { const id = tipoId(t.id); if (!isNaN(id)) mapaNombres[id] = t.nombre; });

      const lineasMed: string[] = [];
      const lineasQuirur: string[] = [];
      const lineasHab: string[] = [];
      lista.forEach((a: { antecedente_tipo_id: number; presente: boolean; detalle?: string | null }) => {
        const aTipoId = tipoId((a as any).antecedente_tipo_id);
        const nombre = mapaNombres[aTipoId] || `Ítem ${aTipoId}`;
        let detalleTexto = a.detalle?.trim() ?? '';
        if (detalleTexto) {
          try {
            const parsed = JSON.parse(detalleTexto);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const partes = (parsed as { tipo_cirugia?: string; ano?: string }[]).map(
                x => `${(x.tipo_cirugia || '').trim()}${x.ano ? ` (${x.ano})` : ''}`
              ).filter(Boolean);
              if (partes.length) detalleTexto = partes.join('; ');
            }
          } catch { /* mantener detalleTexto original */ }
        }
        const texto = a.presente
          ? (detalleTexto ? `${nombre}: Sí. ${detalleTexto}` : `${nombre}: Sí`)
          : `${nombre}: No`;
        const linea = `<p>• ${this.escapeHtml(texto)}</p>`;
        if (tiposMed.some(t => tipoId(t.id) === aTipoId)) lineasMed.push(linea);
        else if (tiposQuirur.some(t => tipoId(t.id) === aTipoId)) lineasQuirur.push(linea);
        else lineasHab.push(linea);
      });

      let html = '';
      if (lineasMed.length > 0) {
        html += `<p><strong>Antecedentes Médicos:</strong></p>${lineasMed.join('')}`;
      }
      if (lineasQuirur.length > 0) {
        html += `<p><strong>Antecedentes Quirúrgicos:</strong></p>${lineasQuirur.join('')}`;
      }
      if (lineasHab.length > 0) {
        html += `<p><strong>Hábitos Psicobiológicos:</strong></p>${lineasHab.join('')}`;
      }
      return { html, antecedentes_otros };
    } catch {
      return { html: '', antecedentes_otros: null };
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Construye el texto narrativo de antecedentes (anamnesis) para el informe narrativo.
   * Usa género del paciente (la/el paciente, identificada/identificado, niega/refiere).
   */
  private async buildAntecedentesNarrativo(historicoId: number, sexoPaciente?: string | null): Promise<string> {
    try {
      const [antRes, tiposMedRes, tiposQuirurRes, tiposHabRes] = await Promise.all([
        firstValueFrom(this.historicoAntecedenteService.getByHistoricoId(historicoId)),
        firstValueFrom(this.antecedenteTipoService.getByTipo('antecedentes_medicos')),
        firstValueFrom(this.antecedenteTipoService.getByTipo('antecedentes_quirurgicos')),
        firstValueFrom(this.antecedenteTipoService.getByTipo('habitos_psicobiologicos'))
      ]);
      const data = (antRes?.success && antRes?.data) ? antRes.data : null;
      const lista = data && typeof data === 'object' && (data as any).antecedentes
        ? (data as any).antecedentes
        : (Array.isArray(data) ? data : []);
      const tiposMed = (tiposMedRes?.success && tiposMedRes?.data) ? tiposMedRes.data : [];
      const tiposQuirur = (tiposQuirurRes?.success && tiposQuirurRes?.data) ? tiposQuirurRes.data : [];
      const tiposHab = (tiposHabRes?.success && tiposHabRes?.data) ? tiposHabRes.data : [];
      const tipoId = (x: number | string | undefined) => (x != null ? Number(x) : NaN);
      const mapaNombres: Record<number, string> = {};
      [...tiposMed, ...tiposQuirur, ...tiposHab].forEach(t => { const id = tipoId(t.id); if (!isNaN(id)) mapaNombres[id] = t.nombre; });

      const esFemenino = (sexoPaciente || '').toString().toLowerCase().includes('femenino');
      const articulo = esFemenino ? 'la' : 'el';
      const pacienteSujeto = `${articulo} paciente`;
      const identificado = esFemenino ? 'identificada' : 'identificado';

      const medNombresNeg: string[] = [];
      const medNombresPos: string[] = [];
      let quirurAlgunoPos = false;
      let quirurDetalle: string[] = [];
      const habNombresNeg: string[] = [];
      const habNombresPos: string[] = [];

      lista.forEach((a: { antecedente_tipo_id: number; presente: boolean; detalle?: string | null }) => {
        const aTipoId = tipoId((a as any).antecedente_tipo_id);
        const nombre = mapaNombres[aTipoId] || `Ítem ${aTipoId}`;
        let detalleTexto = (a.detalle || '').trim();
        if (detalleTexto) {
          try {
            const parsed = JSON.parse(detalleTexto);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const partes = (parsed as { tipo_cirugia?: string; ano?: string }[]).map(
                x => `${(x.tipo_cirugia || '').trim()}${x.ano ? ` (${x.ano})` : ''}`
              ).filter(Boolean);
              if (partes.length) detalleTexto = partes.join('; ');
            }
          } catch { /* mantener */ }
        }
        if (tiposMed.some(t => tipoId(t.id) === aTipoId)) {
          if (a.presente) medNombresPos.push(nombre); else medNombresNeg.push(nombre);
        } else if (tiposQuirur.some(t => tipoId(t.id) === aTipoId)) {
          if (a.presente) { quirurAlgunoPos = true; quirurDetalle.push(detalleTexto ? `${nombre}: ${detalleTexto}` : nombre); } else { /* no quirúrgico */ }
        } else {
          if (a.presente) habNombresPos.push(nombre); else habNombresNeg.push(nombre);
        }
      });

      const frases: string[] = [];
      if (medNombresNeg.length > 0 || medNombresPos.length > 0) {
        if (medNombresNeg.length > 0) {
          const listaNeg = medNombresNeg.join(', ').replace(/, ([^,]*)$/, ' o $1');
          frases.push(`${pacienteSujeto} niega antecedentes patológicos de relevancia, tales como ${listaNeg}`);
        }
        if (medNombresPos.length > 0) {
          const listaPos = medNombresPos.join(', ');
          frases.push(`refiere ${listaPos}`);
        }
      }
      if (quirurAlgunoPos && quirurDetalle.length > 0) {
        frases.push(`refiere antecedentes quirúrgicos previos: ${quirurDetalle.join('; ')}`);
      } else {
        frases.push('no reporta antecedentes quirúrgicos previos');
      }
      if (habNombresPos.length > 0) {
        frases.push(`refiere hábitos: ${habNombresPos.join(', ')}`);
      } else if (habNombresNeg.length > 0) {
        frases.push('no refiere hábitos psicobiológicos tabáquicos, alcohólicos ni de consumo de sustancias ilícitas');
      } else {
        frases.push('no refiere hábitos psicobiológicos tabáquicos, alcohólicos ni de consumo de sustancias ilícitas');
      }

      if (frases.length === 0) return '';
      if (frases.length === 1) return `En la anamnesis dirigida, ${frases[0]}.`;
      return `En la anamnesis dirigida, ${frases[0]}; asimismo, ${frases.slice(1).join('. ')}.`;
    } catch {
      return '';
    }
  }

  /**
   * Genera un bloque narrativo por control (una fecha + párrafo). Primer control puede incluir intro paciente y antecedentes.
   */
  private generarBloqueNarrativoControl(
    c: any,
    fechaStr: string,
    opts: { incluirIntroPaciente: boolean; antecedentesNarrativo: string; paciente: any }
  ): string {
    const motivo = this.stripHtmlTexto(c.motivo_consulta);
    const paraclin = this.stripHtmlTexto(c.examenes_paraclinicos);
    const examFis = this.stripHtmlTexto(c.examenes_medico);
    const diag = this.stripHtmlTexto(c.diagnostico);
    const plan = this.stripHtmlTexto(c.tratamiento);
    const edad = opts.paciente?.edad ?? opts.paciente?.edad_anos ?? '';
    const cedula = (opts.paciente?.cedula || '').trim();
    const esFemenino = ((opts.paciente as any)?.sexo || '').toString().toLowerCase().includes('femenino');
    const identificado = esFemenino ? 'identificada' : 'identificado';

    const parrafos: string[] = [];
    parrafos.push(`<p><strong>${this.escapeHtml(fechaStr)}</strong></p>`);

    if (opts.incluirIntroPaciente) {
      let intro = `Paciente ${esFemenino ? 'femenino' : 'masculino'} de ${edad} años de edad`;
      if (cedula) intro += `, ${identificado} bajo la cédula ${this.escapeHtml(cedula)}`;
      intro += `, quien acude a consulta el ${fechaStr}.`;
      if (opts.antecedentesNarrativo) intro += ` ${opts.antecedentesNarrativo}`;
      parrafos.push(`<p>${intro}</p>`);
    }

    const cuerpo: string[] = [];
    if (motivo) cuerpo.push(`Se trata de ${motivo.toLowerCase().replace(/^\.\s*/, '').replace(/\.$/, '')}.`);
    if (paraclin) {
      cuerpo.push(`En los exámenes paraclínicos complementarios se registra: ${this.escapeHtml(paraclin)}.`);
    }
    if (examFis) {
      cuerpo.push(`Al examen físico se constata: ${this.escapeHtml(examFis)}.`);
    }
    if (diag) cuerpo.push(`En la consulta se establece el diagnóstico de "${this.escapeHtml(diag)}".`);
    if (plan) cuerpo.push(`En vista de los hallazgos, se indica y se da inicio al plan de "${this.escapeHtml(plan)}".`);
    if (cuerpo.length > 0) parrafos.push(`<p>${cuerpo.join(' ')}</p>`);

    return parrafos.join('');
  }

  /**
   * Genera el contenido del informe en formato narrativo (un bloque por control) y lo asigna al editor.
   */
  async generarInformeNarrativo(): Promise<void> {
    const paciente = this.datosContextuales?.paciente;
    const controles = this.controlesIncluidos;
    if (!paciente || !controles.length) {
      this.alertService.showWarning(
        'Seleccione paciente, médico, al menos un control e incluya antecedentes si desea que aparezcan en el primer bloque.'
      );
      return;
    }
    const historicoId = this.historicoParaSecciones?.id;
    const incluirAntecedentes = !!this.incluirAntecedentes && !!historicoId;
    const sexoPaciente = (paciente as any)?.sexo ?? null;
    const antecedentesNarrativo = incluirAntecedentes
      ? await this.buildAntecedentesNarrativo(historicoId, sexoPaciente)
      : '';

    const bloques: string[] = [];
    const controlesOrdenadosPorId = [...controles].sort((a, b) => a.id - b.id);
    controlesOrdenadosPorId.forEach((c, index) => {
      const fechaStr = c.fecha_consulta ? this.contextualDataService.formatearFecha(c.fecha_consulta) : '';
      if (!fechaStr) return;
      const bloque = this.generarBloqueNarrativoControl(c, fechaStr, {
        incluirIntroPaciente: index === 0,
        antecedentesNarrativo: index === 0 ? antecedentesNarrativo : '',
        paciente
      });
      bloques.push(bloque);
    });

    const html = bloques.join('');
    this.ultimoReemplazoProgramatico = Date.now();
    this.contenidoValue = html;
    this.informeForm.patchValue({ contenido: html });
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.editorContenido) this.editorContenido.setValue(html);
    }, 0);
    this.alertService.showSuccess('Informe narrativo generado. Puede editarlo y guardar.');
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
        // Obtener antecedentes de la historia médica más reciente
        const pacienteId = this.informeForm.get('paciente_id')?.value;
        const medicoId = this.informeForm.get('medico_id')?.value;
        
        let antecedentesHTML = '';
        if (pacienteId && medicoId) {
          try {
            console.log('🔍 Buscando antecedentes para auto-aplicar - Paciente ID:', pacienteId, 'Médico ID:', medicoId);
            const historicoResponse = await firstValueFrom(
              this.historicoService.getHistoricoByPacienteAndMedico(
                parseInt(pacienteId), 
                parseInt(medicoId)
              )
            );
            
            const historico = historicoResponse?.data;
            if (historico) {
              console.log('📋 Historia médica encontrada para antecedentes:', historico.id);
              const antecedentesSecciones: string[] = [];
              const { html: estandarizados, antecedentes_otros } = await this.buildAntecedentesEstandarizadosHTML(historico.id);
              if (estandarizados) antecedentesSecciones.push(estandarizados);
              if (antecedentes_otros && antecedentes_otros.trim() !== '' && antecedentes_otros.trim() !== '<p></p>') {
                antecedentesSecciones.push(`<p><strong>Otros antecedentes:</strong></p><p>${antecedentes_otros}</p>`);
              }
              if (antecedentesSecciones.length > 0) {
                antecedentesHTML = `<div class="antecedentes-seccion">${antecedentesSecciones.join('')}</div>`;
                console.log('✅ Antecedentes encontrados y añadidos al contenido auto-aplicado');
              } else {
                console.log('⚠️ No se encontraron antecedentes en la historia médica');
              }
            } else {
              console.log('⚠️ No se encontró historia médica para obtener antecedentes');
            }
          } catch (error) {
            console.warn('⚠️ Error obteniendo antecedentes para auto-aplicar:', error);
          }
        }
        
        // Construir contenido en el mismo orden que la historia del paciente
        let contenidoSugerido = '';
        
        // 1. Agregar datos del paciente
        if (this.datosContextuales.paciente) {
          console.log('👤 Datos del paciente para auto-aplicar:', this.datosContextuales.paciente);
          console.log('👤 Edad del paciente:', this.datosContextuales.paciente.edad);
          
          contenidoSugerido += `<h2>Datos del Paciente</h2>`;
          contenidoSugerido += `<p><strong>Nombre:</strong> ${this.datosContextuales.paciente.nombres} ${this.datosContextuales.paciente.apellidos}</p>`;
          contenidoSugerido += `<p><strong>Edad:</strong> ${this.datosContextuales.paciente.edad || 'No especificada'} años</p>`;
          contenidoSugerido += `<p><strong>Cédula:</strong> ${this.datosContextuales.paciente.cedula}</p>`;
          contenidoSugerido += `<p><strong>Teléfono:</strong> ${this.datosContextuales.paciente.telefono}</p>`;
          contenidoSugerido += `<p><strong>Email:</strong> ${this.datosContextuales.paciente.email}</p>`;
        }
        
        // 2. Agregar datos del médico
        if (this.datosContextuales.medico) {
          contenidoSugerido += `<h2>Datos del Médico</h2>`;
          const tituloMed = this.datosContextuales.medico.sexo === 'Femenino' ? 'Dra.' : 'Dr.';
          contenidoSugerido += `<p><strong>${tituloMed}</strong> ${this.datosContextuales.medico.nombres} ${this.datosContextuales.medico.apellidos}</p>`;
          contenidoSugerido += `<p><strong>Especialidad:</strong> ${this.datosContextuales.medico.especialidad}</p>`;
        }
        
        // 3. Obtener la historia médica completa para usar el mismo orden
        let historico: any = null;
        if (pacienteId && medicoId) {
          try {
            const historicoResponse = await firstValueFrom(
              this.historicoService.getHistoricoByPacienteAndMedico(
                parseInt(pacienteId), 
                parseInt(medicoId)
              )
            );
            historico = historicoResponse?.data;
          } catch (error) {
            console.warn('⚠️ Error obteniendo historia médica completa:', error);
          }
        }
        
        // 4. Agregar campos en el mismo orden que la historia del paciente
        // 4.1. Resumen Clínico
        if (historico?.motivo_consulta && historico.motivo_consulta.trim() !== '' && historico.motivo_consulta.trim() !== '<p></p>') {
          contenidoSugerido += `<h3><strong>Resumen Clínico:</strong></h3><p>${historico.motivo_consulta}</p>`;
        }
        
        // 4.2. Antecedentes (estandarizados + otros; otros vienen de pacientes.antecedentes_otros)
        if (historico?.id) {
          const { html: antEstandarizados, antecedentes_otros } = await this.buildAntecedentesEstandarizadosHTML(historico.id);
          if (antEstandarizados) contenidoSugerido += antEstandarizados;
          if (antecedentes_otros && antecedentes_otros.trim() !== '' && antecedentes_otros.trim() !== '<p></p>') {
            contenidoSugerido += `<p><strong>Otros antecedentes:</strong></p><p>${antecedentes_otros}</p>`;
          }
        }
        
        // 4.3. Exámenes paraclínicos (antes del examen físico en el informe)
        if ((historico as any)?.examenes_paraclinicos && (historico as any).examenes_paraclinicos.trim() !== '' && (historico as any).examenes_paraclinicos.trim() !== '<p></p>') {
          contenidoSugerido += `<h3><strong>Exámenes paraclínicos:</strong></h3><p>${(historico as any).examenes_paraclinicos}</p>`;
        }

        // 4.4. Examen físico (historico_pacientes.examenes_medico)
        if (historico?.examenes_medico && historico.examenes_medico.trim() !== '' && historico.examenes_medico.trim() !== '<p></p>') {
          contenidoSugerido += `<h3><strong>Examen físico:</strong></h3><p>${historico.examenes_medico}</p>`;
        }
        
        // 4.5. Diagnóstico
        if (historico?.diagnostico && historico.diagnostico.trim() !== '' && historico.diagnostico.trim() !== '<p></p>') {
          contenidoSugerido += `<h3><strong>Diagnóstico:</strong></h3><p>${historico.diagnostico}</p>`;
        }
        
        // 4.6. Plan de Tratamiento
        if (historico?.plan && historico.plan.trim() !== '' && historico.plan.trim() !== '<p></p>') {
          contenidoSugerido += `<h3><strong>Plan de Tratamiento:</strong></h3><p>${historico.plan}</p>`;
        }
        
        console.log('✨ Contenido auto-aplicado (primeros 500 caracteres):', contenidoSugerido.substring(0, 500));
        console.log('✨ Contenido auto-aplicado completo length:', contenidoSugerido.length);
        
        if (contenidoSugerido) {
          // Aplicar firma digital al contenido
          const medicoId = this.informeForm.get('medico_id')?.value;
          let contenidoFinal = contenidoSugerido;
          
          if (medicoId) {
            contenidoFinal = await this.aplicarFirmaAlInforme(contenidoSugerido, medicoId);
          }
          
          // Actualizar el valor del formulario primero
          this.informeForm.patchValue({ contenido: contenidoFinal });
          
          // Actualizar contenidoValue con un pequeño delay para asegurar que Angular detecte el cambio
          // Esto es necesario porque el editor Quill puede no detectar cambios muy rápidos
          setTimeout(() => {
            this.contenidoValue = contenidoFinal;
            this.cdr.detectChanges();
            
            console.log('✅ Contenido aplicado al formulario y editor');
            console.log('📝 contenidoValue length:', this.contenidoValue.length);
            console.log('📝 contenidoValue (primeros 500 caracteres):', this.contenidoValue.substring(0, 500));
            
            // Verificar que el valor del formulario se actualizó
            const contenidoEnFormulario = this.informeForm.get('contenido')?.value;
            console.log('📝 Contenido en formulario length:', contenidoEnFormulario?.length || 0);
          }, 50);
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
          contenidoSugerido += `<h3>Resumen Clínico:</h3><p>${ultimoInforme.motivo_consulta}</p>`;
        }

        if (ultimoInforme.examenes_paraclinicos && ultimoInforme.examenes_paraclinicos.trim() !== '' && ultimoInforme.examenes_paraclinicos.trim() !== '<p></p>') {
          contenidoSugerido += `<h3>Exámenes paraclínicos:</h3><p>${ultimoInforme.examenes_paraclinicos}</p>`;
        }

        if (ultimoInforme.examenes_medico && ultimoInforme.examenes_medico.trim() !== '' && ultimoInforme.examenes_medico.trim() !== '<p></p>') {
          contenidoSugerido += `<h3>Examen físico:</h3><p>${ultimoInforme.examenes_medico}</p>`;
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
        case 'examenes_paraclinicos':
          valorSugerido = ultimoInforme.examenes_paraclinicos || '';
          break;
        case 'examenes_medico':
          valorSugerido = ultimoInforme.examenes_medico || '';
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

  /**
   * Detecta si el contenido tiene duplicación de secciones
   */
  private detectarDuplicacionContenido(contenido: string): boolean {
    if (!contenido) return false;
    
    // Contar ocurrencias de secciones clave
    const motivoCount = (contenido.match(/Motivo de Consulta/gi) || []).length;
    const antecedentesCount = (contenido.match(/Antecedentes Médicos/gi) || []).length;
    const examenesCount = (contenido.match(/Examenes Médicos/gi) || []).length;
    const examenFisicoCount = (contenido.match(/Examen físico/gi) || []).length;
    const diagnosticoCount = (contenido.match(/Diagnóstico:/gi) || []).length;
    
    // Si alguna sección aparece más de una vez, hay duplicación
    return motivoCount > 1 || antecedentesCount > 1 || examenesCount > 1 || examenFisicoCount > 1 || diagnosticoCount > 1;
  }

  /**
   * Limpia contenido duplicado, manteniendo solo la primera ocurrencia de cada sección
   */
  private limpiarContenidoDuplicado(contenido: string): string {
    if (!contenido) return contenido;
    
    // Dividir el contenido por secciones principales
    const secciones = contenido.split(/(?=<h[23]><strong>)/i);
    const seccionesUnicas = new Map<string, string>();
    const ordenSecciones: string[] = [];
    
    // Procesar cada sección
    for (const seccion of secciones) {
      if (!seccion.trim()) continue;
      
      // Identificar el tipo de sección
      let tipoSeccion = '';
      if (seccion.includes('Resumen Clínico')) tipoSeccion = 'motivo';
      else if (seccion.includes('Antecedentes Médicos')) tipoSeccion = 'antecedentes';
      else if (seccion.includes('Examenes Médicos')) tipoSeccion = 'examenes';
      else if (seccion.includes('Examen físico')) tipoSeccion = 'examen_fisico';
      else if (seccion.includes('Diagnóstico:')) tipoSeccion = 'diagnostico';
      else if (seccion.includes('Conclusiones:')) tipoSeccion = 'conclusiones';
      else if (seccion.includes('Plan de Tratamiento')) tipoSeccion = 'plan';
      else if (seccion.includes('Datos del Paciente')) tipoSeccion = 'paciente';
      else if (seccion.includes('Datos del Médico')) tipoSeccion = 'medico';
      else {
        // Sección desconocida, agregarla al final
        tipoSeccion = `otro_${Date.now()}`;
      }
      
      // Solo agregar si no existe ya
      if (tipoSeccion && !seccionesUnicas.has(tipoSeccion)) {
        seccionesUnicas.set(tipoSeccion, seccion);
        if (!tipoSeccion.startsWith('otro_')) {
          ordenSecciones.push(tipoSeccion);
        }
      }
    }
    
    // Reconstruir el contenido en el orden correcto
    let contenidoLimpio = '';
    
    // Primero agregar secciones conocidas en orden
    for (const tipo of ordenSecciones) {
      contenidoLimpio += seccionesUnicas.get(tipo) || '';
    }
    
    // Luego agregar secciones desconocidas
    for (const [tipo, seccion] of seccionesUnicas.entries()) {
      if (tipo.startsWith('otro_')) {
        contenidoLimpio += seccion;
      }
    }
    
    return contenidoLimpio;
  }

  get estado() { return this.informeForm?.get('estado'); }
}
