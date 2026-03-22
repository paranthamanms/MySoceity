export interface ApprovalRequest {
  id?: number;
  apartmentNumber?: string | undefined;
  societyName?: string | undefined;
  tower?: string | undefined;
  visitorType?: string | undefined;
  visitorName?: string | undefined;
  visitorPhone?: string | undefined;
  visitorAadhaar?: string | undefined;
  serviceSubCategory?: string | undefined;
  ownerName?: string | undefined;
  ownerPhone?: string | undefined;
  faceCapture?: string | undefined;
  scannerCode?: string | undefined;
  scannerSource?: string | undefined;
  deliveryService?: string | undefined;
  deliveryServiceOther?: string | undefined;
  cabService?: string | undefined;
  cabServiceOther?: string | undefined;
  visitorIdProof?: string | undefined;
  purpose?: string | undefined;
  requestedBy?: string | undefined;
  residentPhone?: string | undefined;
  status?: string | undefined;
  createdDate?: string | undefined;
  requestedAt?: string | undefined; // Added for dashboard template compatibility
}

export interface ApprovalLog {
    cabService?: string;
    cabServiceOther?: string;
    deliveryService?: string;
    deliveryServiceOther?: string;
  serviceSubCategory?: string;
    approvedBy?: string;
    entryTime?: string;
    exitTime?: string;
  faceCapture?: string;
  ownerName?: string;
  ownerPhone?: string;
  visitorAadhaar?: string;
  scannerCode?: string;
  scannerSource?: string;
  id?: number;
  societyName?: string | undefined;
  apartmentNumber?: string | undefined;
  tower?: string | undefined;
  visitorName?: string | undefined;
  visitorPhone?: string | undefined;
  visitorType?: string | undefined;
  checkInTime?: string | undefined;
  checkOutTime?: string | undefined;
  status?: string | undefined;
  exitMethod?: string | undefined;
  exitFaceCapture?: string | undefined;
  exitMatchConfidence?: number | undefined;
}

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
