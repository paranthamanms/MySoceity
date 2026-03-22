import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExternalRedirectComponent } from './external-redirect.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: ExternalRedirectComponent,
    data: { externalUrl: 'http://localhost:4201/' }
  },
  {
    path: 'register',
    component: ExternalRedirectComponent,
    data: { externalUrl: 'http://localhost:4202/' }
  },
  {
    path: 'dashboard',
    component: ExternalRedirectComponent,
    data: { externalUrl: 'http://localhost:4203/' }
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRouting { }
