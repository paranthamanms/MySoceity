import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApprovalRequest, ApprovalLog, PreApproval, CommunityPost } from '../models/approval.model';

@Injectable({ providedIn: 'root' })
export class GuestManagementService {
  private apiUrl = 'http://10.0.2.2:8002/api';

  constructor(private http: HttpClient) {}

  // ========== Pre-Approvals ==========
  createPreApproval(pa: PreApproval): Observable<PreApproval> {
    return this.http.post<PreApproval>(`${this.apiUrl}/pre-approvals`, pa);
  }

  getPreApprovals(apartmentNumber: string | null, societyName: string): Observable<PreApproval[]> {
    let params = new HttpParams().set('societyName', societyName);
    if (apartmentNumber) params = params.set('apartmentNumber', apartmentNumber);
    return this.http.get<PreApproval[]>(`${this.apiUrl}/pre-approvals`, { params });
  }

  getActivePreApprovals(apartmentNumber: string | null, societyName: string): Observable<PreApproval[]> {
    let params = new HttpParams().set('societyName', societyName);
    if (apartmentNumber) params = params.set('apartmentNumber', apartmentNumber);
    return this.http.get<PreApproval[]>(`${this.apiUrl}/pre-approvals/active`, { params });
  }

  deletePreApproval(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pre-approvals/${id}`);
  }

  // ========== Approval Requests ==========
  createApprovalRequest(req: ApprovalRequest): Observable<ApprovalRequest> {
    return this.http.post<ApprovalRequest>(`${this.apiUrl}/approval-requests`, req);
  }

  getPendingRequests(apartmentNumber: string, societyName: string): Observable<ApprovalRequest[]> {
    const params = new HttpParams()
      .set('apartmentNumber', apartmentNumber)
      .set('societyName', societyName)
      .set('status', 'PENDING');
    return this.http.get<ApprovalRequest[]>(`${this.apiUrl}/approval-requests`, { params });
  }

  getAllPendingForSociety(societyName: string): Observable<ApprovalRequest[]> {
    const params = new HttpParams().set('societyName', societyName).set('status', 'PENDING');
    return this.http.get<ApprovalRequest[]>(`${this.apiUrl}/approval-requests/all`, { params });
  }

  approveRequest(id: number, respondedBy: string, note?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/approval-requests/${id}/approve`, { respondedBy, responseNote: note });
  }

  rejectRequest(id: number, respondedBy: string, note?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/approval-requests/${id}/reject`, { respondedBy, responseNote: note });
  }

  // ========== Approval Logs ==========
  getApprovalLogs(societyName: string, apartmentNumber?: string): Observable<ApprovalLog[]> {
    let params = new HttpParams().set('societyName', societyName);
    if (apartmentNumber) params = params.set('apartmentNumber', apartmentNumber);
    return this.http.get<ApprovalLog[]>(`${this.apiUrl}/approval-logs`, { params });
  }

  generateSocietyScannerCode(societyName: string, generatedBy: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/societies/${encodeURIComponent(societyName)}/scanner-code/generate`, {
      generatedBy
    });
  }

  getSocietyScannerCode(societyName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/societies/${encodeURIComponent(societyName)}/scanner-code`);
  }

  // ========== Posts ===========
  getAnnouncements(societyName: string): Observable<CommunityPost[]> {
    const params = new HttpParams().set('societyName', societyName);
    return this.http.get<CommunityPost[]>(`${this.apiUrl}/posts/announcements`, { params });
  }

  getCommunityPosts(societyName: string): Observable<CommunityPost[]> {
    const params = new HttpParams().set('societyName', societyName);
    return this.http.get<CommunityPost[]>(`${this.apiUrl}/posts/community`, { params });
  }
}
