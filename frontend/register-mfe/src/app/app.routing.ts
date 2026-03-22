import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExternalRedirectComponent } from './external-redirect.component';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./register.module').then(m => m.RegisterModule)
  },
  {
    path: 'login',
    component: ExternalRedirectComponent,
    data: { externalUrl: '/login-mfe' }
  },
  {
    path: 'dashboard',
    component: ExternalRedirectComponent,
    data: { externalUrl: '/dashboard-mfe' }
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
