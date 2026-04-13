import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { GuestManagementService } from '../../services/guest-management.service';
import { LanguageService } from '../../services/language.service';
import { ApprovalRequest, ApprovalLog, PreApproval, UserProfile, CommunityPost } from '../../models/approval.model';

@Component({
  selector: 'app-community',
  templateUrl: './community.page.html',
  styleUrls: ['./community.page.scss'],
  standalone: false
})
export class CommunityPage implements OnInit, OnDestroy {
  user: UserProfile | null = null;
  activeSegment: 'overview' | 'requests' | 'logs' | 'preapprovals' | 'posts' = 'overview';

  pendingRequests: ApprovalRequest[] = [];
  approvalLogs: ApprovalLog[] = [];
  preApprovals: PreApproval[] = [];
  posts: CommunityPost[] = [];
  announcements: CommunityPost[] = [];
  selectedPostType: 'community' | 'announcements' = 'community';

  showApprovalPopup = false;
  currentApproval: ApprovalRequest | null = null;
  popupRequestQueue: ApprovalRequest[] = [];
  popupFaceCapturePreview = '';
  private seenPopupRequestKeys: Set<string> = new Set();
  popupTimer = 0;
  private popupInterval: any;
  private pollInterval: any;

  showPreApprovalForm = false;
  newPreApproval: Partial<PreApproval> = {};
  currentSocietyScannerCode = '';
  scannerCodeUpdatedAt = 0;
  scannerEntryPayload = '';
  manualApprovalRequest: Partial<ApprovalRequest> = {
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
    purpose: '',
    scannerSource: 'MANUAL'
  };
  scannerEntry: Partial<ApprovalRequest> = {
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
    scannerCode: '',
    scannerSource: 'MANUAL',
    purpose: ''
  };
  visitorTypes = ['Guest', 'Delivery', 'Cab', 'Vendor', 'Visiting Help'];
  deliveryServices = ['Swiggy', 'Zomato', 'Amazon', 'Flipkart', 'BigBasket', 'Blinkit', 'Other'];
  cabServices = ['Ola', 'Uber', 'Rapido', 'Other'];

  isAdmin = false;

  quickActions: Array<{ key: string; label: string; icon: string; color: string; badge?: number }> = [];
  showMenuPanel = false;
  currentLanguage = 'EN';
  private languageSub?: Subscription;

  // Hierarchical menu properties
  expandedMenuItems: Set<string> = new Set();
  amenitiesList = [
    { name: 'Cricket Ground', icon: 'football-outline' },
    { name: 'Football Ground', icon: 'football-outline' },
    { name: 'Badminton Court', icon: 'checkmark-done-outline' },
    { name: 'Basketball Court', icon: 'checkmark-done-outline' },
    { name: 'Gym', icon: 'fitness-outline' },
    { name: 'Pickle Ball Court', icon: 'checkmark-done-outline' },
    { name: 'Tennis Court', icon: 'checkmark-done-outline' }
  ];
  postCategories = [
    { key: 'community', label: 'Community Posts', icon: 'chatbubbles-outline' },
    { key: 'announcements', label: 'Announcements', icon: 'megaphone-outline' },
    { key: 'preapprovals', label: 'Pre-Approvals', icon: 'shield-checkmark-outline' }
  ];

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
    this.isAdmin = this.auth.isAdminUser() || this.auth.isSocietyAdmin();
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.languageSub = this.languageService.currentLanguage$.subscribe((lang) => {
      this.currentLanguage = lang;
      this.refreshTranslatedLabels();
    });
    this.initializeScannerEntry();
    this.initializeManualApprovalRequest();
    this.loadSocietyScannerCode();
    this.refreshTranslatedLabels();
    this.loadData();
    this.startPendingPolling();
  }

  ionViewWillEnter() {
    this.user = this.auth.getCurrentUser();
    this.isAdmin = this.auth.isAdminUser() || this.auth.isSocietyAdmin();
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.initializeScannerEntry();
    this.initializeManualApprovalRequest();
    this.loadSocietyScannerCode();
    this.refreshTranslatedLabels();
    this.loadData();
    this.startPendingPolling();
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
    clearInterval(this.popupInterval);
    this.languageSub?.unsubscribe();
  }

  private startPendingPolling() {
    clearInterval(this.pollInterval);
    // Keep popup discovery responsive on mobile without aggressive refresh.
    this.pollInterval = setInterval(() => {
      this.loadPending();
    }, 20000);
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
        'mobile.home': 'होम',
        'mobile.requests': 'अनुरोध',
        'mobile.logs': 'लॉग्स',
        'mobile.pre_approved': 'पूर्व-स्वीकृत',
        'mobile.pre_approvals': 'पूर्व-स्वीकृत',
        'mobile.posts': 'पोस्ट्स',
        'mobile.menu': 'मेनू',
        'mobile.password_reset': 'पासवर्ड रीसेट',
        'mobile.ad_space': 'विज्ञापन स्थान',
        'mobile.awaiting_approval': 'आपकी स्वीकृति की प्रतीक्षा',
        'mobile.tap_to_act': 'कार्य के लिए टैप करें',
        'mobile.recent_visitors': 'हाल के आगंतुक',
        'mobile.latest_posts': 'नवीनतम पोस्ट्स',
        'mobile.announcements': 'घोषणाएं'
      },
      TA: {
        'mobile.home': 'முகப்பு',
        'mobile.requests': 'கோரிக்கைகள்',
        'mobile.logs': 'பதிவுகள்',
        'mobile.pre_approved': 'முன்-அனுமதி',
        'mobile.pre_approvals': 'முன்-அனுமதிகள்',
        'mobile.posts': 'பதிவுகள்',
        'mobile.menu': 'மெனு',
        'mobile.password_reset': 'கடவுச்சொல் மாற்றம்',
        'mobile.ad_space': 'விளம்பர இடம்',
        'mobile.awaiting_approval': 'உங்கள் அனுமதிக்காக காத்திருக்கிறது',
        'mobile.tap_to_act': 'செயல்பட தட்டவும்',
        'mobile.recent_visitors': 'சமீபத்திய வருகையாளர்கள்',
        'mobile.latest_posts': 'சமீபத்திய பதிவுகள்',
        'mobile.announcements': 'அறிவிப்புகள்'
      }
    };
    return map[lang]?.[key] || fallback;
  }

  private refreshTranslatedLabels(): void {
    this.postCategories = [
      { key: 'community', label: this.t('mobile.community_posts', 'Community Posts'), icon: 'chatbubbles-outline' },
      { key: 'announcements', label: this.t('mobile.announcements', 'Announcements'), icon: 'megaphone-outline' },
      { key: 'preapprovals', label: this.t('mobile.pre_approvals', 'Pre-Approvals'), icon: 'shield-checkmark-outline' }
    ];
    this.quickActions = this.buildQuickActions();
  }



  loadData() {
    this.loadPending();
    this.loadLogs();
    this.loadPreApprovals();
    this.loadPosts();
    this.quickActions = this.buildQuickActions();
  }

  private initializeScannerEntry() {
    this.scannerEntry.societyName = this.user?.societyName || '';
    this.scannerEntry.scannerCode = this.currentSocietyScannerCode || '';
  }

  private initializeManualApprovalRequest() {
    const apartmentRaw = (this.user?.apartmentNumber || '').trim();
    this.manualApprovalRequest.societyName = this.user?.societyName || '';
    this.manualApprovalRequest.tower = this.getUserTower();
    this.manualApprovalRequest.apartmentNumber = this.extractFlatNumber(apartmentRaw);
    this.manualApprovalRequest.visitorType = this.manualApprovalRequest.visitorType || 'GUEST';
    this.manualApprovalRequest.scannerSource = 'MANUAL';
  }

  private getUserTower(): string {
    return ((this.user?.tower || (this.user as any)?.towerNumber || (this.user as any)?.tower_number || '') as string).trim();
  }

  private extractFlatNumber(apartmentNumber: string): string {
    const raw = (apartmentNumber || '').trim();
    if (!raw) return '';
    const parts = raw.split(/[-\s/]+/).filter((part) => !!part);
    return parts.length > 1 ? parts[parts.length - 1] : raw;
  }

  loadSocietyScannerCode() {
    const societyName = this.user?.societyName || '';
    if (!societyName) return;

    this.guestSvc.getSocietyScannerCode(societyName).subscribe({
      next: (res) => {
        this.currentSocietyScannerCode = res?.scannerCode || '';
        this.scannerCodeUpdatedAt = Number(res?.updatedAt || 0);
        if (!this.scannerEntry.scannerCode) {
          this.scannerEntry.scannerCode = this.currentSocietyScannerCode;
        }
      },
      error: () => {
        this.currentSocietyScannerCode = '';
      }
    });
  }

  generateSocietyScannerCode() {
    const societyName = this.user?.societyName || '';
    const generatedBy = this.user?.username || 'society-admin';
    if (!societyName) return;

    this.guestSvc.generateSocietyScannerCode(societyName, generatedBy).subscribe({
      next: (res) => {
        this.currentSocietyScannerCode = res?.scannerCode || '';
        this.scannerCodeUpdatedAt = Number(res?.updatedAt || 0);
        this.scannerEntry.scannerCode = this.currentSocietyScannerCode;
        this.showToast('Scanner code generated for ' + societyName, 'success');
      },
      error: () => this.showToast('Failed to generate scanner code', 'danger')
    });
  }

  applyScannerPayload() {
    const raw = (this.scannerEntryPayload || '').trim();
    if (!raw) {
      this.showToast('Scanner payload is empty', 'warning');
      return;
    }

    try {
      const payload = JSON.parse(raw);
      this.scannerEntry.scannerCode = payload.scannerCode || this.scannerEntry.scannerCode || '';
      this.scannerEntry.visitorType = payload.visitorType || this.scannerEntry.visitorType || 'GUEST';
      this.scannerEntry.serviceSubCategory = payload.serviceSubCategory || this.scannerEntry.serviceSubCategory || '';
      this.scannerEntry.visitorName = payload.visitorName || this.scannerEntry.visitorName || '';
      this.scannerEntry.visitorAadhaar = payload.visitorAadhaar || this.scannerEntry.visitorAadhaar || '';
      this.scannerEntry.visitorPhone = payload.visitorPhone || this.scannerEntry.visitorPhone || '';
      this.scannerEntry.tower = payload.tower || this.scannerEntry.tower || '';
      this.scannerEntry.apartmentNumber = payload.flatNumber || payload.apartmentNumber || this.scannerEntry.apartmentNumber || '';
      this.scannerEntry.ownerName = payload.ownerName || this.scannerEntry.ownerName || '';
      this.scannerEntry.ownerPhone = payload.ownerPhone || this.scannerEntry.ownerPhone || '';
      this.scannerEntry.faceCapture = payload.faceCapture || this.scannerEntry.faceCapture || '';
      this.scannerEntry.scannerSource = 'QR_SCAN';
      this.showToast('Scanned payload applied', 'success');
    } catch {
      this.showToast('Invalid scanner payload JSON', 'danger');
    }
  }

  async submitScannerEntryRequest() {
    if (!this.user) return;
    if (!(this.auth.getRoleCategory() === 'security' || this.auth.getRoleCategory() === 'society-admin')) {
      this.showToast('Only Security/Society Admin can create gate requests', 'warning');
      return;
    }

    const tower = (this.scannerEntry.tower || '').trim();
    const flat = (this.scannerEntry.apartmentNumber || '').trim();
    if (!tower || !flat || !this.scannerEntry.visitorName) {
      this.showToast('Tower, Flat and Visitor Name are required', 'warning');
      return;
    }

    if (this.currentSocietyScannerCode && this.scannerEntry.scannerSource === 'QR_SCAN') {
      if (this.scannerEntry.scannerCode !== this.currentSocietyScannerCode) {
        this.showToast('Scanner code mismatch for society', 'danger');
        return;
      }
    }

    const residentPhone = (this.scannerEntry.residentPhone || this.scannerEntry.ownerPhone || '').trim();
    if (!residentPhone) {
      this.showToast('Resident/Owner phone is required', 'warning');
      return;
    }

    const payload: ApprovalRequest = {
      societyName: this.scannerEntry.societyName || this.user.societyName,
      tower,
      apartmentNumber: `${tower}-${flat}`,
      visitorType: this.scannerEntry.visitorType || 'GUEST',
      serviceSubCategory: this.scannerEntry.serviceSubCategory || '',
      visitorName: this.scannerEntry.visitorName || '',
      visitorPhone: this.scannerEntry.visitorPhone || '',
      visitorAadhaar: this.scannerEntry.visitorAadhaar || '',
      visitorIdProof: this.scannerEntry.visitorIdProof || '',
      ownerName: this.scannerEntry.ownerName || '',
      ownerPhone: this.scannerEntry.ownerPhone || '',
      residentPhone,
      faceCapture: this.scannerEntry.faceCapture || '',
      scannerCode: this.scannerEntry.scannerCode || '',
      scannerSource: this.scannerEntry.scannerSource || 'MANUAL',
      requestedBy: this.user.username || 'security',
      purpose: this.scannerEntry.purpose || ''
    };

    const loader = await this.loadingCtrl.create({ message: 'Creating approval request...' });
    await loader.present();

    this.guestSvc.createApprovalRequest(payload).subscribe({
      next: async () => {
        await loader.dismiss();
        this.showToast('Approval request created from scanner entry', 'success');
        this.scannerEntryPayload = '';
        this.initializeScannerEntry();
        this.loadPending();
        this.loadLogs();
      },
      error: async () => {
        await loader.dismiss();
        this.showToast('Failed to create scanner entry request', 'danger');
      }
    });
  }

  async submitManualApprovalRequest() {
    if (!this.user) return;
    if (!(this.auth.getRoleCategory() === 'security' || this.auth.getRoleCategory() === 'society-admin')) {
      this.showToast('Only Security/Society Admin can create gate requests', 'warning');
      return;
    }

    const societyName = (this.manualApprovalRequest.societyName || this.user.societyName || '').trim();
    const tower = (this.manualApprovalRequest.tower || '').trim();
    const flat = (this.manualApprovalRequest.apartmentNumber || '').trim();
    if (!societyName || !tower || !flat) {
      this.showToast('Society, tower and flat are required', 'warning');
      return;
    }

    const visitorName = (this.manualApprovalRequest.visitorName || '').trim();
    if (!visitorName) {
      this.showToast('Visitor name is required', 'warning');
      return;
    }

    const residentPhone = (this.manualApprovalRequest.residentPhone || this.manualApprovalRequest.ownerPhone || '').trim();
    if (!residentPhone) {
      this.showToast('Resident/Owner phone is required', 'warning');
      return;
    }

    const payload: ApprovalRequest = {
      societyName,
      tower,
      apartmentNumber: `${tower}-${flat}`,
      visitorType: (this.manualApprovalRequest.visitorType || 'GUEST').toString().toUpperCase(),
      serviceSubCategory: (this.manualApprovalRequest.serviceSubCategory || '').trim(),
      visitorName,
      visitorPhone: (this.manualApprovalRequest.visitorPhone || '').trim(),
      visitorAadhaar: (this.manualApprovalRequest.visitorAadhaar || '').trim(),
      visitorIdProof: (this.manualApprovalRequest.visitorIdProof || '').trim(),
      ownerName: (this.manualApprovalRequest.ownerName || '').trim(),
      ownerPhone: (this.manualApprovalRequest.ownerPhone || '').trim(),
      residentPhone,
      purpose: (this.manualApprovalRequest.purpose || '').trim(),
      scannerSource: 'MANUAL',
      requestedBy: this.user.username || 'security'
    };

    const serviceName = this.getSelectedServiceName(this.manualApprovalRequest);
    if (serviceName && !payload.serviceSubCategory) {
      payload.serviceSubCategory = serviceName;
    }

    if (payload.visitorType === 'DELIVERY') {
      payload.deliveryService = this.manualApprovalRequest.deliveryService || '';
      payload.deliveryServiceOther = this.manualApprovalRequest.deliveryServiceOther || '';
    }

    if (payload.visitorType === 'CAB') {
      payload.cabService = this.manualApprovalRequest.cabService || '';
      payload.cabServiceOther = this.manualApprovalRequest.cabServiceOther || '';
    }

    const loader = await this.loadingCtrl.create({ message: 'Creating approval request...' });
    await loader.present();

    this.guestSvc.createApprovalRequest(payload).subscribe({
      next: async () => {
        await loader.dismiss();
        this.showToast('Approval request created successfully', 'success');
        this.manualApprovalRequest = {
          societyName: this.user?.societyName || '',
          tower: this.getUserTower(),
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
          purpose: '',
          scannerSource: 'MANUAL'
        };
        this.loadPending();
        this.loadLogs();
      },
      error: async () => {
        await loader.dismiss();
        this.showToast('Failed to create approval request', 'danger');
      }
    });
  }

  private getSelectedServiceName(request: Partial<ApprovalRequest>): string {
    const type = (request.visitorType || '').toUpperCase();
    if (type === 'DELIVERY') {
      const selected = request.deliveryService === 'Other' ? request.deliveryServiceOther : request.deliveryService;
      return (selected || '').trim();
    }
    if (type === 'CAB') {
      const selected = request.cabService === 'Other' ? request.cabServiceOther : request.cabService;
      return (selected || '').trim();
    }
    return '';
  }

  loadPending() {
    const soc = this.user?.societyName || '';
    const roleCategory = this.auth.getRoleCategory();
    const canSeeAllSocietyRequests = roleCategory === 'security' || this.isAdmin;
    if (!soc) {
      this.pendingRequests = [];
      this.quickActions = this.buildQuickActions();
      return;
    }

    if (canSeeAllSocietyRequests) {
      this.guestSvc.getAllPendingForSociety(soc).subscribe({
        next: (r) => {
          this.pendingRequests = r || [];
          this.quickActions = this.buildQuickActions();
        },
        error: () => {}
      });
      return;
    }

    const apartmentCandidates = this.getResidentApartmentCandidates();
    if (apartmentCandidates.length === 0) {
      this.pendingRequests = [];
      this.quickActions = this.buildQuickActions();
      return;
    }

    const requests = apartmentCandidates.map((apartmentNumber) =>
      this.guestSvc.getPendingRequests(apartmentNumber, soc).pipe(catchError(() => of([] as ApprovalRequest[])))
    );

    forkJoin(requests).subscribe({
      next: (resultSets) => {
        const merged = resultSets.reduce((all, current) => all.concat(current || []), [] as ApprovalRequest[]);
        const deduped = this.dedupeApprovalRequests(merged);
        this.pendingRequests = deduped;
        this.quickActions = this.buildQuickActions();
      },
      error: () => {}
    });
  }

  private getResidentApartmentCandidates(): string[] {
    const values = new Set<string>();
    const apartment = (this.user?.apartmentNumber || '').trim();
    const tower = this.getUserTower();
    const flat = this.extractFlatNumber(apartment);

    if (apartment) {
      values.add(apartment);
    }
    if (flat) {
      values.add(flat);
    }
    if (tower && flat) {
      values.add(`${tower}-${flat}`);
      values.add(`${tower}${flat}`);
    }

    return Array.from(values);
  }

  private dedupeApprovalRequests(requests: ApprovalRequest[]): ApprovalRequest[] {
    const seen = new Set<string>();
    const deduped: ApprovalRequest[] = [];
    for (const req of requests || []) {
      const key = this.getApprovalRequestKey(req);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      deduped.push(req);
    }
    return deduped;
  }

  private isResidentRequest(req: ApprovalRequest, apartmentNumber: string): boolean {
    const userKeys = this.getResidentApartmentKeys(apartmentNumber);
    const requestKeys = this.getRequestApartmentKeys(req);
    if (userKeys.length === 0 || requestKeys.length === 0) return false;
    if (requestKeys.some((key) => userKeys.includes(key))) {
      return true;
    }

    const userTower = this.normalizeApartmentToken(this.getUserTower());
    const userFlat = this.normalizeApartmentToken(this.extractFlatNumber(apartmentNumber));
    const reqTower = this.normalizeApartmentToken(req.tower || '');
    const reqFlat = this.normalizeApartmentToken(this.extractFlatNumber(req.apartmentNumber || ''));

    if (userFlat && reqFlat && userFlat === reqFlat) {
      if (!userTower || !reqTower || userTower === reqTower) {
        return true;
      }
    }

    return false;
  }

  private getResidentApartmentKeys(apartmentNumber: string): string[] {
    const keys = new Set<string>();
    const apt = this.normalizeApartmentToken(apartmentNumber);
    const tower = this.normalizeApartmentToken(this.getUserTower());
    const flat = this.normalizeApartmentToken(this.extractFlatNumber(apartmentNumber));

    if (apt) keys.add(apt);
    if (flat) keys.add(flat);
    if (tower && flat) {
      keys.add(`${tower}${flat}`);
      keys.add(`${tower}-${flat}`);
    }
    return Array.from(keys);
  }

  private getRequestApartmentKeys(req: ApprovalRequest): string[] {
    const keys = new Set<string>();
    const reqApt = this.normalizeApartmentToken(req.apartmentNumber || '');
    const reqTower = this.normalizeApartmentToken(req.tower || '');
    const reqFlat = this.normalizeApartmentToken(this.extractFlatNumber(req.apartmentNumber || ''));

    if (reqApt) keys.add(reqApt);
    if (reqFlat) keys.add(reqFlat);
    if (reqTower && reqFlat) {
      keys.add(`${reqTower}${reqFlat}`);
      keys.add(`${reqTower}-${reqFlat}`);
    }
    return Array.from(keys);
  }

  private normalizeApartmentToken(value: string): string {
    return (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  loadLogs() {
    const apt = this.user?.apartmentNumber || undefined;
    const soc = this.user?.societyName || '';
    this.guestSvc.getApprovalLogs(soc, apt).subscribe({ next: (l) => { this.approvalLogs = l; }, error: () => {} });
  }

  loadPreApprovals() {
    const apt = this.user?.apartmentNumber ?? null;
    const soc = this.user?.societyName || '';
    this.guestSvc.getPreApprovals(apt, soc).subscribe({ next: (p) => { this.preApprovals = p; }, error: () => {} });
  }

  loadPosts() {
    const soc = this.user?.societyName || '';
    if (!soc) {
      this.posts = [];
      this.announcements = [];
      return;
    }

    this.guestSvc.getCommunityPosts(soc).subscribe({ next: (items) => { this.posts = items || []; }, error: () => { this.posts = []; } });
    this.guestSvc.getAnnouncements(soc).subscribe({ next: (items) => { this.announcements = items || []; }, error: () => { this.announcements = []; } });
  }

  private checkForIncomingRequests() {
    const pending = this.pendingRequests.filter((r) => {
      const status = (r.status || '').toString().trim().toUpperCase();
      return !status || status === 'PENDING';
    });
    const newRequests = pending.filter((req) => {
      const key = this.getApprovalRequestKey(req);
      if (!key || this.seenPopupRequestKeys.has(key)) {
        return false;
      }
      this.seenPopupRequestKeys.add(key);
      return true;
    });

    if (newRequests.length > 0) {
      this.popupRequestQueue.push(...newRequests);
      if (!this.showApprovalPopup) {
        this.showNextApprovalPopup();
      }
    }
  }

  private getApprovalRequestKey(req: ApprovalRequest | null): string {
    if (!req) return '';
    if (req.id) return `id:${req.id}`;
    const apt = (req.apartmentNumber || '').trim().toUpperCase();
    const visitor = (req.visitorName || '').trim().toUpperCase();
    const phone = (req.visitorPhone || '').trim();
    const when = (req.requestedAt || req.createdDate || '').trim();
    return `${apt}|${visitor}|${phone}|${when}`;
  }

  private showNextApprovalPopup() {
    if (this.popupRequestQueue.length === 0) {
      this.showApprovalPopup = false;
      this.currentApproval = null;
      this.popupFaceCapturePreview = '';
      return;
    }
    this.openApprovalPopup(this.popupRequestQueue[0]);
  }

  private setPopupFacePreview(req: ApprovalRequest | null) {
    const raw = (req?.faceCapture || '').trim();
    if (!raw) {
      this.popupFaceCapturePreview = '';
      return;
    }
    if (raw.startsWith('data:image/') || raw.startsWith('http://') || raw.startsWith('https://')) {
      this.popupFaceCapturePreview = raw;
      return;
    }
    this.popupFaceCapturePreview = '';
  }

  loadSummary() {
    this.loadData();
  }

  openApprovalPopup(req: ApprovalRequest) {
    this.currentApproval = req;
    this.setPopupFacePreview(req);
    this.showApprovalPopup = true;
    this.popupTimer = 120;
    clearInterval(this.popupInterval);
    this.popupInterval = setInterval(() => {
      this.popupTimer--;
      if (this.popupTimer <= 0) { clearInterval(this.popupInterval); this.closeApprovalPopup(); }
    }, 1000);
  }

  closeApprovalPopup() {
    const currentKey = this.getApprovalRequestKey(this.currentApproval);
    this.popupRequestQueue = this.popupRequestQueue.filter((req) => this.getApprovalRequestKey(req) !== currentKey);
    clearInterval(this.popupInterval);
    this.popupTimer = 0;
    this.showNextApprovalPopup();
  }

  async onApprove() {
    if (!this.currentApproval?.id) return;
    const loader = await this.loadingCtrl.create({ message: 'Approving...' });
    await loader.present();
    const name = this.user?.fullName || this.user?.username || 'Resident';
    this.guestSvc.approveRequest(this.currentApproval.id, name).subscribe({
      next: async () => { await loader.dismiss(); this.closeApprovalPopup(); this.showToast('Visitor approved.', 'success'); this.loadData(); },
      error: async () => { await loader.dismiss(); this.showToast('Failed to approve.', 'danger'); }
    });
  }

  async onReject() {
    if (!this.currentApproval?.id) return;
    const alert = await this.alertCtrl.create({
      header: 'Reject Entry',
      message: 'Reason for rejection (optional):',
      inputs: [{ name: 'note', type: 'text', placeholder: 'Reason...' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Reject', cssClass: 'reject-btn', handler: async (data) => {
          const loader = await this.loadingCtrl.create({ message: 'Rejecting...' });
          await loader.present();
          const name = this.user?.fullName || this.user?.username || 'Resident';
          this.guestSvc.rejectRequest(this.currentApproval!.id!, name, data.note).subscribe({
            next: async () => { await loader.dismiss(); this.closeApprovalPopup(); this.showToast('Entry rejected.', 'warning'); this.loadData(); },
            error: async () => { await loader.dismiss(); this.showToast('Failed to reject.', 'danger'); }
          });
        }}
      ]
    });
    await alert.present();
  }

  openPreApprovalForm() {
    this.newPreApproval = {
      apartmentNumber: this.user?.apartmentNumber || '',
      societyName: this.user?.societyName || '',
      visitorType: 'Guest',
      createdBy: this.user?.fullName || this.user?.username || 'Resident'
    };
    this.showPreApprovalForm = true;
  }

  async submitPreApproval() {
    if (!this.newPreApproval.visitorName || !this.newPreApproval.visitorPhone) { this.showToast('Name and phone are required.', 'warning'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Saving...' });
    await loader.present();
    this.guestSvc.createPreApproval(this.newPreApproval as PreApproval).subscribe({
      next: async () => { await loader.dismiss(); this.showPreApprovalForm = false; this.showToast('Pre-approval added.', 'success'); this.loadPreApprovals(); },
      error: async () => { await loader.dismiss(); this.showToast('Failed to save.', 'danger'); }
    });
  }

  async deletePreApproval(id: number) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Pre-Approval', message: 'Remove this pre-approved visitor?',
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive', handler: () => { this.preApprovals = this.preApprovals.filter(p => p.id !== id); this.showToast('Removed.', 'medium'); } }]
    });
    await alert.present();
  }

  onSegmentChange(ev: any) {
    this.activeSegment = ev.detail.value;
    if (this.activeSegment === 'requests') this.loadPending();
    if (this.activeSegment === 'logs') this.loadLogs();
    if (this.activeSegment === 'preapprovals') this.loadPreApprovals();
    if (this.activeSegment === 'posts') this.loadPosts();
  }

  openPosts(type: 'community' | 'announcements' = 'community') {
    this.selectedPostType = type;
    this.activeSegment = 'posts';
    this.loadPosts();
  }

  onPostTypeChange(ev: any) {
    const next = ev?.detail?.value;
    this.selectedPostType = next === 'announcements' ? 'announcements' : 'community';
  }

  getVisiblePosts(): CommunityPost[] {
    return this.selectedPostType === 'community' ? this.posts : this.announcements;
  }

  getSocietyName(): string {
    return (this.user?.societyName || '').trim() || 'NammaSociety';
  }

  getTowerFlatLine(): string {
    const tower = (this.user?.tower || (this.user as any)?.towerNumber || (this.user as any)?.tower_number || '').toString().trim() || '-';
    const flat = (this.user?.apartmentNumber || (this.user as any)?.flatNumber || (this.user as any)?.flat_number || '').toString().trim() || '-';
    return 'Tower ' + tower + ' | Flat ' + flat;
  }

  private hasSocietyContext(): boolean {
    return !!this.user?.societyName?.trim();
  }

  private buildQuickActions(): Array<{ key: string; label: string; icon: string; color: string; badge?: number }> {
    const roleCategory = this.auth.getRoleCategory();
    const hasSociety = this.hasSocietyContext();
    const actions: Array<{ key: string; label: string; icon: string; color: string; badge?: number }> = [];

    if (roleCategory === 'security') {
      actions.push({ key: 'requests', label: this.t('dashboard.guest_approvals', 'Guest Management'), icon: 'walk-outline', color: 'warning', badge: this.pendingRequests.length || undefined });
      actions.push({ key: 'user-directory', label: this.t('dashboard.user_directory', 'User Directory'), icon: 'people-outline', color: 'primary' });
      actions.push({ key: 'logs', label: this.t('mobile.logs', 'Logs'), icon: 'time-outline', color: 'medium' });
      actions.push({ key: 'preapprovals', label: this.t('mobile.pre_approved', 'Pre-Approved'), icon: 'shield-checkmark-outline', color: 'tertiary' });
      return actions;
    }

    if (roleCategory === 'super-admin') {
      actions.push({ key: 'admin-users', label: this.t('dashboard.user_management', 'User Management'), icon: 'people-circle-outline', color: 'primary' });
      actions.push({ key: 'audit-logs', label: this.t('dashboard.audit_logs', 'Audit Logs'), icon: 'document-text-outline', color: 'secondary' });
      actions.push({ key: 'bulk-upload', label: this.t('dashboard.bulk_user_upload', 'Bulk Upload'), icon: 'cloud-upload-outline', color: 'tertiary' });
      actions.push({ key: 'society-management', label: this.t('dashboard.society_management', 'Society Management'), icon: 'business-outline', color: 'success' });
      actions.push({ key: 'security-users', label: this.t('dashboard.security_users', 'Security Users'), icon: 'shield-outline', color: 'warning' });
      actions.push({ key: 'settings', label: this.t('dashboard.settings', 'Settings'), icon: 'settings-outline', color: 'medium' });
      actions.push({ key: 'announcements', label: this.t('mobile.announcements', 'Announcements'), icon: 'megaphone-outline', color: 'warning' });
      actions.push({ key: 'posts', label: this.t('mobile.posts', 'Posts'), icon: 'chatbubbles-outline', color: 'success' });
      return actions;
    }

    if (roleCategory === 'society-admin' && hasSociety) {
      actions.push({ key: 'admin-users', label: this.t('dashboard.user_management', 'User Management'), icon: 'people-circle-outline', color: 'primary' });
      actions.push({ key: 'bulk-upload', label: this.t('dashboard.bulk_user_upload', 'Bulk Upload'), icon: 'cloud-upload-outline', color: 'tertiary' });
      actions.push({ key: 'payments', label: this.t('dashboard.payment_management', 'Payments'), icon: 'card-outline', color: 'success' });
      actions.push({ key: 'maintenance', label: this.t('dashboard.maintenance_payment', 'Maintenance'), icon: 'home-outline', color: 'warning' });
      actions.push({ key: 'security-users', label: this.t('dashboard.security_users', 'Security Users'), icon: 'shield-outline', color: 'secondary' });
      actions.push({ key: 'requests', label: this.t('dashboard.guest_approvals', 'Guest Management'), icon: 'walk-outline', color: 'danger', badge: this.pendingRequests.length || undefined });
      actions.push({ key: 'announcements', label: this.t('mobile.announcements', 'Announcements'), icon: 'megaphone-outline', color: 'warning' });
      actions.push({ key: 'posts', label: this.t('mobile.posts', 'Posts'), icon: 'chatbubbles-outline', color: 'success' });
      return actions;
    }

    actions.push({ key: 'marketplace', label: this.t('dashboard.marketplace', 'Market Place'), icon: 'storefront-outline', color: 'success' });
    actions.push({ key: 'cr-marketplace', label: this.t('dashboard.cr_marketplace', 'CR Market Place'), icon: 'restaurant-outline', color: 'warning' });
    actions.push({ key: 'amenities', label: this.t('dashboard.amenities', 'Amenities'), icon: 'fitness-outline', color: 'tertiary' });
    actions.push({ key: 'nobroker', label: this.t('dashboard.nobroker_internal', 'NoBroker-Internal'), icon: 'business-outline', color: 'primary' });
    actions.push({ key: 'orders', label: this.t('dashboard.orders', 'Orders'), icon: 'bag-handle-outline', color: 'secondary' });
    actions.push({ key: 'bookings', label: this.t('dashboard.bookings', 'Bookings'), icon: 'calendar-number-outline', color: 'medium' });
    actions.push({ key: 'requests', label: this.t('dashboard.guest_approvals', 'Guest Management'), icon: 'walk-outline', color: 'danger', badge: this.pendingRequests.length || undefined });
    actions.push({ key: 'user-directory', label: this.t('dashboard.user_directory', 'User Directory'), icon: 'people-outline', color: 'primary' });
    actions.push({ key: 'announcements', label: this.t('mobile.announcements', 'Announcements'), icon: 'megaphone-outline', color: 'warning' });
    actions.push({ key: 'posts', label: this.t('mobile.posts', 'Posts'), icon: 'chatbubbles-outline', color: 'success' });
    if (hasSociety) actions.push({ key: 'preapprovals', label: this.t('mobile.pre_approvals', 'Pre-Approvals'), icon: 'shield-checkmark-outline', color: 'tertiary' });

    return actions;
  }

  onQuickAction(actionKey: string) {
    if (actionKey === 'requests') { this.activeSegment = 'requests'; this.loadPending(); return; }
    if (actionKey === 'logs') { this.activeSegment = 'logs'; this.loadLogs(); return; }
    if (actionKey === 'preapprovals') { this.activeSegment = 'preapprovals'; this.loadPreApprovals(); return; }
    if (actionKey === 'preapprove') { this.openPreApprovalForm(); return; }
    if (actionKey === 'posts') { this.openPosts('community'); return; }
    if (actionKey === 'announcements') { this.openPosts('announcements'); return; }
    if (actionKey === 'refresh') { this.loadSummary(); return; }

    // Amenities: go to overview tab and expand the amenities menu section
    if (actionKey === 'amenities') {
      this.activeSegment = 'overview';
      this.expandedMenuItems.add('amenities');
      return;
    }

    if (actionKey === 'marketplace') { this.openWebRoute('/marketplace'); return; }
    if (actionKey === 'cr-marketplace') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'cr-marketplace' }); return; }
    if (actionKey === 'nobroker') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'nobroker' }); return; }
    if (actionKey === 'orders') { this.openWebRoute('/marketplace', { view: 'orders' }); return; }
    if (actionKey === 'bookings') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'bookings' }); return; }
    if (actionKey === 'user-directory') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'directory' }); return; }

    if (actionKey === 'admin-users') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'users' }); return; }
    if (actionKey === 'audit-logs') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'audit' }); return; }
    if (actionKey === 'bulk-upload') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'bulk-upload' }); return; }
    if (actionKey === 'society-management') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'societies' }); return; }
    if (actionKey === 'security-users') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'security-users' }); return; }
    if (actionKey === 'settings') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'settings' }); return; }
    if (actionKey === 'payments') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'payments' }); return; }
    if (actionKey === 'maintenance') { this.openWebRoute('/dashboard-mfe', { launchTarget: 'maintenance' }); return; }
  }

  private openWebRoute(path: string, extraParams?: Record<string, string>): void {
    const user = this.auth.getCurrentUser();
    const token = this.auth.getToken();
    const host = this.getDashboardHost();

    let url = `http://${host}:4203${path}`;
    const params: string[] = [];
    if (token) {
      params.push(`token=${encodeURIComponent(token)}`);
    }
    if (user) {
      params.push(`user=${encodeURIComponent(JSON.stringify(user))}`);
    }
    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      });
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    if (typeof window !== 'undefined' && window.open) {
      window.open(url, '_blank');
    }
  }

  private getDashboardHost(): string {
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');
    if (isAndroid) {
      return '10.0.2.2';
    }

    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return window.location.hostname;
    }

    return 'localhost';
  }

  getBreadcrumbTrail(): string {
    return this.getSocietyName() + ' / ' + this.auth.getDashboardTitle() + ' / ' + this.auth.getCurrentRoleLabel();
  }

  toggleMenuPanel() {
    this.showMenuPanel = !this.showMenuPanel;
  }

  toggleMenuSection(sectionKey: string) {
    if (this.expandedMenuItems.has(sectionKey)) {
      this.expandedMenuItems.delete(sectionKey);
    } else {
      this.expandedMenuItems.add(sectionKey);
    }
  }

  isMenuSectionExpanded(sectionKey: string): boolean {
    return this.expandedMenuItems.has(sectionKey);
  }

  selectMenuAmenity(amenity: string) {
    this.showMenuPanel = false;
    this.activeSegment = 'overview';
    this.expandedMenuItems.add('amenities');
    this.showToast(`${amenity} selected`, 'primary');
  }

  selectMenuCategory(categoryKey: string) {
    if (categoryKey === 'community') {
      this.selectedPostType = 'community';
      this.activeSegment = 'posts';
    } else if (categoryKey === 'announcements') {
      this.selectedPostType = 'announcements';
      this.activeSegment = 'posts';
    } else if (categoryKey === 'preapprovals') {
      this.activeSegment = 'preapprovals';
    }
    this.toggleMenuSection('posts');
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

  getServiceColorClass(req: ApprovalRequest | null): string {
    const type = (req?.visitorType || '').toUpperCase();
    if (type === 'DELIVERY') return 'popup-header-blue';
    if (type === 'CAB') return 'popup-header-indigo';
    if (type === 'VENDOR') return 'popup-header-green';
    if (type === 'VISITING_HELP') return 'popup-header-yellow';
    return 'popup-header-violet';
  }

  getVibgyorClass(type: string | undefined): string {
    const visitorType = (type || '').toUpperCase();
    if (visitorType === 'DELIVERY') return 'type-delivery';
    if (visitorType === 'CAB') return 'type-cab';
    if (visitorType === 'VENDOR') return 'type-vendor';
    if (visitorType === 'VISITING_HELP') return 'type-help';
    return 'type-guest';
  }

  getServicePersonName(req: ApprovalRequest | null): string {
    if (!req) return '-';
    return (req.visitorName || '').trim() || 'Unknown Visitor';
  }

  getVendorLogo(req: ApprovalRequest | null): string {
    const subType = this.getVisitorSubTypeDisplay(req).toLowerCase();
    const type = (req?.visitorType || '').toUpperCase();

    if (type === 'DELIVERY') {
      if (subType.includes('swiggy')) return 'SWG';
      if (subType.includes('zomato')) return 'ZMT';
      if (subType.includes('amazon')) return 'AMZ';
      if (subType.includes('flipkart')) return 'FLP';
      if (subType.includes('blinkit') || subType.includes('bigbasket')) return 'DLV';
      return 'PKG';
    }

    if (type === 'CAB') {
      if (subType.includes('uber')) return 'UBR';
      if (subType.includes('ola')) return 'OLA';
      if (subType.includes('rapido')) return 'RPD';
      return 'CAB';
    }

    if (type === 'VENDOR') return 'VDR';
    if (type === 'VISITING_HELP') return 'HLP';
    return 'GST';
  }

  getServiceDisplayName(req: ApprovalRequest | null): string {
    if (!req) return 'Visitor';
    const typeLabel = this.getVisitorTypeLabel(req.visitorType);
    const subType = this.getVisitorSubTypeDisplay(req);
    return subType !== '-' ? `${typeLabel} - ${subType}` : typeLabel;
  }

  getVisitorTypeLabel(type: string | undefined): string {
    const normalized = (type || '').toUpperCase();
    if (normalized === 'DELIVERY') return 'Delivery';
    if (normalized === 'CAB') return 'Cab';
    if (normalized === 'VENDOR') return 'Vendor';
    if (normalized === 'VISITING_HELP') return 'Visiting Help';
    return 'Guest';
  }

  getVisitorSubTypeDisplay(req: ApprovalRequest | null): string {
    if (!req) return '-';

    const explicitSubType = (req.serviceSubCategory || '').trim();
    if (explicitSubType) return explicitSubType;

    const type = (req.visitorType || '').toUpperCase();
    if (type === 'DELIVERY') {
      const service = req.deliveryService === 'Other' ? req.deliveryServiceOther : req.deliveryService;
      const resolved = service?.trim() ? service.trim() : this.inferService(req.purpose || req.visitorName || '');
      return resolved || '-';
    }

    if (type === 'CAB') {
      const service = req.cabService === 'Other' ? req.cabServiceOther : req.cabService;
      const resolved = service?.trim() ? service.trim() : this.inferService(req.purpose || req.visitorName || '');
      return resolved || '-';
    }

    const inferred = this.inferService(req.purpose || req.visitorName || '');
    return inferred || '-';
  }

  private inferService(text: string): string {
    const tag = /\[service:\s*([^\]]+)\]/i.exec(text);
    if (tag) return tag[1].trim();
    const keywords: Record<string, string> = {
      uber: 'Uber',
      ola: 'Ola',
      rapido: 'Rapido',
      swiggy: 'Swiggy',
      zomato: 'Zomato',
      amazon: 'Amazon',
      flipkart: 'Flipkart',
      bigbasket: 'BigBasket',
      blinkit: 'Blinkit'
    };
    const lower = text.toLowerCase();
    const found = Object.keys(keywords).find((key) => lower.includes(key));
    return found ? keywords[found] : '';
  }

  formatTime(d: string | undefined): string {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN') + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  formatPostTime(d: string | undefined): string {
    if (!d) return 'Recently';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return 'Recently';
    return dt.toLocaleDateString('en-IN') + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  getPostAuthor(post: CommunityPost): string {
    return post.authorName || post.createdBy || 'Community';
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
