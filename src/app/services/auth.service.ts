import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, map, switchMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, LoginResponse } from '../models/user.model';
import { MedicoService } from './medico.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}`;
  private readonly TOKEN_KEY = 'demomed_token';
  private readonly USER_KEY = 'demomed_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private medicoService: MedicoService
  ) {
    // Verificar si hay un usuario logueado al inicializar el servicio
    this.loadStoredUser();
  }

  login(username: string, password: string): Observable<LoginResponse> {
    console.log('🔍 Login attempt for user:', username);
    console.log('🔍 Password length:', password.length);
    console.log('🔍 API URL:', `${this.API_URL}/auth/login`);
    
    const loginData = {
      username,
      password
    };
    console.log('🔍 Login data being sent:', loginData);
    
    return this.http.post<any>(`${this.API_URL}/auth/login`, loginData).pipe(
      switchMap(response => {
        console.log('🔐 Login response received:', response);
        
        // El backend devuelve {success: true, data: {user: {...}, token: "..."}}
        if (response.success && response.data) {
          const user = response.data.user;
          const token = response.data.token;
          
          console.log('👤 User data:', user);
          console.log('🔑 Token:', token);
          
          // Si tiene medico_id, obtener datos completos del médico (para médicos y administradores)
          if (user.medico_id) {
            console.log('👨‍⚕️ Loading medico data for ID:', user.medico_id, 'User role:', user.rol);
            return this.medicoService.getMedicoById(user.medico_id).pipe(
              map(medicoData => {
                if (medicoData && medicoData.success && medicoData.data) {
                  // Combinar datos del usuario con datos del médico
                  const enrichedUser = {
                    ...user,
                    nombres: medicoData.data.nombres,
                    apellidos: medicoData.data.apellidos,
                    especialidad: medicoData.data.especialidad_nombre
                  };
                  
                  console.log('✅ Enriched user data:', enrichedUser);
                  
                  // Guardar token y usuario enriquecido en localStorage
                  localStorage.setItem(this.TOKEN_KEY, token);
                  localStorage.setItem(this.USER_KEY, JSON.stringify(enrichedUser));
                  
                  // Actualizar el estado del usuario
                  this.currentUserSubject.next(enrichedUser);
                  
                  return { user: enrichedUser, token } as LoginResponse;
                } else {
                  // Si no se encuentran datos del médico, usar datos básicos
                  localStorage.setItem(this.TOKEN_KEY, token);
                  localStorage.setItem(this.USER_KEY, JSON.stringify(user));
                  this.currentUserSubject.next(user);
                  return { user, token } as LoginResponse;
                }
              })
            );
          } else {
            // Para usuarios sin medico_id, usar datos básicos
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            this.currentUserSubject.next(user);
            return new Observable<LoginResponse>(observer => observer.next({ user, token }));
          }
        } else {
          throw new Error('Invalid login response format');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('🚨 Login error details:', error);
        console.error('🚨 Error status:', error.status);
        console.error('🚨 Error message:', error.message);
        console.error('🚨 Error body:', error.error);
        console.error('🚨 Error body message:', error.error?.error?.message || error.error?.message || 'No message available');
        console.error('🚨 Full error object:', error);
        
        // Si el error viene del rate limiting, asegurar que el mensaje esté disponible
        if (error.status === 429 || (error.status === 401 && error.error?.message?.includes('Demasiados intentos'))) {
          console.log('🚫 Rate limiting detected, preserving error message');
        }
        
        // Re-throw the error so the component can handle it
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // Limpiar localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.clear(); // Clear all localStorage to remove any invalid data
    
    // Limpiar el estado del usuario
    this.currentUserSubject.next(null);
    
    // Redirigir al login
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'administrador';
  }

  isMedico(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'medico';
  }

  getMedicoId(): number | null {
    const user = this.getCurrentUser();
    return user?.medico_id || null;
  }

  // Método para obtener los datos completos del médico
  getMedicoData(): Observable<any> {
    const medicoId = this.getMedicoId();
    if (medicoId) {
      return this.http.get<any>(`${this.API_URL}/medicos/${medicoId}`);
    }
    return new Observable(observer => observer.next(null));
  }

  private loadStoredUser(): void {
    try {
      const storedUser = localStorage.getItem(this.USER_KEY);
      console.log('🔍 Stored user value:', storedUser);
      
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null' && storedUser.trim() !== '') {
        const user = JSON.parse(storedUser);
        console.log('✅ Parsed user:', user);
        this.currentUserSubject.next(user);
      } else {
        console.log('🔄 No valid stored user found');
        this.currentUserSubject.next(null);
      }
    } catch (error) {
      console.error('❌ Error parsing stored user:', error);
      // Clear invalid data
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      this.currentUserSubject.next(null);
    }
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    });
  }

  needsPasswordChange(): boolean {
    const user = this.currentUserSubject.value;
    return user?.first_login === true || !user?.password_changed_at;
  }

  updateUserAfterPasswordChange(): void {
    const user = this.currentUserSubject.value;
    if (user) {
      const updatedUser = {
        ...user,
        first_login: false,
        password_changed_at: new Date().toISOString()
      };
      
      // Guardar el usuario actualizado en localStorage
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
      
      // Actualizar el BehaviorSubject
      this.currentUserSubject.next(updatedUser);
    }
  }

}
