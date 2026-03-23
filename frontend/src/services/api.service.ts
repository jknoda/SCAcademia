import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Academy, User, JWTResponse } from '../types';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  checkSetupNeeded(): Observable<{ needsSetup: boolean }> {
    return this.http.get<{ needsSetup: boolean }>(`${this.apiUrl}/auth/setup/init`);
  }

  createAcademy(data: {
    name: string;
    location: string;
    email: string;
    phone: string;
  }): Observable<{ academyId: string; message: string; nextStep: string }> {
    return this.http.post<any>(`${this.apiUrl}/auth/academies`, data);
  }

  initAdmin(
    academyId: string,
    data: {
      email: string;
      password: string;
      fullName: string;
    }
  ): Observable<{ userId: string; email: string; message: string }> {
    return this.http.post<any>(`${this.apiUrl}/auth/academies/${academyId}/init-admin`, data);
  }

  login(credentials: { email: string; password: string }): Observable<JWTResponse> {
    return this.http.post<JWTResponse>(`${this.apiUrl}/auth/login`, credentials, {
      withCredentials: true,
    });
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(
      `${this.apiUrl}/auth/refresh`,
      {},
      {
        withCredentials: true,
      }
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/auth/logout`,
      {},
      {
        withCredentials: true,
      }
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string; redirectTo: string }> {
    return this.http.post<{ message: string; redirectTo: string }>(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword,
    });
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/users/@me`, {
      headers: this.getHeaders(),
    });
  }

  registerUser(data: {
    email: string;
    password: string;
    fullName: string;
    role: 'Professor' | 'Aluno';
    academyId: string;
    birthDate?: string;
    responsavelEmail?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, data, {
      withCredentials: true,
    });
  }

  setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
  }
}
