import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../types';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private api: ApiService) {
    this.checkCurrentUser();
  }

  login(email: string, password: string): Observable<any> {
    return this.api.login({ email, password }).pipe(
      tap((response: any) => {
        this.api.setAccessToken(response.accessToken);
        if (response.user) {
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    this.api.logout().subscribe({
      next: () => {
        this.api.clearTokens();
        this.currentUserSubject.next(null);
      },
      error: () => {
        this.api.clearTokens();
        this.currentUserSubject.next(null);
      },
    });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.api.forgotPassword(email);
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string; redirectTo: string }> {
    return this.api.resetPassword(token, newPassword);
  }

  checkCurrentUser(): void {
    const token = this.api.getAccessToken();
    if (token) {
      this.api.getCurrentUser().subscribe(
        (user: User | null) => this.currentUserSubject.next(user),
        (error: any) => {
          this.api.clearTokens();
          this.currentUserSubject.next(null);
          console.error('Error fetching current user:', error);
        }
      );
    }
  }

  isAuthenticated(): boolean {
    return !!this.api.getAccessToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
