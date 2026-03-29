import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessageRequest {
  message?: string;
  conversationId?: string;
  audioBase64?: string;
  mimeType?: string;
}

export interface ChatMessageResponse {
  success: boolean;
  reply: string;
  conversationId: string;
  fromAudio?: boolean;
  /** Ruta a la que navegar (ej. /patients/5/antecedentes). El chat muestra un botón "Abrir". */
  navigateTo?: string;
  pdfDownload?: { base64: string; filename: string };
  pdfDownloads?: { base64: string; filename: string; label: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private get baseUrl(): string {
    const url = environment.chatApiUrl ?? '';
    return url ? `${url.replace(/\/$/, '')}/api/chat` : '/api/chat';
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  /**
   * Envía un mensaje de texto al chatbot.
   */
  sendMessage(message: string, conversationId?: string): Observable<ChatMessageResponse> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    const body: ChatMessageRequest = { message, conversationId };
    return this.http.post<ChatMessageResponse>(`${this.baseUrl}/message`, body, { headers });
  }

  /**
   * Envía un mensaje de voz (audio en base64). El chatbot transcribe con Whisper y responde.
   */
  sendAudio(audioBase64: string, mimeType: string, conversationId?: string): Observable<ChatMessageResponse> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    const body: ChatMessageRequest = { audioBase64, mimeType, conversationId };
    return this.http.post<ChatMessageResponse>(`${this.baseUrl}/message`, body, { headers });
  }
}
