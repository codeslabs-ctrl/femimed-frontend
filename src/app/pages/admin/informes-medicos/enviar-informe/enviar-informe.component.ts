import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InformeMedicoService } from '../../../../services/informe-medico.service';
import { InformeMedico, EnvioInforme } from '../../../../models/informe-medico.model';

@Component({
  selector: 'app-enviar-informe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './enviar-informe.component.html',
  styleUrls: ['./enviar-informe.component.css']
})
export class EnviarInformeComponent implements OnInit {
  informe: InformeMedico | null = null;
  envioForm: FormGroup;
  enviosAnteriores: EnvioInforme[] = [];
  
  cargando = false;
  enviando = false;
  error = '';
  informeId: number | null = null;

  // Métodos de envío
  metodosEnvio = [
    { valor: 'email', texto: 'Correo Electrónico', icono: 'fas fa-envelope', color: 'text-primary' },
    { valor: 'whatsapp', texto: 'WhatsApp', icono: 'fab fa-whatsapp', color: 'text-success' },
    { valor: 'sms', texto: 'SMS', icono: 'fas fa-sms', color: 'text-info' },
    { valor: 'presencial', texto: 'Entrega Presencial', icono: 'fas fa-handshake', color: 'text-warning' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private informeMedicoService: InformeMedicoService
  ) {
    this.envioForm = this.fb.group({
      metodo_envio: ['', Validators.required],
      destinatario: ['', [Validators.required, Validators.email]],
      observaciones: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.informeId = parseInt(params['id']);
        this.cargarInforme();
        this.cargarEnviosAnteriores();
      }
    });
  }

  cargarInforme(): void {
    if (!this.informeId) return;

    this.cargando = true;
    this.error = '';

    this.informeMedicoService.obtenerInformePorId(this.informeId).subscribe({
      next: (response) => {
        this.informe = response.data;
        
        if (this.informe?.estado !== 'firmado') {
          this.error = 'Solo se pueden enviar informes que estén firmados digitalmente';
          this.cargando = false;
          return;
        }

        // Pre-llenar destinatario con email del paciente
        if (this.informe.pacientes?.email) {
          this.envioForm.patchValue({
            destinatario: this.informe.pacientes.email
          });
        }

        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando informe:', error);
        this.error = 'Error cargando el informe médico';
        this.cargando = false;
      }
    });
  }

  cargarEnviosAnteriores(): void {
    if (!this.informeId) return;

    this.informeMedicoService.obtenerEnviosPorInforme(this.informeId).subscribe({
      next: (response) => {
        this.enviosAnteriores = response.data || [];
      },
      error: (error) => {
        console.error('Error cargando envíos anteriores:', error);
      }
    });
  }

  seleccionarMetodoEnvio(metodo: string): void {
    this.envioForm.patchValue({ metodo_envio: metodo });
    
    // Actualizar validación del destinatario según el método
    const destinatarioControl = this.envioForm.get('destinatario');
    if (destinatarioControl) {
      if (metodo === 'email') {
        destinatarioControl.setValidators([Validators.required, Validators.email]);
      } else if (metodo === 'whatsapp' || metodo === 'sms') {
        destinatarioControl.setValidators([Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]);
      } else {
        destinatarioControl.setValidators([Validators.required]);
      }
      destinatarioControl.updateValueAndValidity();
    }
  }

  enviarInforme(): void {
    if (this.envioForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    if (!this.informeId || !this.informe) return;

    this.enviando = true;
    this.error = '';

    const datosEnvio = {
      informe_id: this.informeId,
      paciente_id: this.informe.paciente_id,
      metodo_envio: this.envioForm.value.metodo_envio,
      destinatario: this.envioForm.value.destinatario,
      observaciones: this.envioForm.value.observaciones,
      estado_envio: 'pendiente' as const
    };
    
    this.informeMedicoService.enviarInforme(datosEnvio).subscribe({
      next: () => {
        alert('Informe enviado exitosamente');
        this.router.navigate(['/admin/informes-medicos', this.informeId]);
      },
      error: (error) => {
        console.error('Error enviando informe:', error);
        this.error = 'Error enviando el informe';
        this.enviando = false;
      }
    });
  }

  cancelar(): void {
    if (confirm('¿Está seguro de que desea cancelar el envío?')) {
      this.router.navigate(['/admin/informes-medicos', this.informeId]);
    }
  }

  previsualizarEnvio(): void {
    if (this.envioForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    const ventanaPrevia = window.open('', '_blank');
    if (ventanaPrevia) {
      ventanaPrevia.document.write(this.generarHTMLPrevisualizacion());
      ventanaPrevia.document.close();
    }
  }

  generarHTMLPrevisualizacion(): string {
    if (!this.informe) return '';

    const metodoSeleccionado = this.metodosEnvio.find(m => m.valor === this.envioForm.value.metodo_envio);
    const destinatario = this.envioForm.value.destinatario;
    const observaciones = this.envioForm.value.observaciones;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vista Previa - Envío de Informe</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { border-bottom: 2px solid #f5576c; padding-bottom: 10px; margin-bottom: 20px; }
          .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .envio-section { background: #e3f2fd; padding: 20px; border-radius: 5px; border-left: 4px solid #2196f3; }
          .metodo-envio { background: #f3e5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #9c27b0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Enviar Informe Médico</h1>
          <p><strong>Informe:</strong> ${this.informe.titulo}</p>
        </div>
        
        <div class="info">
          <p><strong>Paciente:</strong> ${this.informe.pacientes?.nombres} ${this.informe.pacientes?.apellidos}</p>
          <p><strong>Médico:</strong> ${this.informe.medicos?.nombres} ${this.informe.medicos?.apellidos}</p>
          <p><strong>Número:</strong> ${this.informe.numero_informe}</p>
          <p><strong>Fecha:</strong> ${this.informeMedicoService.formatearFecha(this.informe.fecha_emision)}</p>
        </div>
        
        <div class="envio-section">
          <h3 style="color: #2196f3; margin-top: 0;">📤 Detalles del Envío</h3>
          <p><strong>Método:</strong> ${metodoSeleccionado?.texto}</p>
          <p><strong>Destinatario:</strong> ${destinatario}</p>
          <p><strong>Estado:</strong> Pendiente de envío</p>
          <p><strong>Fecha de Envío:</strong> ${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <div class="metodo-envio">
          <h4>Información del Método de Envío:</h4>
          <p><strong>Icono:</strong> <i class="${metodoSeleccionado?.icono}"></i> ${metodoSeleccionado?.texto}</p>
          <p><strong>Descripción:</strong> ${this.obtenerDescripcionMetodo(this.envioForm.value.metodo_envio)}</p>
        </div>
        
        ${observaciones ? `
        <div class="info">
          <h4>Observaciones:</h4>
          <p>${observaciones}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; text-align: center; color: #6c757d;">
          <p>Esta es una vista previa de cómo se enviará el informe</p>
        </div>
      </body>
      </html>
    `;
  }

  obtenerDescripcionMetodo(metodo: string): string {
    const descripciones: { [key: string]: string } = {
      'email': 'El informe se enviará por correo electrónico al destinatario',
      'whatsapp': 'El informe se enviará por WhatsApp al número proporcionado',
      'sms': 'Se enviará un SMS con enlace al informe al número proporcionado',
      'presencial': 'El informe se entregará de forma presencial al paciente'
    };
    return descripciones[metodo] || 'Método de envío no especificado';
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.envioForm.controls).forEach(key => {
      this.envioForm.get(key)?.markAsTouched();
    });
  }

  obtenerErrorCampo(campo: string): string {
    const control = this.envioForm.get(campo);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.obtenerNombreCampo(campo)} es requerido`;
      }
      if (control.errors['email']) {
        return 'Debe ser un correo electrónico válido';
      }
      if (control.errors['pattern']) {
        return 'Debe ser un número de teléfono válido';
      }
      if (control.errors['maxlength']) {
        return `No puede exceder ${control.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  obtenerNombreCampo(campo: string): string {
    const nombres: { [key: string]: string } = {
      'metodo_envio': 'Método de Envío',
      'destinatario': 'Destinatario',
      'observaciones': 'Observaciones'
    };
    return nombres[campo] || campo;
  }

  formatearFecha(fecha: string): string {
    return this.informeMedicoService.formatearFecha(fecha);
  }

  obtenerEstadoTexto(estado: string): string {
    return this.informeMedicoService.obtenerEstadoTexto(estado);
  }

  obtenerTipoInformeTexto(tipo: string): string {
    return this.informeMedicoService.obtenerTipoInformeTexto(tipo);
  }

  obtenerMetodoEnvioTexto(metodo: string): string {
    return this.informeMedicoService.obtenerMetodoEnvioTexto(metodo);
  }

  obtenerEstadoEnvioColor(estado: string): string {
    return this.informeMedicoService.obtenerEstadoEnvioColor(estado);
  }

  obtenerEstadoEnvioTexto(estado: string): string {
    return this.informeMedicoService.obtenerEstadoEnvioTexto(estado);
  }

  obtenerIconoMetodo(metodo: string): string {
    return this.informeMedicoService.obtenerIconoMetodo(metodo);
  }

  obtenerPlaceholderDestinatario(): string {
    const metodo = this.envioForm.get('metodo_envio')?.value;
    const placeholders: { [key: string]: string } = {
      'email': 'ejemplo@correo.com',
      'whatsapp': '+1234567890',
      'sms': '+1234567890',
      'presencial': 'Nombre del destinatario'
    };
    return placeholders[metodo] || 'Ingrese el destinatario';
  }

  obtenerAyudaDestinatario(): string {
    const metodo = this.envioForm.get('metodo_envio')?.value;
    const ayudas: { [key: string]: string } = {
      'email': 'Ingrese la dirección de correo electrónico del destinatario',
      'whatsapp': 'Ingrese el número de WhatsApp (con código de país)',
      'sms': 'Ingrese el número de teléfono (con código de país)',
      'presencial': 'Ingrese el nombre de la persona que recibirá el informe'
    };
    return ayudas[metodo] || 'Ingrese la información del destinatario';
  }

  // Getters para validación
  get metodo_envio() { return this.envioForm.get('metodo_envio'); }
  get destinatario() { return this.envioForm.get('destinatario'); }
  get observaciones() { return this.envioForm.get('observaciones'); }
}
