import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InformeMedicoService } from '../../../../services/informe-medico.service';
import { InformeMedico } from '../../../../models/informe-medico.model';

@Component({
  selector: 'app-firmar-informe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './firmar-informe.component.html',
  styleUrls: ['./firmar-informe.component.css']
})
export class FirmarInformeComponent implements OnInit {
  informe: InformeMedico | null = null;
  firmaForm: FormGroup;
  
  cargando = false;
  firmando = false;
  error = '';
  informeId: number | null = null;

  // Certificado digital
  certificadoDigital = '';
  certificadoValido = false;
  certificadoInfo: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private informeMedicoService: InformeMedicoService
  ) {
    this.firmaForm = this.fb.group({
      certificado_digital: ['', [Validators.required]],
      confirmacion_firma: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.informeId = parseInt(params['id']);
        this.cargarInforme();
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
        
        if (this.informe?.estado !== 'finalizado') {
          this.error = 'Solo se pueden firmar informes que estén en estado "Finalizado"';
          this.cargando = false;
          return;
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

  cargarCertificadoDigital(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.pem') && !file.name.endsWith('.crt')) {
      alert('Por favor seleccione un archivo de certificado válido (.pem, .crt o .txt)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.certificadoDigital = e.target?.result as string;
      this.validarCertificado();
      this.firmaForm.patchValue({ certificado_digital: this.certificadoDigital });
    };
    reader.readAsText(file);
  }

  validarCertificado(): void {
    if (!this.certificadoDigital) {
      this.certificadoValido = false;
      this.certificadoInfo = null;
      return;
    }

    // Validar formato básico del certificado
    if (this.certificadoDigital.includes('-----BEGIN CERTIFICATE-----') && 
        this.certificadoDigital.includes('-----END CERTIFICATE-----')) {
      this.certificadoValido = true;
      this.certificadoInfo = this.extraerInfoCertificado();
    } else {
      this.certificadoValido = false;
      this.certificadoInfo = null;
    }
  }

  extraerInfoCertificado(): any {
    // Extraer información básica del certificado
    const lines = this.certificadoDigital.split('\n');
    const certData = lines.filter(line => 
      !line.includes('-----BEGIN CERTIFICATE-----') && 
      !line.includes('-----END CERTIFICATE-----')
    ).join('');

    return {
      formato: 'X.509',
      longitud: certData.length,
      valido: true,
      fecha_validacion: new Date().toISOString()
    };
  }

  firmarInforme(): void {
    if (this.firmaForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    if (!this.informeId) return;

    this.firmando = true;
    this.error = '';

    this.informeMedicoService.firmarInforme(this.informeId, this.certificadoDigital).subscribe({
      next: () => {
        alert('Informe firmado digitalmente exitosamente');
        this.router.navigate(['/admin/informes-medicos', this.informeId]);
      },
      error: (error) => {
        console.error('Error firmando informe:', error);
        this.error = 'Error firmando el informe digitalmente';
        this.firmando = false;
      }
    });
  }

  cancelar(): void {
    if (confirm('¿Está seguro de que desea cancelar la firma? Los cambios no guardados se perderán.')) {
      this.router.navigate(['/admin/informes-medicos', this.informeId]);
    }
  }

  previsualizarFirma(): void {
    if (!this.informe) return;

    const ventanaPrevia = window.open('', '_blank');
    if (ventanaPrevia) {
      ventanaPrevia.document.write(this.generarHTMLPrevisualizacion());
      ventanaPrevia.document.close();
    }
  }

  generarHTMLPrevisualizacion(): string {
    if (!this.informe) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vista Previa - Firma Digital</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px; }
          .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .firma-section { background: #e8f5e8; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745; }
          .certificado-info { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${this.informe.titulo}</h1>
          <p><strong>Número:</strong> ${this.informe.numero_informe}</p>
        </div>
        
        <div class="info">
          <p><strong>Paciente:</strong> ${this.informe.pacientes?.nombres} ${this.informe.pacientes?.apellidos}</p>
          <p><strong>Médico:</strong> ${this.informe.medicos?.nombres} ${this.informe.medicos?.apellidos}</p>
          <p><strong>Fecha:</strong> ${this.informeMedicoService.formatearFecha(this.informe.fecha_emision)}</p>
        </div>
        
        <div class="firma-section">
          <h3 style="color: #28a745; margin-top: 0;">🔐 Firma Digital</h3>
          <p><strong>Estado:</strong> ${this.certificadoValido ? 'Certificado Válido' : 'Certificado Inválido'}</p>
          <p><strong>Fecha de Firma:</strong> ${new Date().toLocaleString('es-ES')}</p>
          <p><strong>Hash del Documento:</strong> [Se generará al firmar]</p>
        </div>
        
        ${this.certificadoInfo ? `
        <div class="certificado-info">
          <h4>Información del Certificado:</h4>
          <p><strong>Formato:</strong> ${this.certificadoInfo.formato}</p>
          <p><strong>Longitud:</strong> ${this.certificadoInfo.longitud} caracteres</p>
          <p><strong>Válido:</strong> ${this.certificadoInfo.valido ? 'Sí' : 'No'}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; text-align: center; color: #6c757d;">
          <p>Esta es una vista previa de cómo se verá el informe firmado</p>
        </div>
      </body>
      </html>
    `;
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.firmaForm.controls).forEach(key => {
      this.firmaForm.get(key)?.markAsTouched();
    });
  }

  obtenerErrorCampo(campo: string): string {
    const control = this.firmaForm.get(campo);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.obtenerNombreCampo(campo)} es requerido`;
      }
      if (control.errors['requiredTrue']) {
        return 'Debe confirmar la firma digital';
      }
    }
    return '';
  }

  obtenerNombreCampo(campo: string): string {
    const nombres: { [key: string]: string } = {
      'certificado_digital': 'Certificado Digital',
      'confirmacion_firma': 'Confirmación de Firma'
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

  // Getters para validación
  get certificado_digital() { return this.firmaForm.get('certificado_digital'); }
  get confirmacion_firma() { return this.firmaForm.get('confirmacion_firma'); }
}
