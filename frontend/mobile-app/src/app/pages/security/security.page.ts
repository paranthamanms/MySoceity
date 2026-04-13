import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from '../../services/auth.service';
import { GuestManagementService } from '../../services/guest-management.service';
import { LanguageService } from '../../services/language.service';
import { ApprovalRequest, ApprovalLog, PreApproval, UserProfile } from '../../models/approval.model';

@Component({
  selector: 'app-security',
  templateUrl: './security.page.html',
  styleUrls: ['./security.page.scss'],
  standalone: false
})
export class SecurityPage implements OnInit {
  user: UserProfile | null = null;
  activeSegment: 'pending' | 'logs' | 'preapprovals' = 'pending';
  pendingRequests: ApprovalRequest[] = [];
  approvalLogs: ApprovalLog[] = [];
  preApprovals: PreApproval[] = [];
  selectedRequest: ApprovalRequest | null = null;
  showApprovalModal = false;
  popupTimer = 0;
  private popupInterval: any;
  showNewRequestForm = false;
  newRequest: Partial<ApprovalRequest> = {};
  deliveryServices = ['Swiggy', 'Zomato', 'Amazon', 'Flipkart', 'BigBasket', 'Blinkit', 'Other'];
  cabServices = ['Ola', 'Uber', 'Rapido', 'Other'];
  visitorTypes = ['GUEST', 'DELIVERY', 'CAB', 'VENDOR', 'VISITING_HELP'];
  showMenuPanel = false;
  currentSocietyScannerCode = '';
  scannerCodeUpdatedAt = 0;
  visitorEntryUrl = '';
  visitorEntryQrUrl = '';
  currentLanguage = 'EN';
  private languageSub?: Subscription;
  isNewRequestCameraSupported = false;
  isNewRequestCameraOpen = false;
  newRequestCameraError = '';
  private newRequestCameraStream: MediaStream | null = null;
  private isNativeRuntime = false;

  constructor(
    public auth: AuthService,
    private guestSvc: GuestManagementService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    public languageService: LanguageService
  ) {}

  ngOnInit() {
    this.user = this.auth.getCurrentUser();
    if (!this.auth.isSecurityGuard()) { this.router.navigate(['/community'], { replaceUrl: true }); return; }
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.isNativeRuntime = Capacitor.isNativePlatform();
    this.isNewRequestCameraSupported = this.isNativeRuntime || (typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
    this.languageSub = this.languageService.currentLanguage$.subscribe((lang) => {
      this.currentLanguage = lang;
    });
    this.loadSocietyScannerCode();
    this.loadPendingRequests();
    this.startPendingPolling();
  }

  ionViewWillEnter() { this.loadPendingRequests(); }

  private startPendingPolling() {
    clearInterval(this.popupInterval);
    this.popupInterval = setInterval(() => {
      this.loadPendingRequests();
    }, 20000);
  }

  ngOnDestroy() {
    this.stopNewRequestCamera();
    clearInterval(this.popupInterval);
    this.languageSub?.unsubscribe();
  }

  t(key: string, fallback: string): string {
    const translated = this.languageService.translate(key);
    if (translated && translated !== key) {
      return translated;
    }
    return this.mobileFallback(this.currentLanguage, key, fallback);
  }

  private mobileFallback(langCode: string, key: string, fallback: string): string {
    const lang = (langCode || 'EN').toUpperCase();
    const map: { [code: string]: { [k: string]: string } } = {
      HI: {
        'mobile.pending': 'लंबित',
        'mobile.logs': 'लॉग्स',
        'mobile.pre_approved': 'पूर्व-स्वीकृत',
        'mobile.menu': 'मेनू',
        'mobile.password_reset': 'पासवर्ड रीसेट',
        'mobile.ad_space': 'विज्ञापन स्थान',
        'mobile.society_qr_entry': 'सोसाइटी क्यूआर प्रवेश',
        'mobile.copy_link': 'लिंक कॉपी करें',
        'mobile.no_pending_requests': 'कोई लंबित अनुरोध नहीं',
        'mobile.no_logs_yet': 'अभी तक कोई लॉग नहीं',
        'mobile.no_pre_approvals': 'कोई सक्रिय पूर्व-स्वीकृति नहीं',
        'mobile.approve': 'अनुमोदित करें',
        'mobile.reject': 'अस्वीकार करें'
      },
      TA: {
        'mobile.pending': 'நிலுவை',
        'mobile.logs': 'பதிவுகள்',
        'mobile.pre_approved': 'முன்-அனுமதி',
        'mobile.menu': 'மெனு',
        'mobile.password_reset': 'கடவுச்சொல் மாற்றம்',
        'mobile.ad_space': 'விளம்பர இடம்',
        'mobile.society_qr_entry': 'சொசைட்டி QR நுழைவு',
        'mobile.copy_link': 'இணைப்பை நகலெடு',
        'mobile.no_pending_requests': 'நிலுவை கோரிக்கைகள் இல்லை',
        'mobile.no_logs_yet': 'இன்னும் பதிவுகள் இல்லை',
        'mobile.no_pre_approvals': 'செயலில் முன்-அனுமதிகள் இல்லை',
        'mobile.approve': 'அனுமதி',
        'mobile.reject': 'நிராகரி'
      }
    };
    return map[lang]?.[key] || fallback;
  }

  loadPendingRequests() {
    const society = this.user?.societyName || '';
    this.guestSvc.getAllPendingForSociety(society).subscribe({
      next: (r) => {
        this.pendingRequests = r;
        this.checkForIncomingRequests();
      },
      error: () => {}
    });
  }

  private checkForIncomingRequests() {
    const pending = this.pendingRequests.filter((r) => {
      const status = (r.status || '').toString().trim().toUpperCase();
      return !status || status === 'PENDING';
    });
    if (pending.length > 0 && !this.showApprovalModal) {
      this.openApprovalModal(pending[0]);
    }
  }

  loadSocietyScannerCode() {
    const society = this.user?.societyName || '';
    if (!society) return;
    this.guestSvc.getSocietyScannerCode(society).subscribe({
      next: (res) => {
        this.currentSocietyScannerCode = res?.scannerCode || '';
        this.scannerCodeUpdatedAt = Number(res?.updatedAt || 0);
        this.visitorEntryUrl = this.buildVisitorEntryUrl();
        this.visitorEntryQrUrl = this.buildVisitorEntryQrUrl();
      },
      error: () => {
        this.currentSocietyScannerCode = '';
        this.visitorEntryUrl = '';
        this.visitorEntryQrUrl = '';
      }
    });
  }

  private buildVisitorEntryUrl(): string {
    const society = (this.user?.societyName || '').trim();
    const scannerCode = (this.currentSocietyScannerCode || '').trim();
    if (!society || !scannerCode) return '';
    return `http://localhost:4203/visitor-entry?societyName=${encodeURIComponent(society)}&scannerCode=${encodeURIComponent(scannerCode)}`;
  }

  private buildVisitorEntryQrUrl(): string {
    if (!this.visitorEntryUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(this.visitorEntryUrl)}`;
  }

  copyVisitorEntryLink() {
    if (!this.visitorEntryUrl || !navigator.clipboard) return;
    navigator.clipboard.writeText(this.visitorEntryUrl);
    this.showToast('Visitor entry link copied.', 'success');
  }

  loadLogs() {
    const society = this.user?.societyName || '';
    this.guestSvc.getApprovalLogs(society).subscribe({ next: (l) => { this.approvalLogs = l; }, error: () => {} });
  }

  loadPreApprovals() {
    const society = this.user?.societyName || '';
    this.guestSvc.getActivePreApprovals(null, society).subscribe({ next: (p) => { this.preApprovals = p; }, error: () => {} });
  }

  onSegmentChange(ev: any) {
    this.activeSegment = ev.detail.value;
    if (this.activeSegment === 'pending') this.loadSocietyScannerCode();
    if (this.activeSegment === 'logs') this.loadLogs();
    if (this.activeSegment === 'preapprovals') this.loadPreApprovals();
  }

  openApprovalModal(req: ApprovalRequest) {
    this.selectedRequest = req;
    this.showApprovalModal = true;
    this.startPopupTimer();
  }

  closeApprovalModal() {
    this.showApprovalModal = false;
    this.selectedRequest = null;
    clearInterval(this.popupInterval);
    this.popupTimer = 0;
  }

  private stopNewRequestCameraTracks(): void {
    if (this.newRequestCameraStream) {
      this.newRequestCameraStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // no-op
        }
      });
    }
    this.newRequestCameraStream = null;
  }

  private getApprovalModalContext(): string {
    const type = (this.selectedRequest?.visitorType || 'GUEST').toLowerCase();
    return `Modal open for ${type} request`;
  }

  private getNewRequestCameraVideoElement(): HTMLVideoElement | null {
    if (typeof document === 'undefined') return null;
    return document.getElementById('newRequestCameraVideo') as HTMLVideoElement | null;
  }

  private isIosSimulatorRuntime(): boolean {
    if (!this.isNativeRuntime || Capacitor.getPlatform() !== 'ios') {
      return false;
    }
    const userAgent = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
    return /simulator/i.test(userAgent);
  }

  private isGrantedPermissionState(state?: string): boolean {
    const normalized = String(state || '').toLowerCase();
    return normalized === 'granted' || normalized === 'limited';
  }

  private async ensureNativePermission(target: 'camera' | 'photos'): Promise<boolean> {
    if (!this.isNativeRuntime) return false;

    const deniedMessage = target === 'camera'
      ? 'Camera permission denied. Go to Settings > Privacy > Camera and enable access.'
      : 'Photo library permission denied. Go to Settings > Privacy > Photos and enable access.';

    try {
      const current = await Camera.checkPermissions();
      const currentState = target === 'camera' ? (current as any)?.camera : (current as any)?.photos;
      if (this.isGrantedPermissionState(currentState)) {
        return true;
      }

      const requested = await Camera.requestPermissions({ permissions: [target] as any });
      const requestedState = target === 'camera' ? (requested as any)?.camera : (requested as any)?.photos;
      const granted = this.isGrantedPermissionState(requestedState);
      if (!granted) {
        this.newRequestCameraError = deniedMessage;
      }
      return granted;
    } catch {
      this.newRequestCameraError = deniedMessage;
      return false;
    }
  }

  private async capturePhotoWithNativeCamera(useFrontCamera = true): Promise<boolean> {
    if (!this.isNativeRuntime) return false;
    const hasCameraPermission = await this.ensureNativePermission('camera');
    if (!hasCameraPermission) {
      return false;
    }

    const attempts: Array<any> = [
      {
        quality: 90,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: useFrontCamera ? CameraDirection.Front : CameraDirection.Rear,
        saveToGallery: false,
        correctOrientation: true,
        promptLabelHeader: 'Select Photo Source',
        promptLabelCancel: 'Cancel'
      },
      {
        quality: 90,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true,
        promptLabelHeader: 'Select Photo Source',
        promptLabelCancel: 'Cancel'
      }
    ];

    let lastErrorMessage = '';
    for (const options of attempts) {
      try {
        const photo = await Camera.getPhoto(options);
        if (photo?.dataUrl) {
          this.newRequest.faceCapture = photo.dataUrl;
          this.newRequestCameraError = '';
          return true;
        }
      } catch (error: any) {
        lastErrorMessage = String(error?.message || error || '');
        const lower = lastErrorMessage.toLowerCase();
        if (lower.includes('cancelled') || lower.includes('cancel') || lower.includes('user cancelled')) {
          this.newRequestCameraError = '';
          return false;
        }
      }
    }

    const errMsg = lastErrorMessage.toLowerCase();
    if (errMsg.includes('permission') || errMsg.includes('denied') || errMsg.includes('no permission')) {
      this.newRequestCameraError = 'Camera permission denied. Go to Settings > Privacy > Camera and enable access.';
    } else if (errMsg.includes('simulator') || errMsg.includes('no camera') || errMsg.includes('unavailable')) {
      this.newRequestCameraError = 'Camera is unavailable on this device/simulator. Use Upload Photo.';
    } else {
      this.newRequestCameraError = 'Unable to open native camera. Please retry or use Upload Photo.';
    }
    return false;
  }

  private async pickPhotoFromNativeGallery(): Promise<boolean> {
    if (!this.isNativeRuntime) return false;
    try {
      const hasPhotosPermission = await this.ensureNativePermission('photos');
      if (!hasPhotosPermission) {
        return false;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true,
        promptLabelHeader: 'Select a Photo',
        promptLabelCancel: 'Cancel'
      });
      if (photo?.dataUrl) {
        this.newRequest.faceCapture = photo.dataUrl;
        this.newRequestCameraError = '';
        return true;
      }
    } catch (error: any) {
      const errMsg = String(error?.message || error || '');
      if (errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('denied') || errMsg.toLowerCase().includes('no permission')) {
        this.newRequestCameraError = 'Photo library permission denied. Go to Settings > Privacy > Photos and enable access.';
      } else if (errMsg.toLowerCase().includes('cancelled') || errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('user cancelled')) {
        this.newRequestCameraError = '';
      } else {
        this.newRequestCameraError = 'Unable to access photo library. Try uploading instead.';
      }
    }
    return false;
  }

  async openNewRequestCamera(useFrontCamera = true) {
    this.newRequestCameraError = '';
    if (this.isNativeRuntime) {
      if (this.isIosSimulatorRuntime()) {
        const pickedFromGallery = await this.pickPhotoFromNativeGallery();
        if (!pickedFromGallery && !this.newRequestCameraError) {
          this.newRequestCameraError = 'iOS Simulator has no physical camera. Select a photo from library.';
        }
        this.isNewRequestCameraOpen = false;
        return;
      }

      const capturedOnNative = await this.capturePhotoWithNativeCamera(useFrontCamera);
      if (capturedOnNative) {
        this.isNewRequestCameraOpen = false;
      }
      return;
    }

    if (!this.isNewRequestCameraSupported) {
      this.newRequestCameraError = 'Camera is not available. Please upload a photo instead.';
      return;
    }

    try {
      this.stopNewRequestCameraTracks();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: useFrontCamera ? 'user' : 'environment'
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.newRequestCameraStream = stream;
      this.isNewRequestCameraOpen = true;

      setTimeout(() => {
        const video = this.getNewRequestCameraVideoElement();
        if (video) {
          video.srcObject = stream;
          void video.play().catch(() => {
            this.newRequestCameraError = 'Unable to render camera preview. Please retry.';
          });
        }
      }, 0);
    } catch (error: any) {
      const errMsg = String(error?.message || error || '');
      if (errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('denied')) {
        this.newRequestCameraError = 'Camera permission denied. Please enable in Settings > Privacy > Camera and retry.';
      } else {
        this.newRequestCameraError = 'Unable to access camera. Try uploading a photo instead.';
      }
      this.isNewRequestCameraOpen = false;
      this.stopNewRequestCameraTracks();
    }
  }

  captureNewRequestPhoto() {
    const video = this.getNewRequestCameraVideoElement();
    if (!video) {
      this.newRequestCameraError = 'Camera preview is not available.';
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    if (!width || !height) {
      this.newRequestCameraError = 'Camera is not ready. Please retry.';
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.newRequestCameraError = 'Failed to capture photo frame.';
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    this.newRequest.faceCapture = canvas.toDataURL('image/jpeg', 0.9);
    this.stopNewRequestCamera();
  }

  stopNewRequestCamera() {
    this.isNewRequestCameraOpen = false;
    this.stopNewRequestCameraTracks();
    const video = this.getNewRequestCameraVideoElement();
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }

  clearNewRequestPhoto() {
    this.newRequest.faceCapture = '';
  }

  private startPopupTimer() {
    this.popupTimer = 120;
    clearInterval(this.popupInterval);
    this.popupInterval = setInterval(() => { this.popupTimer--; if (this.popupTimer <= 0) { clearInterval(this.popupInterval); this.closeApprovalModal(); } }, 1000);
  }

  async onApprove() {
    if (!this.selectedRequest?.id) return;
    const loader = await this.loadingCtrl.create({ message: 'Approving...' });
    await loader.present();
    const guardName = this.user?.fullName || this.user?.username || 'Security';
    this.guestSvc.approveRequest(this.selectedRequest.id, guardName).subscribe({
      next: async () => { await loader.dismiss(); this.closeApprovalModal(); this.showToast('Visitor approved.', 'success'); this.loadPendingRequests(); },
      error: async () => { await loader.dismiss(); this.showToast('Failed to approve.', 'danger'); }
    });
  }

  async onReject() {
    if (!this.selectedRequest?.id) return;
    const alert = await this.alertCtrl.create({
      header: 'Reject Entry',
      message: 'Reason for rejection (optional):',
      inputs: [{ name: 'note', type: 'text', placeholder: 'Reason...' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Reject', cssClass: 'reject-btn', handler: async (data) => {
          const loader = await this.loadingCtrl.create({ message: 'Rejecting...' });
          await loader.present();
          const guardName = this.user?.fullName || this.user?.username || 'Security';
          this.guestSvc.rejectRequest(this.selectedRequest!.id!, guardName, data.note).subscribe({
            next: async () => { await loader.dismiss(); this.closeApprovalModal(); this.showToast('Entry rejected.', 'warning'); this.loadPendingRequests(); },
            error: async () => { await loader.dismiss(); this.showToast('Failed to reject.', 'danger'); }
          });
        }}
      ]
    });
    await alert.present();
  }

  openNewRequestForm() {
    this.stopNewRequestCamera();
    this.newRequest = {
      societyName: this.user?.societyName || '',
      requestedBy: this.user?.fullName || this.user?.username || 'Security',
      visitorType: 'GUEST',
      tower: (this.user?.tower || '').toString().trim(),
      apartmentNumber: '',
      serviceSubCategory: '',
      visitorAadhaar: '',
      visitorIdProof: '',
      residentPhone: '',
      ownerName: '',
      ownerPhone: '',
      purpose: '',
      scannerCode: this.currentSocietyScannerCode,
      scannerSource: 'MANUAL_SECURITY'
    };
    this.showNewRequestForm = true;
  }

  onNewRequestPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.newRequest.faceCapture = String(reader.result || '');
      this.newRequestCameraError = '';
    };
    reader.onerror = () => {
      this.newRequestCameraError = 'Failed to read selected photo. Please try another file.';
    };
    reader.readAsDataURL(file);
  }

  triggerNewRequestPhotoCapture() {
    this.newRequestCameraError = '';
    if (this.isNativeRuntime) {
      void this.pickPhotoFromNativeGallery().then((picked) => {
        if (!picked && !this.newRequestCameraError) {
          this.newRequestCameraError = 'Unable to open photo library. Permission may be required in Settings.';
        }
      });
      return;
    }

    if (typeof document === 'undefined') return;
    const input = document.getElementById('newRequestPhotoInput') as HTMLInputElement | null;
    if (input) {
      input.click();
    }
  }

  canShowFaceCaptureImage(faceCapture?: string): boolean {
    const raw = (faceCapture || '').trim().toLowerCase();
    return raw.startsWith('data:image/') || raw.startsWith('http://') || raw.startsWith('https://');
  }

  async submitNewRequest() {
    const tower = (this.newRequest.tower || '').trim();
    const flat = (this.newRequest.apartmentNumber || '').trim();
    if (!this.newRequest.visitorName || !tower || !flat) {
      this.showToast('Visitor name, tower and apartment are required.', 'warning');
      return;
    }
    if (!this.newRequest.residentPhone && !this.newRequest.ownerPhone) {
      this.showToast('Resident/Owner phone is required.', 'warning');
      return;
    }
    if (!this.newRequest.faceCapture) {
      this.showToast('Visitor photo is required. Please capture or upload a photo.', 'warning');
      return;
    }

    const payload: ApprovalRequest = {
      ...(this.newRequest as ApprovalRequest),
      visitorType: (this.newRequest.visitorType || 'GUEST').toString().toUpperCase(),
      tower,
      apartmentNumber: `${tower}-${flat}`,
      societyName: this.newRequest.societyName || this.user?.societyName || '',
      residentPhone: this.newRequest.residentPhone || this.newRequest.ownerPhone || '',
      serviceSubCategory: (this.newRequest.serviceSubCategory || '').toString().trim(),
      visitorAadhaar: (this.newRequest.visitorAadhaar || '').toString().trim(),
      visitorIdProof: (this.newRequest.visitorIdProof || '').toString().trim(),
      status: 'PENDING'
    };

    if (payload.visitorType === 'CAB' && this.newRequest.cabService)
      payload.purpose = ('[Service: ' + this.newRequest.cabService + '] ' + (this.newRequest.purpose || '')).trim();
    else if (payload.visitorType === 'DELIVERY' && this.newRequest.deliveryService)
      payload.purpose = ('[Service: ' + this.newRequest.deliveryService + '] ' + (this.newRequest.purpose || '')).trim();

    if (!payload.serviceSubCategory) {
      if (payload.visitorType === 'CAB') {
        payload.serviceSubCategory = (this.newRequest.cabService === 'Other'
          ? this.newRequest.cabServiceOther
          : this.newRequest.cabService) || '';
      }
      if (payload.visitorType === 'DELIVERY') {
        payload.serviceSubCategory = (this.newRequest.deliveryService === 'Other'
          ? this.newRequest.deliveryServiceOther
          : this.newRequest.deliveryService) || '';
      }
    }

    const loader = await this.loadingCtrl.create({ message: 'Submitting...' });
    await loader.present();
    this.guestSvc.createApprovalRequest(payload).subscribe({
      next: async () => {
        await loader.dismiss();
        this.stopNewRequestCamera();
        this.showNewRequestForm = false;
        this.showToast('Request created.', 'success');
        this.loadPendingRequests();
      },
      error: async () => { await loader.dismiss(); this.showToast('Failed to submit.', 'danger'); }
    });
  }

  getServiceDisplayName(req: ApprovalRequest | null): string {
    if (!req) return 'Visitor';
    const type = (req.visitorType || '').toUpperCase();
    if (type === 'DELIVERY') { const s = req.deliveryService === 'Other' ? req.deliveryServiceOther : req.deliveryService; const r = (s?.trim()) ? s.trim() : this.inferService(req.purpose || req.visitorName || ''); return r ? ('Delivery - ' + r) : 'Delivery'; }
    if (type === 'CAB') { const s = req.cabService === 'Other' ? req.cabServiceOther : req.cabService; const r = (s?.trim()) ? s.trim() : this.inferService(req.purpose || req.visitorName || ''); return r ? ('Cab - ' + r) : 'Cab'; }
    if (type === 'VENDOR') return 'Vendor';
    if (type === 'VISITING_HELP') return 'Visiting Help';
    return 'Guest';
  }

  private inferService(text: string): string {
    const tag = /\[service:\s*([^\]]+)\]/i.exec(text);
    if (tag) return tag[1].trim();
    const kw: Record<string, string> = { uber: 'Uber', ola: 'Ola', rapido: 'Rapido', swiggy: 'Swiggy', zomato: 'Zomato', amazon: 'Amazon', flipkart: 'Flipkart', bigbasket: 'BigBasket', blinkit: 'Blinkit' };
    const lower = text.toLowerCase();
    const found = Object.keys(kw).find(k => lower.includes(k));
    return found ? kw[found] : '';
  }

  getTypeColor(type: string | undefined): string {
    const t = (type || '').toUpperCase();
    if (t === 'DELIVERY') return 'primary'; if (t === 'CAB') return 'secondary';
    if (t === 'VENDOR') return 'success'; if (t === 'VISITING_HELP') return 'warning';
    return 'medium';
  }

  getTypeIcon(type: string | undefined): string {
    const t = (type || '').toUpperCase();
    if (t === 'DELIVERY') return 'cube-outline'; if (t === 'CAB') return 'car-outline';
    if (t === 'VENDOR') return 'briefcase-outline'; if (t === 'VISITING_HELP') return 'people-outline';
    return 'person-outline';
  }

  formatTime(d: string | undefined): string {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN') + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  getSocietyName(): string {
    return this.user?.societyName || 'NammaSociety';
  }

  getTowerFlatLine(): string {
    const tower = (this.user?.tower || (this.user as any)?.towerNumber || (this.user as any)?.tower_number || '').toString().trim() || '-';
    const flat = (this.user?.apartmentNumber || (this.user as any)?.flatNumber || (this.user as any)?.flat_number || '').toString().trim() || '-';
    return 'Tower ' + tower + ' | Flat ' + flat;
  }

  getBreadcrumbTrail(): string {
    return this.getSocietyName() + ' / ' + this.auth.getDashboardTitle() + ' / ' + this.auth.getCurrentRoleLabel();
  }

  toggleMenuPanel() {
    this.showMenuPanel = !this.showMenuPanel;
  }

  viewProfile() {
    this.showMenuPanel = false;
    this.showToast('Profile: ' + (this.user?.username || 'User'), 'primary');
  }

  async resetPassword() {
    const alert = await this.alertCtrl.create({
      header: 'Reset Password',
      message: 'Enter and confirm your new password',
      inputs: [
        { name: 'newPassword', type: 'password', placeholder: 'New password' },
        { name: 'confirmPassword', type: 'password', placeholder: 'Confirm password' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Update',
          handler: async (data) => {
            const newPassword = (data?.newPassword || '').trim();
            const confirmPassword = (data?.confirmPassword || '').trim();

            if (!newPassword || newPassword.length < 6) {
              this.showToast('Password must be at least 6 characters.', 'warning');
              return false;
            }
            if (newPassword !== confirmPassword) {
              this.showToast('Passwords do not match.', 'warning');
              return false;
            }

            const username = this.user?.username || '';
            if (!username) {
              this.showToast('Unable to identify current user.', 'danger');
              return false;
            }

            const loader = await this.loadingCtrl.create({ message: 'Updating password...' });
            await loader.present();

            this.auth.changePassword(username, newPassword).subscribe({
              next: async () => {
                await loader.dismiss();
                this.showMenuPanel = false;
                this.showToast('Password updated successfully.', 'success');
              },
              error: async () => {
                await loader.dismiss();
                this.showToast('Password update failed.', 'danger');
              }
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout', message: 'Are you sure?',
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Logout', handler: () => { this.auth.logout(); this.router.navigate(['/login'], { replaceUrl: true }); } }]
    });
    await alert.present();
  }

  private async showToast(msg: string, color = 'primary') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2500, color, position: 'bottom' });
    await t.present();
  }
}
