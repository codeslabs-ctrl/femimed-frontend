import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ver-mensaje',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ver-modal-overlay" (click)="onClose()">
      <div class="ver-modal" (click)="$event.stopPropagation()">
        <div class="ver-header">
          <h2>📄 Ver Mensaje</h2>
          <button class="btn-close" (click)="onClose()">×</button>
        </div>
        
        <div class="ver-body">
          <div class="mensaje-info">
            <div class="info-row">
              <div class="info-label">📝 Título:</div>
              <div class="info-value titulo">{{ mensaje?.titulo }}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">📋 Tipo:</div>
              <div class="info-value tipo" [class]="getTipoClass()">
                {{ getTipoTexto() }}
              </div>
            </div>
            
            <div class="info-row">
              <div class="info-label">📊 Estado:</div>
              <div class="info-value estado" [class]="getEstadoClass()">
                {{ getEstadoTexto() }}
              </div>
            </div>
            
            <div class="info-row" *ngIf="mensaje?.fecha_programado">
              <div class="info-label">⏰ Programado:</div>
              <div class="info-value fecha">
                {{ getFechaProgramada() }}
              </div>
            </div>
            
            <div class="info-row" *ngIf="mensaje?.fecha_envio">
              <div class="info-label">📤 Enviado:</div>
              <div class="info-value fecha">
                {{ getFechaEnviada() }}
              </div>
            </div>
            
            <div class="info-row">
              <div class="info-label">👥 Destinatarios:</div>
              <div class="info-value destinatarios">
                {{ mensaje?.total_destinatarios || 0 }} personas
              </div>
            </div>
            
            <div class="info-row" *ngIf="mensaje?.total_enviados > 0">
              <div class="info-label">✅ Enviados:</div>
              <div class="info-value enviados">
                {{ mensaje?.total_enviados }} personas
              </div>
            </div>
            
            <div class="info-row" *ngIf="mensaje?.total_fallidos > 0">
              <div class="info-label">❌ Fallidos:</div>
              <div class="info-value fallidos">
                {{ mensaje?.total_fallidos }} personas
              </div>
            </div>
          </div>

          <div class="contenido-section">
            <div class="contenido-label">📄 Contenido del Mensaje:</div>
            <div class="contenido-texto">
              {{ mensaje?.contenido }}
            </div>
          </div>
        </div>

        <div class="ver-footer">
          <button type="button" class="btn btn-secondary" (click)="onClose()">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ver-modal-overlay {
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

    .ver-modal {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .ver-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #7A9CC6 0%, #5A7A9A 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    .ver-header h2 {
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

    .ver-body {
      padding: 24px;
    }

    .mensaje-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .info-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 12px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-weight: 600;
      color: #374151;
      font-size: 0.9rem;
      min-width: 120px;
      flex-shrink: 0;
    }

    .info-value {
      flex: 1;
      color: #1f2937;
      font-size: 0.95rem;
    }

    .titulo {
      font-weight: 600;
      color: #1e293b;
      font-size: 1.1rem;
    }

    .tipo {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .tipo-general {
      background: #dbeafe;
      color: #1e40af;
    }

    .tipo-urgente {
      background: #fef2f2;
      color: #dc2626;
    }

    .tipo-recordatorio {
      background: #f0fdf4;
      color: #16a34a;
    }

    .estado {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .estado-borrador {
      background: #f3f4f6;
      color: #6b7280;
    }

    .estado-programado {
      background: #fef3c7;
      color: #d97706;
    }

    .estado-enviado {
      background: #d1fae5;
      color: #059669;
    }

    .fecha {
      color: #6b7280;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .destinatarios {
      color: #1f2937;
      font-weight: 500;
    }

    .enviados {
      color: #059669;
      font-weight: 500;
    }

    .fallidos {
      color: #dc2626;
      font-weight: 500;
    }

    .contenido-section {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
    }

    .contenido-label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      font-size: 0.95rem;
    }

    .contenido-texto {
      color: #1f2937;
      line-height: 1.6;
      white-space: pre-wrap;
      font-size: 0.95rem;
      max-height: 300px;
      overflow-y: auto;
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .ver-footer {
      display: flex;
      justify-content: flex-end;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      border-radius: 0 0 12px 12px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover {
      background: #4b5563;
    }

    @media (max-width: 640px) {
      .ver-modal {
        width: 95%;
        margin: 20px;
      }
      
      .ver-header,
      .ver-body,
      .ver-footer {
        padding: 16px;
      }
      
      .info-row {
        flex-direction: column;
        gap: 4px;
      }
      
      .info-label {
        min-width: auto;
      }
    }
  `]
})
export class VerMensajeComponent {
  @Input() mensaje: any = null;
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();

  getTipoTexto(): string {
    switch (this.mensaje?.tipo_mensaje) {
      case 'general': return 'General';
      case 'urgente': return 'Urgente';
      case 'recordatorio': return 'Recordatorio';
      default: return 'General';
    }
  }

  getTipoClass(): string {
    return `tipo-${this.mensaje?.tipo_mensaje || 'general'}`;
  }

  getEstadoTexto(): string {
    switch (this.mensaje?.estado) {
      case 'borrador': return 'Borrador';
      case 'programado': return 'Programado';
      case 'enviado': return 'Enviado';
      default: return 'Borrador';
    }
  }

  getEstadoClass(): string {
    return `estado-${this.mensaje?.estado || 'borrador'}`;
  }

  getFechaProgramada(): string {
    if (!this.mensaje?.fecha_programado) return '';
    const fecha = new Date(this.mensaje.fecha_programado);
    return this.formatearFecha(fecha);
  }

  getFechaEnviada(): string {
    if (!this.mensaje?.fecha_envio) return '';
    const fecha = new Date(this.mensaje.fecha_envio);
    return this.formatearFecha(fecha);
  }

  formatearFecha(fecha: Date): string {
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    const diaSemana = diasSemana[fecha.getDay()];
    
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    
    return `${diaSemana}, ${dia} de ${mes} de ${año} a las ${horas}:${minutos}`;
  }

  onClose() {
    this.close.emit();
  }
}



