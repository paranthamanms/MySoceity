import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'security',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/security/security.module').then(m => m.SecurityPageModule)
  },
  {
    path: 'community',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/community/community.module').then(m => m.CommunityPageModule)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
