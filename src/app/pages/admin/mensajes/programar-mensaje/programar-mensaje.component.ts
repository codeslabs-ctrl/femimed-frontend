import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-programar-mensaje',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="programar-modal-overlay" (click)="onCancel()">
      <div class="programar-modal" (click)="$event.stopPropagation()">
        <div class="programar-header">
          <h2>📅 Programar Envío de Mensaje</h2>
          <button class="btn-close" (click)="onCancel()">×</button>
        </div>
        
        <div class="programar-body">
          <div class="mensaje-info">
            <h3>{{ mensaje?.titulo }}</h3>
            <p class="mensaje-preview">{{ mensaje?.contenido | slice:0:100 }}{{ mensaje?.contenido && mensaje.contenido.length > 100 ? '...' : '' }}</p>
          </div>

          <div class="fecha-selection">
            <div class="form-group">
              <label for="fecha">📅 Fecha de Envío:</label>
              <input 
                type="date" 
                id="fecha"
                [(ngModel)]="fechaSeleccionada"
                name="fecha"
                [min]="fechaMinima"
                class="form-control"
                (change)="onFechaChange()"
              >
            </div>

            <div class="form-group">
              <label for="hora">🕐 Hora de Envío:</label>
              <input 
                type="time" 
                id="hora"
                [(ngModel)]="horaSeleccionada"
                name="hora"
                class="form-control"
                (change)="onHoraChange()"
              >
            </div>

            <div class="fecha-preview" *ngIf="fechaCompleta">
              <div class="preview-label">📋 Fecha y Hora Seleccionada:</div>
              <div class="preview-value">{{ getFechaFormateada() }}</div>
            </div>

            <div class="opciones-rapidas">
              <div class="opciones-label">⚡ Opciones Rápidas:</div>
              <div class="opciones-buttons">
                <button type="button" class="btn btn-sm btn-outline" (click)="setearHoy()">
                  Hoy
                </button>
                <button type="button" class="btn btn-sm btn-outline" (click)="setearManana()">
                  Mañana
                </button>
                <button type="button" class="btn btn-sm btn-outline" (click)="setearProximaSemana()">
                  Próxima Semana
                </button>
                <button type="button" class="btn btn-sm btn-outline" (click)="setearProximoMes()">
                  Próximo Mes
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="programar-footer">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            (click)="onConfirm()"
            [disabled]="!fechaCompleta || !esFechaValida()">
            📅 Programar Envío
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .programar-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .programar-modal {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .programar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #7A9CC6 0%, #5A7A9A 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    .programar-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: white;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .btn-close:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .programar-body {
      padding: 24px;
    }

    .mensaje-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .mensaje-info h3 {
      margin: 0 0 8px 0;
      color: #1e293b;
      font-size: 1.1rem;
    }

    .mensaje-preview {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .fecha-selection {
      display: grid;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.9rem;
    }

    .form-control {
      padding: 12px;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #7A9CC6;
      box-shadow: 0 0 0 3px rgba(122, 156, 198, 0.1);
    }

    .fecha-preview {
      background: linear-gradient(135deg, #7A9CC6 0%, #5A7A9A 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }

    .preview-label {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-bottom: 4px;
    }

    .preview-value {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .opciones-rapidas {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }

    .opciones-label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      font-size: 0.9rem;
    }

    .opciones-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }

    .btn-outline {
      background: white;
      border-color: #d1d5db;
      color: #374151;
    }

    .btn-outline:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover {
      background: #4b5563;
    }

    .btn-primary {
      background: linear-gradient(135deg, #7A9CC6 0%, #5A7A9A 100%);
      color: white;
      border: none;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .programar-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      border-radius: 0 0 12px 12px;
    }

    @media (max-width: 640px) {
      .programar-modal {
        width: 95%;
        margin: 20px;
      }
      
      .programar-header,
      .programar-body,
      .programar-footer {
        padding: 16px;
      }
      
      .opciones-buttons {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class ProgramarMensajeComponent {
  @Input() mensaje: any = null;
  @Input() show: boolean = false;
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';
  fechaCompleta: Date | null = null;

  get fechaMinima(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  ngOnInit() {
    if (this.mensaje?.fecha_programado) {
      const fecha = new Date(this.mensaje.fecha_programado);
      this.fechaSeleccionada = fecha.toISOString().split('T')[0];
      this.horaSeleccionada = fecha.toTimeString().slice(0, 5);
      this.fechaCompleta = fecha;
    } else {
      // Establecer fecha por defecto (mañana a las 9:00 AM)
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      this.fechaSeleccionada = manana.toISOString().split('T')[0];
      this.horaSeleccionada = '09:00';
      this.actualizarFechaCompleta();
    }
  }

  onFechaChange() {
    this.actualizarFechaCompleta();
  }

  onHoraChange() {
    this.actualizarFechaCompleta();
  }

  actualizarFechaCompleta() {
    if (this.fechaSeleccionada && this.horaSeleccionada) {
      const fechaHora = new Date(`${this.fechaSeleccionada}T${this.horaSeleccionada}`);
      this.fechaCompleta = fechaHora;
    } else {
      this.fechaCompleta = null;
    }
  }

  esFechaValida(): boolean {
    if (!this.fechaCompleta) return false;
    const ahora = new Date();
    return this.fechaCompleta > ahora;
  }

  setearHoy() {
    const hoy = new Date();
    this.fechaSeleccionada = hoy.toISOString().split('T')[0];
    this.horaSeleccionada = hoy.toTimeString().slice(0, 5);
    this.actualizarFechaCompleta();
  }

  setearManana() {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    this.fechaSeleccionada = manana.toISOString().split('T')[0];
    this.horaSeleccionada = '09:00';
    this.actualizarFechaCompleta();
  }

  setearProximaSemana() {
    const proximaSemana = new Date();
    proximaSemana.setDate(proximaSemana.getDate() + 7);
    this.fechaSeleccionada = proximaSemana.toISOString().split('T')[0];
    this.horaSeleccionada = '09:00';
    this.actualizarFechaCompleta();
  }

  setearProximoMes() {
    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    this.fechaSeleccionada = proximoMes.toISOString().split('T')[0];
    this.horaSeleccionada = '09:00';
    this.actualizarFechaCompleta();
  }

  onConfirm() {
    if (this.fechaCompleta && this.esFechaValida()) {
      const fechaISO = this.fechaCompleta.toISOString();
      this.confirm.emit(fechaISO);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  getFechaFormateada(): string {
    if (!this.fechaCompleta) return '';
    
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const dia = this.fechaCompleta.getDate();
    const mes = meses[this.fechaCompleta.getMonth()];
    const año = this.fechaCompleta.getFullYear();
    const diaSemana = diasSemana[this.fechaCompleta.getDay()];
    
    const horas = this.fechaCompleta.getHours().toString().padStart(2, '0');
    const minutos = this.fechaCompleta.getMinutes().toString().padStart(2, '0');
    
    return `${diaSemana}, ${dia} de ${mes} de ${año} a las ${horas}:${minutos}`;
  }
}
