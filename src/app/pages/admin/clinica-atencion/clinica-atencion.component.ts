import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClinicaAtencionService, ClinicaAtencion } from '../../../services/clinica-atencion.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-clinica-atencion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clinica-atencion.component.html',
  styleUrls: ['./clinica-atencion.component.css']
})
export class ClinicaAtencionComponent implements OnInit {
  list: ClinicaAtencion[] = [];
  loading = true;
  showModal = false;
  isEditing = false;
  saving = false;
  errorMessage = '';
  confirmDelete: ClinicaAtencion | null = null;
  item: Partial<ClinicaAtencion> = {
    nombre_clinica: '',
    direccion_clinica: '',
    latitud: null,
    longitud: null,
    logo_path: '',
    activo: true
  };

  constructor(
    private service: ClinicaAtencionService,
    private errorHandler: ErrorHandlerService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading = true;
    this.service.list(false).subscribe({
      next: (res) => {
        this.list = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.errorHandler.logError(err, 'load clinica atencion');
        this.loading = false;
      }
    });
  }

  openAdd(): void {
    this.isEditing = false;
    this.item = { nombre_clinica: '', direccion_clinica: null, latitud: null, longitud: null, logo_path: null, activo: true };
    this.errorMessage = '';
    this.showModal = true;
  }

  openEdit(c: ClinicaAtencion): void {
    this.isEditing = true;
    this.item = { ...c };
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
    this.errorMessage = '';
  }

  save(): void {
    const name = (this.item['nombre_clinica'] as string)?.trim();
    if (!name) {
      this.errorMessage = 'El nombre es obligatorio.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    const latRaw = this.item['latitud'];
    const lngRaw = this.item['longitud'];
    const latStr =
      latRaw === null || latRaw === undefined ? '' : String(latRaw).trim();
    const lngStr =
      lngRaw === null || lngRaw === undefined ? '' : String(lngRaw).trim();
    let latitud: number | null = null;
    let longitud: number | null = null;
    if (latStr || lngStr) {
      const la = latStr === '' ? NaN : Number(latStr.replace(',', '.'));
      const lo = lngStr === '' ? NaN : Number(lngStr.replace(',', '.'));
      if (!Number.isFinite(la) || !Number.isFinite(lo)) {
        this.errorMessage =
          'Latitud y longitud deben ser números válidos (o deje ambos vacíos).';
        this.saving = false;
        return;
      }
      latitud = la;
      longitud = lo;
    }
    const payload = {
      nombre_clinica: name,
      direccion_clinica: (this.item['direccion_clinica'] as string) || null,
      latitud,
      longitud,
      logo_path: (this.item['logo_path'] as string) || null,
      activo: this.item['activo'] !== false
    };
    if (this.isEditing && this.item['id']) {
      this.service.update(this.item['id'] as number, payload).subscribe({
        next: () => {
          this.alertService.showSuccess('Actualizado.');
          this.closeModal();
          this.loadList();
        },
        error: (err) => {
          this.errorMessage = this.errorHandler.getSafeErrorMessage(err, 'update');
          this.saving = false;
        }
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => {
          this.alertService.showSuccess('Creado.');
          this.closeModal();
          this.loadList();
        },
        error: (err) => {
          this.errorMessage = this.errorHandler.getSafeErrorMessage(err, 'create');
          this.saving = false;
        }
      });
    }
  }

  requestDelete(c: ClinicaAtencion): void {
    this.confirmDelete = c;
  }

  cancelDelete(): void {
    this.confirmDelete = null;
  }

  get confirmDeleteNombre(): string {
    return this.confirmDelete?.nombre_clinica ?? '';
  }

  confirmDeleteOk(): void {
    if (!this.confirmDelete) return;
    this.service.delete(this.confirmDelete.id).subscribe({
      next: () => {
        this.alertService.showSuccess('Eliminado.');
        this.confirmDelete = null;
        this.loadList();
      },
      error: (err) => {
        this.alertService.showError(this.errorHandler.getSafeErrorMessage(err, 'delete'));
      }
    });
  }
}
