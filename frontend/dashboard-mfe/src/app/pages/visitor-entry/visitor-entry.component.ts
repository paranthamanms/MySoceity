import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GuestManagementService } from '../../services/guest-management.service';

@Component({
  selector: 'app-visitor-entry',
  templateUrl: './visitor-entry.component.html',
  styleUrls: ['./visitor-entry.component.scss']
})
export class VisitorEntryComponent implements OnInit, OnDestroy {
  submitting = false;
  submitted = false;
  submitError = '';
  cameraError = '';
  isCameraOpen = false;
  isCameraSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  private cameraStream: MediaStream | null = null;

  scannerCode = '';
  expectedScannerCode = '';
  scannerCodeUpdatedAt = 0;

  form: any = {
    societyName: '',
    tower: '',
    apartmentNumber: '',
    visitorType: 'GUEST',
    serviceSubCategory: '',
    visitorName: '',
    visitorPhone: '',
    visitorAadhaar: '',
    visitorIdProof: '',
    ownerName: '',
    ownerPhone: '',
    residentPhone: '',
    faceCapture: '',
    purpose: '',
    scannerSource: 'QR_SCAN_SELF'
  };

  visitorTypeOptions = [
    { value: 'GUEST', label: 'Guest' },
    { value: 'DELIVERY', label: 'Delivery' },
    { value: 'CAB', label: 'Cab' },
    { value: 'VISITING_HELP', label: 'Visiting Help' },
    { value: 'VENDOR', label: 'Vendor' }
  ];

  constructor(
    private route: ActivatedRoute,
    private guestManagementService: GuestManagementService
  ) {}

  ngOnInit(): void {
    this.form.societyName = (this.route.snapshot.queryParamMap.get('societyName') || '').trim();
    this.scannerCode = (this.route.snapshot.queryParamMap.get('scannerCode') || '').trim();
    this.form.tower = (this.route.snapshot.queryParamMap.get('tower') || '').trim();
    this.form.apartmentNumber = (this.route.snapshot.queryParamMap.get('apartmentNumber') || '').trim();

    // If only combined apartment format is provided (e.g., T1-101), split it for the form.
    if (!this.form.tower && this.form.apartmentNumber.includes('-')) {
      const parts = this.form.apartmentNumber.split('-');
      if (parts.length >= 2) {
        this.form.tower = (parts[0] || '').trim();
        this.form.apartmentNumber = parts.slice(1).join('-').trim();
      }
    }

    this.refreshExpectedScannerCode();
  }

  onSocietyNameChange(): void {
    this.refreshExpectedScannerCode();
  }

  private refreshExpectedScannerCode(): void {
    const societyName = (this.form.societyName || '').trim();
    if (!societyName) {
      this.expectedScannerCode = '';
      this.scannerCodeUpdatedAt = 0;
      return;
    }

    this.guestManagementService.getSocietyScannerCode(societyName).subscribe({
      next: (res: any) => {
        this.expectedScannerCode = (res?.scannerCode || '').trim();
        this.scannerCodeUpdatedAt = Number(res?.updatedAt || 0);
      },
      error: () => {
        this.expectedScannerCode = '';
        this.scannerCodeUpdatedAt = 0;
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  onFacePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.form.faceCapture = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  async openCamera(preferFrontCamera: boolean = true): Promise<void> {
    this.cameraError = '';

    if (!this.isCameraSupported) {
      this.cameraError = 'Camera access is not supported on this browser/device.';
      return;
    }

    this.stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: preferFrontCamera ? { facingMode: { ideal: 'user' } } : true,
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.cameraStream = stream;
      this.isCameraOpen = true;

      setTimeout(() => {
        const videoEl = document.getElementById('visitorEntryCameraVideo') as HTMLVideoElement | null;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.play().catch(() => undefined);
        }
      });
    } catch {
      this.cameraError = 'Unable to access camera. You can still upload a photo manually.';
      this.isCameraOpen = false;
    }
  }

  capturePhotoFromCamera(): void {
    const videoEl = document.getElementById('visitorEntryCameraVideo') as HTMLVideoElement | null;
    if (!videoEl) {
      this.cameraError = 'Camera preview is not available.';
      return;
    }

    const width = videoEl.videoWidth || 720;
    const height = videoEl.videoHeight || 540;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.cameraError = 'Unable to capture photo from camera.';
      return;
    }

    ctx.drawImage(videoEl, 0, 0, width, height);
    this.form.faceCapture = canvas.toDataURL('image/jpeg', 0.9);
    this.stopCamera();
  }

  clearCapturedPhoto(): void {
    this.form.faceCapture = '';
  }

  stopCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
    this.isCameraOpen = false;
  }

  canShowPhoto(value: string): boolean {
    const raw = (value || '').trim().toLowerCase();
    return raw.startsWith('data:image/') || raw.startsWith('http://') || raw.startsWith('https://');
  }

  async submit(): Promise<void> {
    this.submitError = '';

    if (!this.form.societyName || !this.form.tower || !this.form.apartmentNumber || !this.form.visitorName) {
      this.submitError = 'Society, tower, apartment number and visitor name are required.';
      return;
    }

    if (!this.form.residentPhone && !this.form.ownerPhone) {
      this.submitError = 'Resident/owner phone is required to send approval request.';
      return;
    }

    const providedScannerCode = (this.scannerCode || '').trim();
    const expectedScannerCode = (this.expectedScannerCode || '').trim();
    if (providedScannerCode && expectedScannerCode && providedScannerCode.toUpperCase() !== expectedScannerCode.toUpperCase()) {
      this.submitError = 'Invalid or expired QR code for this society.';
      return;
    }

    this.form.faceCapture = await this.compressImageDataUrlIfNeeded(this.form.faceCapture);

    const payload = {
      societyName: this.form.societyName,
      tower: this.form.tower,
      apartmentNumber: `${this.form.tower}-${this.form.apartmentNumber}`,
      visitorType: this.form.visitorType,
      serviceSubCategory: this.form.serviceSubCategory,
      visitorName: this.form.visitorName,
      visitorPhone: this.form.visitorPhone,
      visitorAadhaar: this.form.visitorAadhaar,
      visitorIdProof: this.form.visitorIdProof,
      ownerName: this.form.ownerName,
      ownerPhone: this.form.ownerPhone,
      residentPhone: this.form.residentPhone || this.form.ownerPhone,
      faceCapture: this.form.faceCapture,
      scannerCode: this.scannerCode,
      scannerSource: 'QR_SCAN_SELF',
      requestedBy: 'QR_SELF_ENTRY',
      purpose: this.form.purpose
    };

    this.submitting = true;
    this.guestManagementService.createApprovalRequest(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.error?.error || 'Failed to submit approval request. Please contact security.';
      }
    });
  }

  private async compressImageDataUrlIfNeeded(dataUrl: string): Promise<string> {
    const raw = (dataUrl || '').trim();
    if (!raw.startsWith('data:image/')) {
      return dataUrl;
    }

    try {
      const image = await this.loadImageFromDataUrl(raw);
      const maxWidth = 960;
      const maxHeight = 960;
      const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const targetWidth = Math.max(1, Math.round(image.width * ratio));
      const targetHeight = Math.max(1, Math.round(image.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return dataUrl;
      }

      // Resize before submit to reduce payload while keeping enough face detail.
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch {
      return dataUrl;
    }
  }

  private loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to load image for compression'));
      image.src = dataUrl;
    });
  }
}
