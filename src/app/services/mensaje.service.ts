import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MensajeDifusion, MensajeDestinatario, MensajeFormData, PacienteParaDifusion, MensajeEstadisticas } from '../models/mensaje.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MensajeService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Obtener todos los mensajes
  getMensajes(): Observable<{success: boolean, data: MensajeDifusion[]}> {
    return this.http.get<{success: boolean, data: MensajeDifusion[]}>(`${this.API_URL}/mensajes`);
  }

  // Obtener mensaje por ID
  getMensajeById(id: number): Observable<{success: boolean, data: MensajeDifusion}> {
    return this.http.get<{success: boolean, data: MensajeDifusion}>(`${this.API_URL}/mensajes/${id}`);
  }

  // Crear mensaje
  crearMensaje(mensaje: MensajeFormData): Observable<{success: boolean, data: MensajeDifusion}> {
    return this.http.post<{success: boolean, data: MensajeDifusion}>(`${this.API_URL}/mensajes`, mensaje);
  }

  // Actualizar mensaje
  actualizarMensaje(id: number, mensaje: Partial<MensajeFormData>): Observable<{success: boolean, data: MensajeDifusion}> {
    return this.http.put<{success: boolean, data: MensajeDifusion}>(`${this.API_URL}/mensajes/${id}`, mensaje);
  }

  // Eliminar mensaje
  eliminarMensaje(id: number): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.API_URL}/mensajes/${id}`);
  }

  // Obtener pacientes para difusión
  getPacientesParaDifusion(filtros?: any): Observable<{success: boolean, data: PacienteParaDifusion[]}> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.busqueda) {
        params = params.set('busqueda', filtros.busqueda);
      }
      if (filtros.especialidad) {
        params = params.set('especialidad', filtros.especialidad);
      }
      if (filtros.medico) {
        params = params.set('medico', filtros.medico);
      }
      if (filtros.activos) {
        params = params.set('activos', filtros.activos);
      }
    }
    
    return this.http.get<{success: boolean, data: PacienteParaDifusion[]}>(`${this.API_URL}/mensajes/pacientes`, {
      params: params
    });
  }

  // Enviar mensaje
  enviarMensaje(id: number): Observable<{success: boolean}> {
    return this.http.post<{success: boolean}>(`${this.API_URL}/mensajes/${id}/enviar`, {});
  }

  // Programar mensaje
  programarMensaje(id: number, fechaProgramado: string): Observable<{success: boolean}> {
    return this.http.post<{success: boolean}>(`${this.API_URL}/mensajes/${id}/programar`, {
      fecha_programado: fechaProgramado
    });
  }

  // Obtener destinatarios de un mensaje
  getDestinatarios(mensajeId: number): Observable<{success: boolean, data: MensajeDestinatario[]}> {
    return this.http.get<{success: boolean, data: MensajeDestinatario[]}>(`${this.API_URL}/mensajes/${mensajeId}/destinatarios`);
  }

  // Obtener estadísticas
  getEstadisticas(): Observable<{success: boolean, data: MensajeEstadisticas}> {
    return this.http.get<{success: boolean, data: MensajeEstadisticas}>(`${this.API_URL}/mensajes/estadisticas`);
  }

  // Duplicar mensaje
  duplicarMensaje(id: number): Observable<{success: boolean, data: MensajeDifusion}> {
    return this.http.post<{success: boolean, data: MensajeDifusion}>(`${this.API_URL}/mensajes/${id}/duplicar`, {});
  }

  // Obtener destinatarios actuales con información completa
  getDestinatariosActuales(id: number): Observable<{success: boolean, data: PacienteParaDifusion[]}> {
    return this.http.get<{success: boolean, data: PacienteParaDifusion[]}>(`${this.API_URL}/mensajes/${id}/destinatarios-actuales`);
  }

  // Agregar nuevos destinatarios
  agregarDestinatarios(id: number, destinatarios: number[]): Observable<{success: boolean}> {
    return this.http.post<{success: boolean}>(`${this.API_URL}/mensajes/${id}/destinatarios/agregar`, {
      destinatarios
    });
  }

  // Eliminar destinatario específico
  eliminarDestinatario(id: number, pacienteId: number): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.API_URL}/mensajes/${id}/destinatarios/${pacienteId}`);
  }

  sincronizarContadores(): Observable<{success: boolean}> {
    return this.http.post<{success: boolean}>(`${this.API_URL}/mensajes/sincronizar-contadores`, {});
  }
}
