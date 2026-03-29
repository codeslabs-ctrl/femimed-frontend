import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { AntecedenteTipoService } from '../../services/antecedente-tipo.service';
import { HistoricoAntecedenteService } from '../../services/historico-antecedente.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { AlertService } from '../../services/alert.service';
import { AntecedenteMedicoTipo } from '../../models/antecedente-tipo.model';
import { HistoricoAntecedente } from '../../models/historico-antecedente.model';
import { Patient } from '../../models/patient.model';
import { RichTextEditorComponent } from '../../components/rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-patient-antecedentes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RichTextEditorComponent],
  template: `
    <div class="patient-antecedentes-page">
      <div class="page-header">
        <h1>Antecedentes del paciente</h1>
        <p class="patient-name" *ngIf="patient">{{ patient.nombres }} {{ patient.apellidos }}</p>
        <div class="header-actions">
          <button *ngIf="returnUrl" type="button" class="btn btn-secondary" (click)="volver()">← Volver</button>
          <a *ngIf="!returnUrl" [routerLink]="['/patients']" class="btn btn-secondary">← Gestión de Pacientes</a>
          <a [routerLink]="['/patients', pacienteId, 'edit']" class="btn btn-outline">Editar datos</a>
        </div>
      </div>

      <div *ngIf="loading" class="loading"><div class="spinner"></div><p>Cargando...</p></div>

      <div *ngIf="!loading && pacienteId" class="antecedentes-form">
        <!-- Antecedentes Médicos -->
        <div class="form-section" *ngIf="antecedentesTiposMedicos.length > 0">
          <h3>Antecedentes Médicos</h3>
          <div class="antecedente-item" *ngFor="let t of antecedentesTiposMedicos">
            <div class="antecedente-row">
              <span class="antecedente-name">{{ t.nombre }}</span>
              <span class="antecedente-si-no">
                <label><input type="radio" [name]="'med_' + t.id" [checked]="getForm(t.id!).presente === true" (change)="getForm(t.id!).presente = true"> Sí</label>
                <label><input type="radio" [name]="'med_' + t.id" [checked]="getForm(t.id!).presente === false" (change)="getForm(t.id!).presente = false; getForm(t.id!).detalle = ''"> No</label>
              </span>
            </div>
            <div class="antecedente-detalle" *ngIf="getForm(t.id!).presente && (t.requiere_detalle === 'tratamiento' || t.requiere_detalle === 'especifique')">
              <textarea class="form-control form-control-detail" rows="3" [placeholder]="t.requiere_detalle === 'tratamiento' ? 'Tratamiento' : 'Especifique'" [(ngModel)]="form[t.id!].detalle" [name]="'det_med_' + t.id"></textarea>
            </div>
          </div>
        </div>

        <!-- Antecedentes Quirúrgicos -->
        <div class="form-section" *ngIf="antecedentesTiposQuirurgicos.length > 0">
          <h3>Antecedentes Quirúrgicos</h3>
          <div class="antecedente-item" *ngFor="let t of antecedentesTiposQuirurgicos">
            <div class="antecedente-row">
              <span class="antecedente-name">{{ t.nombre }}</span>
              <span class="antecedente-si-no">
                <label><input type="radio" [name]="'quir_' + t.id" [checked]="getForm(t.id!).presente === true" (change)="getForm(t.id!).presente = true; onCirugiaChange(t.id!, true)"> Sí</label>
                <label><input type="radio" [name]="'quir_' + t.id" [checked]="getForm(t.id!).presente === false" (change)="getForm(t.id!).presente = false; onCirugiaChange(t.id!, false)"> No</label>
              </span>
            </div>
            <div class="antecedente-detalle cirugia-list" *ngIf="getForm(t.id!).presente && t.requiere_detalle === 'cirugia'">
              <div class="cirugia-row" *ngFor="let item of getCirugiaList(t.id!); let i = index">
                <input type="text" class="form-control" placeholder="Tipo de cirugía" [ngModel]="item.tipo_cirugia" (ngModelChange)="setCirugiaItem(t.id!, i, 'tipo_cirugia', $event)" [name]="'quir_t_' + t.id + '_' + i">
                <input type="text" class="form-control ano" placeholder="Año" maxlength="4" [ngModel]="item.ano" (ngModelChange)="setCirugiaItem(t.id!, i, 'ano', $event)" [name]="'quir_a_' + t.id + '_' + i">
                <button type="button" class="btn-remove" (click)="removeCirugia(t.id!, i)">✕</button>
              </div>
              <button type="button" class="btn-add" (click)="addCirugia(t.id!)">+ Agregar otra cirugía</button>
            </div>
          </div>
        </div>

        <!-- Hábitos Psicobiológicos -->
        <div class="form-section" *ngIf="antecedentesTiposHabitos.length > 0">
          <h3>Hábitos Psicobiológicos</h3>
          <div class="antecedente-item" *ngFor="let t of antecedentesTiposHabitos">
            <div class="antecedente-row">
              <span class="antecedente-name">{{ t.nombre }}</span>
              <span class="antecedente-si-no">
                <label><input type="radio" [name]="'hab_' + t.id" [checked]="getForm(t.id!).presente === true" (change)="getForm(t.id!).presente = true"> Sí</label>
                <label><input type="radio" [name]="'hab_' + t.id" [checked]="getForm(t.id!).presente === false" (change)="getForm(t.id!).presente = false; getForm(t.id!).detalle = ''"> No</label>
              </span>
            </div>
            <div class="antecedente-detalle" *ngIf="getForm(t.id!).presente && (t.requiere_detalle === 'tratamiento' || t.requiere_detalle === 'especifique')">
              <textarea class="form-control form-control-detail" rows="3" placeholder="Detalle (ej. cig/día, tipo de bebida)" [(ngModel)]="form[t.id!].detalle" [name]="'det_hab_' + t.id"></textarea>
            </div>
          </div>
        </div>

        <!-- Otros antecedentes -->
        <div class="form-section">
          <h3>Otros antecedentes</h3>
          <p class="form-hint">Cualquier otro antecedente en texto libre.</p>
          <app-rich-text-editor
            [value]="antecedentesOtros"
            [placeholder]="'Escriba aquí...'"
            [height]="160"
            (valueChange)="antecedentesOtros = $event">
          </app-rich-text-editor>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="volver()">Cancelar</button>
          <button type="button" class="btn btn-primary" (click)="guardar()" [disabled]="saving">
            <span *ngIf="saving" class="spinner"></span>
            {{ saving ? 'Guardando...' : 'Guardar antecedentes' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .patient-antecedentes-page { padding: 1rem; max-width: 800px; margin: 0 auto; }
    .page-header { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0; font-size: 1.5rem; }
    .patient-name { margin: 0; color: #666; }
    .header-actions { display: flex; gap: 0.5rem; margin-left: auto; }
    .loading { text-align: center; padding: 2rem; }
    .form-section { margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; }
    .form-section h3 { margin: 0 0 0.75rem 0; font-size: 1.1rem; }
    .form-hint { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #666; }
    .antecedente-item { margin-bottom: 0.75rem; }
    .antecedente-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
    .antecedente-name { flex: 1; min-width: 180px; }
    .antecedente-si-no label { margin-right: 1rem; cursor: pointer; }
    .antecedente-detalle { margin-top: 0.5rem; margin-left: 0; }
    .antecedente-detalle .form-control { margin-bottom: 0.25rem; width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 1rem; border: 1px solid #ced4da; border-radius: 6px; resize: vertical; }
    .antecedente-detalle .form-control-detail { min-height: 80px; min-width: 100%; }
    .cirugia-row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .cirugia-row .form-control { flex: 1; min-width: 200px; }
    .cirugia-row .form-control.ano { width: 90px; min-width: 90px; flex: none; }
    .btn-remove { padding: 0.25rem 0.5rem; cursor: pointer; }
    .btn-add { margin-top: 0.5rem; padding: 0.35rem 0.75rem; cursor: pointer; }
    .form-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .btn { padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; border: 1px solid #ddd; background: #fff; }
    .btn-primary { background: #0d6efd; color: #fff; border-color: #0d6efd; }
    .btn-secondary { background: #6c757d; color: #fff; border-color: #6c757d; }
    .btn-outline { background: transparent; }
    .btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner { display: inline-block; width: 1rem; height: 1rem; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 0.5rem; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PatientAntecedentesComponent implements OnInit {
  pacienteId: number | null = null;
  patient: Patient | null = null;
  loading = true;
  saving = false;
  antecedentesTiposMedicos: AntecedenteMedicoTipo[] = [];
  antecedentesTiposQuirurgicos: AntecedenteMedicoTipo[] = [];
  antecedentesTiposHabitos: AntecedenteMedicoTipo[] = [];
  form: Record<number, { presente: boolean; detalle: string }> = {};
  antecedentesOtros = '';
  private cirugiaCache: Record<number, { key: string; list: { tipo_cirugia: string; ano: string }[] }> = {};
  /** Si se llegó desde otra página (ej. historia médica), volver allí tras guardar/cancelar */
  returnUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private antecedenteTipoService: AntecedenteTipoService,
    private antecedenteService: HistoricoAntecedenteService,
    private errorHandler: ErrorHandlerService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (id) {
      this.pacienteId = +id;
      this.loadPatient();
      this.loadTipos(() => this.loadAntecedentes());
    } else {
      this.loading = false;
    }
  }

  private loadPatient(): void {
    if (!this.pacienteId) return;
    this.patientService.getPatientById(this.pacienteId).subscribe({
      next: (r) => { if (r.success && r.data) this.patient = r.data; },
      error: () => {}
    });
  }

  private loadTipos(onAllLoaded?: () => void): void {
    let completed = 0;
    const total = 3;
    const maybeDone = () => {
      completed++;
      if (completed === total) {
        const all = [...this.antecedentesTiposMedicos, ...this.antecedentesTiposQuirurgicos, ...this.antecedentesTiposHabitos];
        all.forEach(t => { if (t.id != null) this.form[t.id] = { presente: false, detalle: '' }; });
        onAllLoaded?.();
      }
    };
    this.antecedenteTipoService.getByTipo('antecedentes_medicos').subscribe({
      next: (r) => { if (r.success && r.data) this.antecedentesTiposMedicos = r.data; maybeDone(); }
    });
    this.antecedenteTipoService.getByTipo('antecedentes_quirurgicos').subscribe({
      next: (r) => { if (r.success && r.data) this.antecedentesTiposQuirurgicos = r.data; maybeDone(); }
    });
    this.antecedenteTipoService.getByTipo('habitos_psicobiologicos').subscribe({
      next: (r) => { if (r.success && r.data) this.antecedentesTiposHabitos = r.data; maybeDone(); }
    });
  }

  private loadAntecedentes(): void {
    if (!this.pacienteId) return;
    this.antecedenteService.getByPacienteId(this.pacienteId).subscribe({
      next: (r) => {
        if (r.success && r.data) {
          const data = r.data as { antecedentes: HistoricoAntecedente[]; antecedentes_otros: string | null };
          const list = data.antecedentes || [];
          this.antecedentesOtros = data.antecedentes_otros ?? '';
          const all = [...this.antecedentesTiposMedicos, ...this.antecedentesTiposQuirurgicos, ...this.antecedentesTiposHabitos];
          all.forEach(t => {
            if (t.id == null) return;
            const item = list.find(a => a.antecedente_tipo_id === t.id);
            this.form[t.id] = item ? { presente: item.presente, detalle: item.detalle ?? '' } : { presente: false, detalle: '' };
          });
          this.cirugiaCache = {};
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getForm(tipoId: number): { presente: boolean; detalle: string } {
    if (!this.form[tipoId]) this.form[tipoId] = { presente: false, detalle: '' };
    return this.form[tipoId];
  }

  getCirugiaList(tipoId: number): { tipo_cirugia: string; ano: string }[] {
    const detalle = this.getForm(tipoId).detalle || '';
    const cache = this.cirugiaCache[tipoId];
    if (cache && cache.key === detalle) return cache.list;
    let list: { tipo_cirugia: string; ano: string }[] = [];
    if (detalle.trim()) {
      try {
        const parsed = JSON.parse(detalle);
        if (Array.isArray(parsed)) list = parsed.map((o: any) => ({ tipo_cirugia: o.tipo_cirugia ?? '', ano: o.ano ?? '' }));
        else if (parsed && typeof parsed === 'object') list = [{ tipo_cirugia: parsed.tipo_cirugia ?? '', ano: parsed.ano ?? '' }];
      } catch { }
    }
    this.cirugiaCache[tipoId] = { key: detalle, list };
    return list;
  }

  private setCirugiaList(tipoId: number, list: { tipo_cirugia: string; ano: string }[]): void {
    this.getForm(tipoId).detalle = list.length > 0 ? JSON.stringify(list) : '';
    this.cirugiaCache[tipoId] = { key: this.getForm(tipoId).detalle, list };
  }

  addCirugia(tipoId: number): void {
    const list = this.getCirugiaList(tipoId);
    list.push({ tipo_cirugia: '', ano: '' });
    this.setCirugiaList(tipoId, list);
  }

  removeCirugia(tipoId: number, index: number): void {
    const list = this.getCirugiaList(tipoId);
    list.splice(index, 1);
    this.setCirugiaList(tipoId, list);
  }

  setCirugiaItem(tipoId: number, index: number, field: 'tipo_cirugia' | 'ano', value: string): void {
    const list = this.getCirugiaList(tipoId);
    if (list[index]) { list[index][field] = value; this.setCirugiaList(tipoId, list); }
  }

  onCirugiaChange(tipoId: number, presente: boolean): void {
    if (!presente) this.setCirugiaList(tipoId, []);
  }

  guardar(): void {
    if (!this.pacienteId || this.saving) return;
    const all = [...this.antecedentesTiposMedicos, ...this.antecedentesTiposQuirurgicos, ...this.antecedentesTiposHabitos];
    const items = all
      .filter(t => t.id != null)
      .map(t => ({
        paciente_id: this.pacienteId!,
        antecedente_tipo_id: t.id!,
        presente: this.getForm(t.id!).presente,
        detalle: this.getForm(t.id!).detalle || null
      }));
    this.saving = true;
    this.antecedenteService.saveByPacienteId(this.pacienteId, items, this.antecedentesOtros || null).subscribe({
      next: () => {
        this.saving = false;
        this.alertService.showSuccess('Antecedentes guardados correctamente.');
        if (this.returnUrl && this.returnUrl.startsWith('/') && !this.returnUrl.startsWith('//')) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.router.navigate(['/patients']);
        }
      },
      error: (err) => {
        this.saving = false;
        this.errorHandler.logError(err, 'guardar antecedentes');
        this.alertService.showError(this.errorHandler.getSafeErrorMessage(err, 'guardar antecedentes'));
      }
    });
  }

  volver(): void {
    if (this.returnUrl && this.returnUrl.startsWith('/') && !this.returnUrl.startsWith('//')) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      this.router.navigate(['/patients']);
    }
  }
}
