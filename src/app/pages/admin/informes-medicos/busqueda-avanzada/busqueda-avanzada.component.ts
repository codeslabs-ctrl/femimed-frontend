import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { InformeMedicoService } from '../../../services/informe-medico.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-busqueda-avanzada',
  templateUrl: './busqueda-avanzada.component.html',
  styleUrls: ['./busqueda-avanzada.component.css']
})
export class BusquedaAvanzadaComponent implements OnInit {
  busquedaForm: FormGroup;
  resultados: any[] = [];
  cargando = false;
  error = '';
  totalResultados = 0;
  paginaActual = 1;
  elementosPorPagina = 10;

  // Filtros disponibles
  estados = [
    { valor: '', texto: 'Todos los estados' },
    { valor: 'borrador', texto: 'Borrador' },
    { valor: 'finalizado', texto: 'Finalizado' },
    { valor: 'firmado', texto: 'Firmado' },
    { valor: 'enviado', texto: 'Enviado' },
    { valor: 'anulado', texto: 'Anulado' }
  ];

  tiposInforme = [
    { valor: '', texto: 'Todos los tipos' },
    { valor: 'consulta', texto: 'Consulta Médica' },
    { valor: 'examen', texto: 'Examen Médico' },
    { valor: 'procedimiento', texto: 'Procedimiento' },
    { valor: 'seguimiento', texto: 'Seguimiento' }
  ];

  medicos: any[] = [];
  pacientes: any[] = [];

  // Filtros activos
  filtrosActivos: string[] = [];

  constructor(
    private fb: FormBuilder,
    private informeMedicoService: InformeMedicoService,
    private router: Router
  ) {
    this.busquedaForm = this.fb.group({
      termino_busqueda: [''],
      estado: [''],
      tipo_informe: [''],
      medico_id: [''],
      paciente_id: [''],
      fecha_desde: [''],
      fecha_hasta: [''],
      solo_firmados: [false],
      solo_sin_firma: [false],
      ordenar_por: ['fecha_creacion'],
      orden: ['desc']
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.configurarBusquedaEnTiempoReal();
  }

  cargarDatosIniciales(): void {
    // Cargar médicos
    this.informeMedicoService.obtenerMedicos().subscribe({
      next: (response) => {
        this.medicos = response.data || [];
      },
      error: (error) => {
        console.error('Error cargando médicos:', error);
      }
    });

    // Cargar pacientes
    this.informeMedicoService.obtenerPacientes().subscribe({
      next: (response) => {
        this.pacientes = response.data || [];
      },
      error: (error) => {
        console.error('Error cargando pacientes:', error);
      }
    });
  }

  configurarBusquedaEnTiempoReal(): void {
    // Búsqueda en tiempo real para término de búsqueda
    this.busquedaForm.get('termino_busqueda')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(termino => {
        if (termino && termino.length >= 3) {
          return this.realizarBusqueda();
        }
        return of([]);
      })
    ).subscribe({
      next: (resultados) => {
        this.resultados = resultados;
        this.actualizarFiltrosActivos();
      },
      error: (error) => {
        console.error('Error en búsqueda en tiempo real:', error);
      }
    });

    // Búsqueda automática para otros filtros
    this.busquedaForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.actualizarFiltrosActivos();
    });
  }

  realizarBusqueda(): any {
    this.cargando = true;
    this.error = '';

    const filtros = this.busquedaForm.value;
    
    // Limpiar filtros vacíos
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    );

    this.informeMedicoService.obtenerInformes(
      this.paginaActual,
      this.elementosPorPagina,
      filtrosLimpios
    ).subscribe({
      next: (response) => {
        this.resultados = response.data || [];
        this.totalResultados = response.total || 0;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.error = 'Error realizando la búsqueda';
        this.cargando = false;
      }
    });
  }

  buscar(): void {
    this.paginaActual = 1;
    this.realizarBusqueda();
  }

  limpiarFiltros(): void {
    this.busquedaForm.reset({
      termino_busqueda: '',
      estado: '',
      tipo_informe: '',
      medico_id: '',
      paciente_id: '',
      fecha_desde: '',
      fecha_hasta: '',
      solo_firmados: false,
      solo_sin_firma: false,
      ordenar_por: 'fecha_creacion',
      orden: 'desc'
    });
    this.resultados = [];
    this.totalResultados = 0;
    this.filtrosActivos = [];
  }

  actualizarFiltrosActivos(): void {
    this.filtrosActivos = [];
    const valores = this.busquedaForm.value;

    if (valores.termino_busqueda) {
      this.filtrosActivos.push(`Búsqueda: "${valores.termino_busqueda}"`);
    }
    if (valores.estado) {
      const estado = this.estados.find(e => e.valor === valores.estado);
      if (estado) {
        this.filtrosActivos.push(`Estado: ${estado.texto}`);
      }
    }
    if (valores.tipo_informe) {
      const tipo = this.tiposInforme.find(t => t.valor === valores.tipo_informe);
      if (tipo) {
        this.filtrosActivos.push(`Tipo: ${tipo.texto}`);
      }
    }
    if (valores.medico_id) {
      const medico = this.medicos.find(m => m.id === valores.medico_id);
      if (medico) {
        this.filtrosActivos.push(`Médico: ${medico.nombres} ${medico.apellidos}`);
      }
    }
    if (valores.paciente_id) {
      const paciente = this.pacientes.find(p => p.id === valores.paciente_id);
      if (paciente) {
        this.filtrosActivos.push(`Paciente: ${paciente.nombres} ${paciente.apellidos}`);
      }
    }
    if (valores.fecha_desde) {
      this.filtrosActivos.push(`Desde: ${valores.fecha_desde}`);
    }
    if (valores.fecha_hasta) {
      this.filtrosActivos.push(`Hasta: ${valores.fecha_hasta}`);
    }
    if (valores.solo_firmados) {
      this.filtrosActivos.push('Solo firmados');
    }
    if (valores.solo_sin_firma) {
      this.filtrosActivos.push('Solo sin firma');
    }
  }

  eliminarFiltro(filtro: string): void {
    const valores = this.busquedaForm.value;
    
    if (filtro.includes('Búsqueda:')) {
      this.busquedaForm.patchValue({ termino_busqueda: '' });
    } else if (filtro.includes('Estado:')) {
      this.busquedaForm.patchValue({ estado: '' });
    } else if (filtro.includes('Tipo:')) {
      this.busquedaForm.patchValue({ tipo_informe: '' });
    } else if (filtro.includes('Médico:')) {
      this.busquedaForm.patchValue({ medico_id: '' });
    } else if (filtro.includes('Paciente:')) {
      this.busquedaForm.patchValue({ paciente_id: '' });
    } else if (filtro.includes('Desde:')) {
      this.busquedaForm.patchValue({ fecha_desde: '' });
    } else if (filtro.includes('Hasta:')) {
      this.busquedaForm.patchValue({ fecha_hasta: '' });
    } else if (filtro === 'Solo firmados') {
      this.busquedaForm.patchValue({ solo_firmados: false });
    } else if (filtro === 'Solo sin firma') {
      this.busquedaForm.patchValue({ solo_sin_firma: false });
    }
    
    this.actualizarFiltrosActivos();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.realizarBusqueda();
  }

  cambiarElementosPorPagina(elementos: number): void {
    this.elementosPorPagina = elementos;
    this.paginaActual = 1;
    this.realizarBusqueda();
  }

  verInforme(informe: any): void {
    this.router.navigate(['/admin/informes-medicos', informe.id]);
  }

  editarInforme(informe: any): void {
    if (informe.estado === 'firmado' || informe.estado === 'enviado') {
      alert('No se puede editar un informe que ya está firmado o enviado');
      return;
    }
    this.router.navigate(['/admin/informes-medicos', informe.id, 'editar']);
  }

  obtenerEstadoColor(estado: string): string {
    return this.informeMedicoService.obtenerEstadoColor(estado);
  }

  obtenerEstadoTexto(estado: string): string {
    return this.informeMedicoService.obtenerEstadoTexto(estado);
  }

  obtenerTipoInformeTexto(tipo: string): string {
    return this.informeMedicoService.obtenerTipoInformeTexto(tipo);
  }

  formatearFecha(fecha: string): string {
    return this.informeMedicoService.formatearFecha(fecha);
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      'borrador': 'badge-secondary',
      'finalizado': 'badge-primary',
      'firmado': 'badge-success',
      'enviado': 'badge-info',
      'anulado': 'badge-danger'
    };
    return clases[estado] || 'badge-secondary';
  }

  puedeEditar(informe: any): boolean {
    return informe.estado === 'borrador' || informe.estado === 'finalizado';
  }

  obtenerTotalPaginas(): number {
    return Math.ceil(this.totalResultados / this.elementosPorPagina);
  }

  obtenerRangoPaginas(): number[] {
    const totalPaginas = this.obtenerTotalPaginas();
    const rango: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(totalPaginas, this.paginaActual + 2);
    
    for (let i = inicio; i <= fin; i++) {
      rango.push(i);
    }
    
    return rango;
  }
}



