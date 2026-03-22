import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminDashboardComponent } from './pages/admin-panel/admin-dashboard.component';
import { UserManagementComponent } from './pages/admin-panel/user-management.component';
import { AuditLogsComponent } from './pages/admin-panel/audit-logs.component';
import { MarketplaceComponent } from './pages/marketplace/marketplace.component';
import { SellerPortalComponent } from './pages/seller-portal/seller-portal.component';
import { VisitorEntryComponent } from './pages/visitor-entry/visitor-entry.component';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard],
    data: { title: 'Admin Console' }
  },
  {
    path: 'marketplace',
    component: MarketplaceComponent,
    data: { title: 'MarketPlace' }
  },
  {
    path: 'seller-portal',
    component: SellerPortalComponent,
    data: { title: 'Seller Portal' }
  },
  {
    path: 'visitor-entry',
    component: VisitorEntryComponent,
    data: { title: 'Visitor Self Entry' }
  }
];

@NgModule({
  declarations: [
    DashboardComponent,
    AdminDashboardComponent,
    UserManagementComponent,
    AuditLogsComponent,
    MarketplaceComponent,
    SellerPortalComponent,
    VisitorEntryComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild(routes)
  ],
  providers: [AdminGuard]
})
export class DashboardModule { }
