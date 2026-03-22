import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExternalRedirectComponent } from './external-redirect.component';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'dashboard-mfe',
    loadChildren: () => import('./dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'login',
    component: ExternalRedirectComponent,
    data: { externalUrl: '/login-mfe' }
  },
  {
    path: 'register',
    component: ExternalRedirectComponent,
    data: { externalUrl: '/register-mfe' }
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRouting {}
