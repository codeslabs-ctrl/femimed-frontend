import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InformeMedicoService } from '../../../../services/informe-medico.service';
import { InformeMedico } from '../../../../models/informe-medico.model';

@Component({
  selector: 'app-informe-medico-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './informe-medico-dashboard.component.html',
  styleUrls: ['./informe-medico-dashboard.component.css']
})
export class InformeMedicoDashboardComponent implements OnInit {
  informes: InformeMedico[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private informeMedicoService: InformeMedicoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarInformes();
  }

  cargarInformes(): void {
    console.log('🔄 Cargando informes médicos...');
    this.loading = true;
    this.error = null;

    this.informeMedicoService.obtenerInformes().subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta del servicio:', response);
        
        // Manejar la estructura de respuesta del backend
        if (response && response.success && response.data) {
          this.informes = response.data;
          console.log('📊 Informes extraídos:', this.informes);
          console.log('📊 Cantidad de informes:', this.informes?.length || 0);
        } else if (Array.isArray(response)) {
          // Si viene directamente como array
          this.informes = response;
          console.log('📊 Informes (array directo):', this.informes);
        } else {
          this.informes = [];
          console.log('⚠️ Formato de respuesta no reconocido');
        }
        
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando informes:', error);
        this.error = 'Error cargando los informes médicos';
        this.loading = false;
      }
    });
  }

  crearInforme(): void {
    this.router.navigate(['/admin/informes-medicos/nuevo']);
  }

  reenviarEmail(informe: InformeMedico): void {
    if (informe.id) {
      this.router.navigate(['/admin/informes-medicos', informe.id, 'resumen']);
    }
  }

  editarInforme(informe: InformeMedico): void {
    if (informe.id) {
      this.router.navigate(['/admin/informes-medicos', informe.id, 'editar']);
    }
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
      'finalizado': 'fa-check',
      'firmado': 'fa-signature',
      'enviado': 'fa-paper-plane'
    };
    return iconos[estado] || 'fa-file';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}