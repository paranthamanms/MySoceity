export interface ApprovalRequest {
  id?: number;
  apartmentNumber?: string;
  societyName?: string;
  tower?: string;
  visitorType?: string;
  visitorName?: string;
  visitorPhone?: string;
  visitorAadhaar?: string;
  serviceSubCategory?: string;
  ownerName?: string;
  ownerPhone?: string;
  faceCapture?: string;
  scannerCode?: string;
  scannerSource?: string;
  deliveryService?: string;
  deliveryServiceOther?: string;
  cabService?: string;
  cabServiceOther?: string;
  visitorIdProof?: string;
  purpose?: string;
  requestedBy?: string;
  residentPhone?: string;
  status?: string;
  createdDate?: string;
  requestedAt?: string;
}

export interface ApprovalLog {
  id?: number;
  societyName?: string;
  apartmentNumber?: string;
  tower?: string;
  visitorName?: string;
  visitorPhone?: string;
  visitorAadhaar?: string;
  serviceSubCategory?: string;
  ownerName?: string;
  ownerPhone?: string;
  faceCapture?: string;
  scannerCode?: string;
  scannerSource?: string;
  visitorType?: string;
  cabService?: string;
  cabServiceOther?: string;
  deliveryService?: string;
  deliveryServiceOther?: string;
  approvedBy?: string;
  entryTime?: string;
  exitTime?: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: string;
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

export interface UserProfile {
  id?: number;
  username?: string;
  email?: string;
  phoneNumber?: string;
  apartmentNumber?: string;
  societyName?: string;
  tower?: string;
  role?: string;
  userType?: string;
  ownerType?: string;
  fullName?: string;
}

export interface CommunityPost {
  id?: number | string;
  title?: string;
  content?: string;
  societyName?: string;
  createdAt?: string;
  createdBy?: string;
  authorName?: string;
  postType?: string;
}
