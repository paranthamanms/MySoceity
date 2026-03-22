import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { UserProfile } from '../models/approval.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authUrl = 'http://10.0.2.2:8001/api/auth';
  private userUrl = 'http://10.0.2.2:8002/api';

  constructor(private http: HttpClient) {}

  private normalizeRoleValue(value?: string): string {
    return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private pickFirst(...values: any[]): string {
    for (const value of values) {
      if (value === null || value === undefined) continue;
      const text = String(value).trim();
      if (text) return text;
    }
    return '';
  }

  private normalizeUserProfile(raw: any, res?: any): UserProfile {
    return {
      ...raw,
      username: this.pickFirst(raw?.username, raw?.userName, res?.username),
      email: this.pickFirst(raw?.email, res?.email),
      fullName: this.pickFirst(raw?.fullName, raw?.full_name, raw?.name, res?.fullName),
      phoneNumber: this.pickFirst(raw?.phoneNumber, raw?.mobileNumber, raw?.phone_number, res?.phoneNumber),
      apartmentNumber: this.pickFirst(raw?.apartmentNumber, raw?.flatNumber, raw?.flat_number, res?.apartmentNumber, res?.flatNumber),
      tower: this.pickFirst(raw?.tower, raw?.towerNumber, raw?.tower_number, res?.tower, res?.towerNumber),
      societyName: this.pickFirst(raw?.societyName, raw?.society_name, raw?.society, raw?.address, res?.societyName, res?.society, res?.address),
      role: this.pickFirst(raw?.role, res?.role, res?.userRole),
      userType: this.pickFirst(raw?.userType, raw?.user_type, res?.userType),
      ownerType: this.pickFirst(raw?.ownerType, raw?.owner_type, res?.ownerType)
    };
  }

  private mapLoginUser(res: any): UserProfile | null {
    const raw = res?.user || {};
    const mapped = this.normalizeUserProfile(raw, res);

    return mapped.username || mapped.role || mapped.userType || mapped.ownerType ? mapped : null;
  }

  private getNormalizedRoleCandidates(user: UserProfile | null): string[] {
    if (!user) return [];
    return [user.role, user.userType, user.ownerType]
      .map(v => this.normalizeRoleValue(v))
      .filter(v => !!v);
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, { username, password }).pipe(
      tap(res => {
        if (res.token) localStorage.setItem('token', res.token);
        const mappedUser = this.mapLoginUser(res);
        if (mappedUser) localStorage.setItem('user', JSON.stringify(mappedUser));
      })
    );
  }

  sendOtp(mobileNumber: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/send-otp`, { mobileNumber });
  }

  private getMobileVariants(mobileNumber: string): string[] {
    const raw = (mobileNumber || '').trim();
    const digits = raw.replace(/\D/g, '');
    const last10 = digits.length > 10 ? digits.slice(-10) : digits;

    const variants = [
      raw,
      digits,
      last10,
      last10 ? `+91${last10}` : ''
    ].map(v => (v || '').trim()).filter(v => !!v);

    return Array.from(new Set(variants));
  }

  private loginByMobileWithFallback(variants: string[], index = 0): Observable<any> {
    if (index >= variants.length) {
      return throwError(() => new Error('Mobile login failed'));
    }

    return this.http.get<any>(`${this.authUrl}/login-by-mobile`, {
      params: { mobile: variants[index] }
    }).pipe(
      switchMap((res: any) => {
        if (res?.success === false) {
          return this.loginByMobileWithFallback(variants, index + 1);
        }
        return of(res);
      }),
      catchError(() => this.loginByMobileWithFallback(variants, index + 1))
    );
  }

  loginWithOtp(mobileNumber: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/verify-otp`, { mobileNumber, otp }).pipe(
      switchMap((verifyRes: any) => {
        if (!verifyRes?.success) {
          throw new Error(verifyRes?.message || 'OTP verification failed');
        }
        return this.loginByMobileWithFallback(this.getMobileVariants(mobileNumber));
      }),
      map((res: any) => {
        if (res?.success === false) {
          throw new Error(res?.message || 'Mobile login failed');
        }
        return res;
      }),
      tap(res => {
        if (res.token) localStorage.setItem('token', res.token);
        const mappedUser = this.mapLoginUser(res);
        if (mappedUser) localStorage.setItem('user', JSON.stringify(mappedUser));
      })
    );
  }

  changePassword(username: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/change-password`, { username, newPassword });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): UserProfile | null {
    const saved = localStorage.getItem('user');
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    const normalized = this.normalizeUserProfile(parsed);
    localStorage.setItem('user', JSON.stringify(normalized));
    return normalized;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /** True for security guards */
  isSecurityGuard(): boolean {
    const user = this.getCurrentUser();
    const roles = this.getNormalizedRoleCandidates(user);
    return roles.some(role => role.includes('security') || role.includes('guard'));
  }

  /** True for platform admin (superadmin) */
  isAdminUser(): boolean {
    const user = this.getCurrentUser();
    const roles = this.getNormalizedRoleCandidates(user);
    return roles.some(role => role === 'admin' || role === 'superadmin' || role.includes('superadmin'));
  }

  /** True for super admin user */
  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    const roles = this.getNormalizedRoleCandidates(user);
    return roles.some(role => role === 'superadmin' || role.includes('superadmin'));
  }

  isSocietyUser(): boolean {
    return !this.isSecurityGuard() && !this.isSuperAdmin() && !this.isSocietyAdmin();
  }

  getRoleCategory(): 'super-admin' | 'society-admin' | 'security' | 'society-user' {
    if (this.isSecurityGuard()) return 'security';
    if (this.isSuperAdmin()) return 'super-admin';
    if (this.isSocietyAdmin()) return 'society-admin';
    return 'society-user';
  }

  /** True for society-level admin */
  isSocietyAdmin(): boolean {
    const user = this.getCurrentUser();
    const roles = this.getNormalizedRoleCandidates(user);
    return roles.some(role => role.includes('societyadmin'));
  }

  /** Returns target route for current logged-in user */
  getDashboardRoute(): string {
    return this.isSecurityGuard() ? '/security' : '/community';
  }

  /** Human-friendly role text for UI badges */
  getCurrentRoleLabel(): string {
    const user = this.getCurrentUser();
    const raw = user?.role || user?.userType || user?.ownerType || '';
    if (!raw) return 'Resident';
    return raw
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  /** Returns the appropriate dashboard title */
  getDashboardTitle(): string {
    if (this.isSecurityGuard()) return 'Security Dashboard';
    if (this.isAdminUser()) return 'Admin Dashboard';
    if (this.isSocietyAdmin()) return 'Society Admin Dashboard';
    return 'Community Dashboard';
  }
}
