import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InformeMedicoService } from '../../../../services/informe-medico.service';
import { PatientService } from '../../../../services/patient.service';
import { MedicoService } from '../../../../services/medico.service';

@Component({
  selector: 'app-informe-resumen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './informe-resumen.component.html',
  styleUrls: ['./informe-resumen.component.scss']
})
export class InformeResumenComponent implements OnInit {
  informeId: number | null = null;
  informe: any = null;
  paciente: any = null;
  medico: any = null;
  cargando = false;
  enviando = false;
  descargandoPDF = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private informeMedicoService: InformeMedicoService,
    private patientService: PatientService,
    private medicoService: MedicoService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.informeId = params['id'] ? +params['id'] : null;
      if (this.informeId) {
        this.cargarInforme();
      }
    });
  }

  async cargarInforme(): Promise<void> {
    if (!this.informeId) return;

    this.cargando = true;
    this.error = '';

    try {
      // Cargar datos del informe
      const informeResponse = await this.informeMedicoService.obtenerInformePorId(this.informeId).toPromise();
      this.informe = informeResponse?.data;
      
      if (this.informe) {
        // Cargar datos del paciente
        const pacienteResponse = await this.patientService.getPatientById(this.informe.paciente_id).toPromise();
        this.paciente = pacienteResponse?.data;
        
        // Cargar datos del médico
        const medicoResponse = await this.medicoService.getMedicoById(this.informe.medico_id).toPromise();
        this.medico = medicoResponse?.data;
      }
    } catch (error) {
      console.error('Error cargando informe:', error);
      this.error = 'Error cargando los datos del informe';
    } finally {
      this.cargando = false;
    }
  }

  async enviarPorEmail(): Promise<void> {
    if (!this.informeId) return;

    if (confirm('¿Está seguro de enviar este informe por email al paciente?')) {
      this.enviando = true;
      this.error = '';

      try {
        console.log('📧 Enviando informe por email...');
        
        const response = await this.informeMedicoService.enviarInformePorEmail(this.informeId).toPromise();
        
        if (response && response.success) {
          alert('✅ Informe enviado por email exitosamente');
          console.log('✅ Email enviado correctamente');
          
          // Actualizar el estado del informe a "enviado"
          this.informe.estado = 'enviado';
          console.log('📧 Estado del informe actualizado a "enviado"');
          
          // Actualizar el estado en la base de datos
          try {
            await this.actualizarEstadoEnBD();
          } catch (error) {
            console.warn('⚠️ No se pudo actualizar el estado en la BD:', error);
          }
        } else {
          const msg = response?.message || 'Error enviando el informe por email';
          alert(`❌ ${msg}`);
          console.error('❌ Error en respuesta del servidor:', response);
        }
      } catch (error) {
        console.error('❌ Error enviando informe:', error);
        const backendMsg = (error as any)?.error?.message || (error as any)?.message || 'Error enviando el informe por email. Intenta de nuevo.';
        alert(`❌ ${backendMsg}`);
      } finally {
        this.enviando = false;
      }
    }
  }

  async descargarPDF(): Promise<void> {
    if (!this.informeId) return;

    this.descargandoPDF = true;
    
    try {
      console.log('📄 Generando PDF...');
      
      const blob = await this.informeMedicoService.generarPDFInforme(this.informeId).toPromise();
      
      if (!blob) {
        throw new Error('No se pudo generar el PDF');
      }
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `informe-${this.informe?.numero_informe || this.informeId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF descargado correctamente');
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert('❌ Error generando el PDF. Intenta de nuevo.');
    } finally {
      this.descargandoPDF = false;
    }
  }

  volver(): void {
    this.router.navigate(['/admin/informes-medicos']);
  }

  editarInforme(): void {
    if (this.informeId) {
      this.router.navigate(['/admin/informes-medicos/editar', this.informeId]);
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'borrador': 'Borrador',
      'finalizado': 'Finalizado',
      'firmado': 'Firmado',
      'enviado': 'Enviado'
    };
    return estados[estado] || estado;
  }

  getEstadoIcon(estado: string): string {
    const iconos: { [key: string]: string } = {
      'borrador': 'fa-edit',
      'finalizado': 'fa-check-circle',
      'firmado': 'fa-signature',
      'enviado': 'fa-paper-plane'
    };
    return iconos[estado] || 'fa-circle';
  }

  /**
   * Actualiza el estado del informe en la base de datos
   */
  private async actualizarEstadoEnBD(): Promise<void> {
    if (!this.informeId) return;

    try {
      const updateData = {
        estado: 'enviado' as const
      };

      await this.informeMedicoService.actualizarInforme(this.informeId, updateData).toPromise();
      console.log('✅ Estado actualizado en la base de datos');
    } catch (error) {
      console.error('❌ Error actualizando estado en BD:', error);
      throw error;
    }
  }
}