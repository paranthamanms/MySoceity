import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExternalRedirectComponent } from './external-redirect.component';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./login.module').then(m => m.LoginModule)
  },
  {
    path: 'register',
    component: ExternalRedirectComponent,
    data: { externalUrl: '/register-mfe' }
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
