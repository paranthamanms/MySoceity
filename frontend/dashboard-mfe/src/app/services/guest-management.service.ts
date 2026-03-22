import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PreApproval {
  id?: number;
  apartmentNumber: string;
  societyName: string;
  visitorType: string;
  visitorName: string;
  visitorPhone?: string;
  validFrom: string;
  validUntil: string;
  description?: string;
  createdBy: string;
  createdAt?: string;
  status?: string;
}

export interface ApprovalRequest {
  id?: number;
  apartmentNumber: string;
  societyName: string;
  tower?: string;
  visitorType: string;
  visitorName: string;
  visitorPhone?: string;
  visitorIdProof?: string;
  visitorAadhaar?: string;
  serviceSubCategory?: string;
  ownerName?: string;
  ownerPhone?: string;
  faceCapture?: string;
  scannerCode?: string;
  scannerSource?: string;
  purpose?: string;
  deliveryService?: string;
  deliveryServiceOther?: string;
  cabService?: string;
  cabServiceOther?: string;
  requestedBy: string;
  requestedAt?: string;
  status?: string;
  respondedAt?: string;
  respondedBy?: string;
  responseNote?: string;
}

export interface ApprovalLog {
  id?: number;
  apartmentNumber: string;
  societyName: string;
  tower?: string;
  visitorType: string;
  visitorName: string;
  visitorPhone?: string;
  visitorAadhaar?: string;
  serviceSubCategory?: string;
  ownerName?: string;
  ownerPhone?: string;
  faceCapture?: string;
  scannerCode?: string;
  scannerSource?: string;
  entryType: string;
  approvalMethod?: string;
  deliveryService?: string;
  deliveryServiceOther?: string;
  cabService?: string;
  cabServiceOther?: string;
  approvedBy: string;
  approvedAt?: string;
  entryTime?: string;
  exitTime?: string;
  exitMethod?: string;
  exitFaceCapture?: string;
  exitMatchConfidence?: number;
  securityGuard?: string;
  notes?: string;
  preApprovalId?: number;
  requestId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GuestManagementService {
  private apiUrl = 'http://localhost:8002/api';

  constructor(private http: HttpClient) {}

  // ========== Pre-Approvals ==========
  
  createPreApproval(preApproval: PreApproval): Observable<PreApproval> {
    return this.http.post<PreApproval>(`${this.apiUrl}/pre-approvals`, preApproval);
  }

  getPreApprovals(apartmentNumber: string | null, societyName: string): Observable<PreApproval[]> {
    let params = new HttpParams().set('societyName', societyName);
    if (apartmentNumber) {
      params = params.set('apartmentNumber', apartmentNumber);
    }
    return this.http.get<PreApproval[]>(`${this.apiUrl}/pre-approvals`, { params });
  }

  getActivePreApprovals(apartmentNumber: string | null, societyName: string): Observable<PreApproval[]> {
    let params = new HttpParams().set('societyName', societyName);
    if (apartmentNumber) {
      params = params.set('apartmentNumber', apartmentNumber);
    }
    return this.http.get<PreApproval[]>(`${this.apiUrl}/pre-approvals/active`, { params });
  }

  checkPreApproval(phone: string, societyName: string): Observable<any> {
    const params = new HttpParams()
      .set('phone', phone)
      .set('societyName', societyName);
    return this.http.get<any>(`${this.apiUrl}/pre-approvals/check`, { params });
  }

  revokePreApproval(id: number, userId: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.delete<any>(`${this.apiUrl}/pre-approvals/${id}`, { params });
  }

  // ========== Approval Requests ==========
  
  createApprovalRequest(request: any): Observable<ApprovalRequest> {
    return this.http.post<ApprovalRequest>(`${this.apiUrl}/approval-requests`, request);
  }

  getPendingRequests(apartmentNumber: string, societyName: string): Observable<ApprovalRequest[]> {
    const params = new HttpParams()
      .set('apartmentNumber', apartmentNumber)
      .set('societyName', societyName);
    return this.http.get<ApprovalRequest[]>(`${this.apiUrl}/approval-requests/pending`, { params });
  }
  
  // Alias for getPendingRequests (for pop-up polling)
  getPendingRequestsForApartment(apartmentNumber: string, societyName: string): Observable<ApprovalRequest[]> {
    return this.getPendingRequests(apartmentNumber, societyName);
  }

  getAllRequests(apartmentNumber: string | null, societyName: string): Observable<ApprovalRequest[]> {
    let params = new HttpParams().set('societyName', societyName);
    if (apartmentNumber) {
      params = params.set('apartmentNumber', apartmentNumber);
    }
    return this.http.get<ApprovalRequest[]>(`${this.apiUrl}/approval-requests`, { params });
  }

  approveRequest(id: number, approvedBy: string, note: string = ''): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/approval-requests/${id}/approve`, {
      approvedBy,
      approvalMethod: 'DASHBOARD',
      note
    });
  }

  rejectRequest(id: number, rejectedBy: string, note: string = ''): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/approval-requests/${id}/reject`, {
      rejectedBy,
      note
    });
  }

  // ========== Approval Logs ==========
  
  getApprovalLogs(societyName: string, apartmentNumber?: string): Observable<ApprovalLog[]> {
    let params = new HttpParams().set('societyName', societyName);
    if (apartmentNumber) {
      params = params.set('apartmentNumber', apartmentNumber);
    }
    return this.http.get<ApprovalLog[]>(`${this.apiUrl}/approval-logs`, { params });
  }

  getActiveVisitors(societyName: string): Observable<ApprovalLog[]> {
    const params = new HttpParams().set('societyName', societyName);
    return this.http.get<ApprovalLog[]>(`${this.apiUrl}/approval-logs/active`, { params });
  }

  markExit(id: number, payload: {
    securityGuard?: string;
    exitMethod?: string;
    exitFaceCapture?: string;
    exitMatchConfidence?: number | null;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/approval-logs/${id}/exit`, payload || {});
  }

  createLogEntry(log: ApprovalLog): Observable<ApprovalLog> {
    return this.http.post<ApprovalLog>(`${this.apiUrl}/approval-logs`, log);
  }

  generateSocietyScannerCode(societyName: string, generatedBy: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/societies/${encodeURIComponent(societyName)}/scanner-code/generate`, {
      generatedBy
    });
  }

  getSocietyScannerCode(societyName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/societies/${encodeURIComponent(societyName)}/scanner-code`);
  }
}
