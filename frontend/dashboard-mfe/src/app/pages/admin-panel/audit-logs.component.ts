import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {

  filterType: string = '';
  filterService: string = '';
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 15;
  viewMode: 'timeline' | 'grouped' = 'timeline';

  allLogs: any[] = [];

  filteredLogs: any[] = [];
  groupedLogs: Array<{ serviceName: string; displayName: string; logs: any[] }> = [];
  serviceStats: Array<{ serviceName: string; displayName: string; count: number }> = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  selectedLogIds: string[] = [];
  selectedLogs: any[] = [];
  diffLinesLeft: Array<{ text: string; type: 'same' | 'removed' | 'empty' }> = [];
  diffLinesRight: Array<{ text: string; type: 'same' | 'added' | 'empty' }> = [];

  private readonly auditLogsUrl = 'http://localhost:8002/api/user/audit-logs';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchLogs();
  }

  fetchLogs(serviceName?: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    const url = this.buildLogsUrl(serviceName);

    this.http.get<any>(url)
      .subscribe({
        next: (response) => {
          const logs = Array.isArray(response?.data) ? response.data : [];
          this.allLogs = logs.map((log: any) => this.mapLog(log));
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = this.getLoadErrorMessage(error, serviceName);
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.allLogs];

    if (this.filterType) {
      filtered = filtered.filter(log => 
        log.eventTypeClass === this.filterType.toLowerCase()
      );
    }

    if (this.filterService) {
      filtered = filtered.filter(log =>
        log.serviceName.toLowerCase() === this.filterService.toLowerCase()
      );
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.user.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query) ||
        log.ipAddress.includes(query) ||
        log.serviceName.toLowerCase().includes(query)
      );
    }

    this.filteredLogs = filtered;
    this.currentPage = 1;
    this.updateGroupsAndStats();
  }

  onServiceChange(): void {
    const service = this.filterService?.trim();
    if (service) {
      this.fetchLogs(service);
    } else {
      this.fetchLogs();
    }
  }

  get pagedLogs(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  exportLogs(): void {
    console.log('Exporting logs...');
    // TODO: Implement CSV export functionality
    alert('Export feature coming soon');
  }

  refreshLogs(): void {
    if (!this.isLoading) {
      const service = this.filterService?.trim();
      this.fetchLogs(service || undefined);
    }
  }

  setViewMode(mode: 'timeline' | 'grouped'): void {
    this.viewMode = mode;
  }

  toggleSelection(log: any): void {
    const logId = this.getLogId(log);
    const index = this.selectedLogIds.indexOf(logId);
    if (index >= 0) {
      this.selectedLogIds.splice(index, 1);
    } else {
      if (this.selectedLogIds.length >= 2) {
        this.selectedLogIds.shift();
      }
      this.selectedLogIds.push(logId);
    }
    this.updateSelectedLogs();
  }

  isSelected(log: any): boolean {
    return this.selectedLogIds.includes(this.getLogId(log));
  }

  clearSelection(): void {
    this.selectedLogIds = [];
    this.selectedLogs = [];
    this.diffLinesLeft = [];
    this.diffLinesRight = [];
  }

  private mapLog(log: any): any {
    const createdAt = log?.createdAt ? new Date(log.createdAt) : new Date();
    const eventTypeRaw = log?.eventType || '';
    const eventTypeClass = this.normalizeEventType(eventTypeRaw || 'unknown');
    return {
      id: log?.id,
      eventType: this.formatEventType(eventTypeRaw),
      eventTypeClass,
      user: log?.username || 'unknown',
      timestamp: createdAt.toLocaleString('en-US'),
      ipAddress: log?.ipAddress || 'N/A',
      description: log?.description || 'No description',
      serviceName: (log?.serviceName || 'unknown').toLowerCase(),
      serviceDisplayName: this.getServiceDisplayName(log?.serviceName || 'unknown'),
      details: log?.details || ''
    };
  }

  private updateSelectedLogs(): void {
    const logMap = new Map<string, any>();
    this.allLogs.forEach(log => logMap.set(this.getLogId(log), log));
    this.selectedLogs = this.selectedLogIds.map(id => logMap.get(id)).filter(Boolean);

    if (this.selectedLogs.length === 2) {
      const left = this.getLogSnapshot(this.selectedLogs[0]);
      const right = this.getLogSnapshot(this.selectedLogs[1]);
      const diffResult = this.buildDiffLines(left, right);
      this.diffLinesLeft = diffResult.leftLines;
      this.diffLinesRight = diffResult.rightLines;
    } else {
      this.diffLinesLeft = [];
      this.diffLinesRight = [];
    }
  }

  private getLogSnapshot(log: any): string {
    const payload = {
      eventType: log.eventType,
      service: log.serviceDisplayName,
      user: log.user,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      description: log.description,
      details: log.details
    };
    return JSON.stringify(payload, null, 2);
  }

  private buildDiffLines(left: string, right: string): {
    leftLines: Array<{ text: string; type: 'same' | 'removed' | 'empty' }>;
    rightLines: Array<{ text: string; type: 'same' | 'added' | 'empty' }>;
  } {
    const leftArr = left.split('\n');
    const rightArr = right.split('\n');
    const maxLen = Math.max(leftArr.length, rightArr.length);
    const leftLines: Array<{ text: string; type: 'same' | 'removed' | 'empty' }> = [];
    const rightLines: Array<{ text: string; type: 'same' | 'added' | 'empty' }> = [];

    for (let i = 0; i < maxLen; i++) {
      const l = leftArr[i];
      const r = rightArr[i];

      if (l === r) {
        leftLines.push({ text: l ?? '', type: 'same' });
        rightLines.push({ text: r ?? '', type: 'same' });
      } else {
        if (l !== undefined) {
          leftLines.push({ text: l, type: 'removed' });
        } else {
          leftLines.push({ text: '', type: 'empty' });
        }

        if (r !== undefined) {
          rightLines.push({ text: r, type: 'added' });
        } else {
          rightLines.push({ text: '', type: 'empty' });
        }
      }
    }

    return { leftLines, rightLines };
  }

  private getLogId(log: any): string {
    if (log?.id) {
      return String(log.id);
    }
    return [log?.serviceName, log?.timestamp, log?.eventType, log?.user]
      .filter(Boolean)
      .join('|');
  }

  private formatEventType(eventType: string): string {
    if (!eventType) {
      return 'Unknown';
    }
    return eventType
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private normalizeEventType(eventType: string): string {
    return eventType
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  private updateGroupsAndStats(): void {
    const serviceMap = new Map<string, { displayName: string; logs: any[] }>();
    this.filteredLogs.forEach((log) => {
      const key = log.serviceName || 'unknown';
      if (!serviceMap.has(key)) {
        serviceMap.set(key, {
          displayName: this.getServiceDisplayName(key),
          logs: []
        });
      }
      serviceMap.get(key)?.logs.push(log);
    });

    this.groupedLogs = Array.from(serviceMap.entries()).map(([serviceName, value]) => ({
      serviceName,
      displayName: value.displayName,
      logs: value.logs
    }));

    this.serviceStats = this.groupedLogs.map(group => ({
      serviceName: group.serviceName,
      displayName: group.displayName,
      count: group.logs.length
    }));
  }

  private getServiceDisplayName(serviceName: string): string {
    const key = (serviceName || '').toLowerCase();
    const map: Record<string, string> = {
      'auth-service': 'Auth Service',
      'user-service': 'User Service',
      'login-mfe': 'Login MFE',
      'register-mfe': 'Register MFE',
      'dashboard-mfe': 'Dashboard MFE',
      'host-app': 'Host App',
      'unknown': 'Unknown'
    };
    return map[key] || serviceName;
  }

  private buildLogsUrl(serviceName?: string): string {
    const params: string[] = ['limit=200'];
    if (serviceName) {
      params.push(`serviceName=${encodeURIComponent(serviceName)}`);
    }
    return `${this.auditLogsUrl}/recent?${params.join('&')}`;
  }

  private getLoadErrorMessage(error: any, serviceName?: string): string {
    const base = serviceName
      ? `Failed to load audit logs for ${this.getServiceDisplayName(serviceName)}.`
      : 'Failed to load audit logs.';
    const serverMessage = error?.error?.message || error?.message;
    if (serverMessage) {
      return `${base} ${serverMessage}`;
    }
    return `${base} Please check the user service.`;
  }
}
