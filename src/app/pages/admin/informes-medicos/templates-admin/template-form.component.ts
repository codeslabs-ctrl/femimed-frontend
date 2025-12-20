import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { InformeMedicoService } from '../../../../services/informe-medico.service';
import { EspecialidadService } from '../../../../services/especialidad.service';
import { TemplateInforme, CrearTemplateRequest } from '../../../../models/informe-medico.model';
import { RichTextEditorComponent } from '../../../../components/rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, RichTextEditorComponent],
  templateUrl: './template-form.component.html',
  styleUrls: ['./template-form.component.css']
})
export class TemplateFormComponent implements OnInit {
  templateForm: FormGroup;
  template: TemplateInforme | null = null;
  especialidades: any[] = [];
  
  // Estados
  loading = false;
  saving = false;
  error = '';
  esEdicion = false;
  templateId: number | null = null;

  // Valores para rich text editor
  contenidoValue = '';

  // Tipos de informe
  tiposInforme = [
    { valor: 'consulta', texto: 'Consulta' },
    { valor: 'examen', texto: 'Examen' },
    { valor: 'procedimiento', texto: 'Procedimiento' },
    { valor: 'seguimiento', texto: 'Seguimiento' },
    { valor: 'emergencia', texto: 'Emergencia' },
    { valor: 'control', texto: 'Control' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private informeMedicoService: InformeMedicoService,
    private especialidadService: EspecialidadService
  ) {
    this.templateForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      descripcion: ['', [Validators.maxLength(500)]],
      tipo_informe: ['', Validators.required],
      especialidad_id: [''],
      contenido_template: ['', [Validators.required, Validators.minLength(10)]],
      activo: [true]
    });
  }

  ngOnInit() {
    this.cargarEspecialidades();
    this.verificarModoEdicion();
  }

  cargarEspecialidades() {
    this.especialidadService.getAllEspecialidades().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.especialidades = response.data || [];
        }
      },
      error: (error: any) => {
        console.error('Error cargando especialidades:', error);
      }
    });
  }

  verificarModoEdicion() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.esEdicion = true;
        this.templateId = +params['id'];
        this.cargarTemplate();
      }
    });
  }

  cargarTemplate() {
    if (this.templateId) {
      this.loading = true;
      this.informeMedicoService.obtenerTemplate(this.templateId).subscribe({
        next: (response) => {
          if (response.success) {
            this.template = response.data;
            this.cargarDatosEnFormulario();
          } else {
            this.error = 'Error cargando plantilla';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error cargando template:', error);
          this.error = 'Error de conexión al cargar plantilla';
          this.loading = false;
        }
      });
    }
  }

  cargarDatosEnFormulario() {
    if (!this.template) return;

    this.templateForm.patchValue({
      nombre: this.template.nombre,
      descripcion: this.template.descripcion,
      tipo_informe: this.template.tipo_informe,
      especialidad_id: this.template.especialidad_id,
      contenido_template: this.template.contenido_template,
      activo: this.template.activo
    });

    // Inicializar valor del rich text editor
    this.contenidoValue = this.template.contenido_template || '';
  }

  // Métodos para manejar cambios en rich text editor
  onContenidoChange(value: string): void {
    this.contenidoValue = value;
    this.templateForm.patchValue({ contenido_template: value });
  }

  guardarTemplate(): void {
    if (this.templateForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    this.saving = true;
    this.error = '';

    const formData = this.templateForm.value;
    const templateData: CrearTemplateRequest = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      tipo_informe: formData.tipo_informe,
      especialidad_id: formData.especialidad_id || undefined,
      contenido_template: formData.contenido_template,
      activo: formData.activo === 'true' || formData.activo === true // Convertir correctamente a boolean
    };

    if (this.esEdicion && this.templateId) {
      this.actualizarTemplate(templateData);
    } else {
      this.crearTemplate(templateData);
    }
  }

  crearTemplate(templateData: CrearTemplateRequest) {
    this.informeMedicoService.crearTemplate(templateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/admin/informes-medicos/plantillas']);
        } else {
          this.error = 'Error creando plantilla';
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error creando template:', error);
        this.error = 'Error de conexión al crear plantilla';
        this.saving = false;
      }
    });
  }

  actualizarTemplate(templateData: CrearTemplateRequest) {
    if (this.templateId) {
      this.informeMedicoService.actualizarTemplate(this.templateId, templateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/admin/informes-medicos/plantillas']);
          } else {
            this.error = 'Error actualizando plantilla';
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Error actualizando template:', error);
          this.error = 'Error de conexión al actualizar plantilla';
          this.saving = false;
        }
      });
    }
  }

  previsualizar(): void {
    // Implementar vista previa
    console.log('Vista previa del template');
  }

  volver(): void {
    this.router.navigate(['/admin/informes-medicos/plantillas']);
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.templateForm.controls).forEach(key => {
      this.templateForm.get(key)?.markAsTouched();
    });
  }

  obtenerErrorCampo(campo: string): string {
    const control = this.templateForm.get(campo);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.obtenerNombreCampo(campo)} es requerido`;
      }
      if (control.errors['minlength']) {
        return `${this.obtenerNombreCampo(campo)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['maxlength']) {
        return `${this.obtenerNombreCampo(campo)} no puede tener más de ${control.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  obtenerNombreCampo(campo: string): string {
    const nombres: { [key: string]: string } = {
      'nombre': 'Nombre',
      'descripcion': 'Descripción',
      'tipo_informe': 'Tipo de Informe',
      'especialidad_id': 'Especialidad',
      'contenido_template': 'Contenido'
    };
    return nombres[campo] || campo;
  }

  // Getters para el template
  get nombre() { return this.templateForm.get('nombre'); }
  get descripcion() { return this.templateForm.get('descripcion'); }
  get tipo_informe() { return this.templateForm.get('tipo_informe'); }
  get especialidad_id() { return this.templateForm.get('especialidad_id'); }
  get contenido_template() { return this.templateForm.get('contenido_template'); }
  get activo() { return this.templateForm.get('activo'); }
}
