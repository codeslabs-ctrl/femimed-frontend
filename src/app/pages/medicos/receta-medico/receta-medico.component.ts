import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ClinicaAtencionService, ClinicaAtencion } from '../../../services/clinica-atencion.service';
import { RecetaPdfService, RecetaPdfPayload } from '../../../services/receta-pdf.service';
import { AlertService } from '../../../services/alert.service';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-receta-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receta-medico.component.html',
  styleUrls: ['./receta-medico.component.css']
})
export class RecetaMedicoComponent implements OnInit {
  tipo: 'recipe' | 'indicaciones' | 'ambos' = 'recipe';
  contenido = '';
  readonly plantillaAmbos = 'Récipe:\n\n\n\nIndicaciones:\n';
  pacienteId: number | null = null;
  pacientes: Patient[] = [];
  loadingPacientes = true;
  fechaEmision = '';
  clinicas: ClinicaAtencion[] = [];
  piesSeleccionados: number[] = [];
  loadingClinicas = true;
  generando = false;

  constructor(
    private route: ActivatedRoute,
    private clinicaAtencionService: ClinicaAtencionService,
    private recetaPdfService: RecetaPdfService,
    private alertService: AlertService,
    private patientService: PatientService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const pid = q.get('pacienteId') || q.get('paciente');
    if (pid) {
      const n = Number(pid);
      if (Number.isFinite(n) && n > 0) this.pacienteId = n;
    }

    const hoy = new Date();
    this.fechaEmision = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    const user = this.authService.getCurrentUser();
    const medicoId = user?.medico_id;
    const preselectedId = this.pacienteId;

    if (medicoId) {
      this.patientService
        .getPatientsByMedicoForStats(medicoId)
        .pipe(
          switchMap((list) => {
            let rows = this.ordenarPacientes([...list]);
            if (preselectedId && !rows.some((p) => p.id === preselectedId)) {
              return this.patientService.getPatientById(preselectedId).pipe(
                map((res) => {
                  if (res.success && res.data) {
                    return [res.data, ...rows.filter((p) => p.id !== res.data!.id)];
                  }
                  return rows;
                })
              );
            }
            return of(rows);
          })
        )
        .subscribe({
          next: (rows) => {
            this.pacientes = rows;
            this.loadingPacientes = false;
          },
          error: () => {
            this.loadingPacientes = false;
            this.alertService.showError('No se pudo cargar la lista de pacientes.');
          }
        });
    } else {
      this.loadingPacientes = false;
    }

    this.clinicaAtencionService.list(true).subscribe({
      next: (res) => {
        this.clinicas = res?.data ?? [];
        if (this.clinicas.length === 1 && this.piesSeleccionados.length === 0) {
          this.piesSeleccionados = [this.clinicas[0].id];
        }
        this.loadingClinicas = false;
      },
      error: () => {
        this.loadingClinicas = false;
        this.alertService.showError('No se pudieron cargar las clínicas de atención.');
      }
    });
  }

  etiquetaPaciente(p: Patient): string {
    const nom = [p.nombres, p.apellidos].filter(Boolean).join(' ').trim();
    const base = nom || `Paciente #${p.id}`;
    return p.cedula ? `${base} · ${p.cedula}` : base;
  }

  private ordenarPacientes(list: Patient[]): Patient[] {
    return list.sort((a, b) => {
      const sa = `${a.apellidos || ''} ${a.nombres || ''}`.trim().toLocaleLowerCase('es');
      const sb = `${b.apellidos || ''} ${b.nombres || ''}`.trim().toLocaleLowerCase('es');
      return sa.localeCompare(sb, 'es');
    });
  }

  togglePie(id: number): void {
    const i = this.piesSeleccionados.indexOf(id);
    if (i >= 0) {
      this.piesSeleccionados.splice(i, 1);
      return;
    }
    if (this.piesSeleccionados.length >= 2) {
      this.alertService.showError('Puede seleccionar como máximo 2 clínicas para el pie de página.');
      return;
    }
    this.piesSeleccionados.push(id);
  }

  isPieChecked(id: number): boolean {
    return this.piesSeleccionados.includes(id);
  }

  /** Al seleccionar "Ambos", si el área está vacía se inserta la plantilla guía. */
  onTipoCambiado(): void {
    if (this.tipo !== 'ambos') return;
    if (!(this.contenido || '').trim()) {
      this.contenido = this.plantillaAmbos;
    }
  }

  async descargarPdf(): Promise<void> {
    const texto = (this.contenido || '').trim();
    if (!texto) {
      this.alertService.showError('Escriba el contenido del récipe o las indicaciones.');
      return;
    }

    const payload: RecetaPdfPayload = {
      tipo: this.tipo,
      contenido: texto,
      fecha_emision: this.fechaEmision ? `${this.fechaEmision}T12:00:00` : null,
      pies_clinica_ids: this.piesSeleccionados.length ? [...this.piesSeleccionados] : undefined
    };
    if (this.pacienteId != null && this.pacienteId > 0) {
      payload.paciente_id = this.pacienteId;
    }

    this.generando = true;
    try {
      const blob = await firstValueFrom(this.recetaPdfService.generarPdf(payload));
      if (blob.type && blob.type.includes('json')) {
        const text = await blob.text();
        try {
          const j = JSON.parse(text);
          this.alertService.showError(j?.message || 'Error al generar el PDF');
        } catch {
          this.alertService.showError('Error al generar el PDF');
        }
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const label =
        this.tipo === 'indicaciones' ? 'indicaciones' : this.tipo === 'ambos' ? 'ambos' : 'recipe';
      a.download = `receta-${label}-${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.alertService.showSuccess('PDF generado. Revise su carpeta de descargas.');
    } catch (e: unknown) {
      const err = e as HttpErrorResponse;
      if (err.error instanceof Blob) {
        const text = await err.error.text();
        try {
          const j = JSON.parse(text);
          this.alertService.showError(j?.message || 'Error al generar el PDF');
        } catch {
          this.alertService.showError('Error al generar el PDF');
        }
      } else {
        this.alertService.showError('No se pudo generar el PDF. Intente de nuevo.');
      }
    } finally {
      this.generando = false;
    }
  }
}
