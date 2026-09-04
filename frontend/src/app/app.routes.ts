import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { MainLayoutComponent } from './core/layout/main-layout';
import { DashboardComponent } from './features/dashboard/dashboard';
import { NoticesComponent } from './features/notices/notices';
import { Issues } from './features/issues/issues';
import { Matrix } from './features/matrix/matrix';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  {
    path: '',
    component: MainLayoutComponent, 
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'recados', component: NoticesComponent },
      { path: 'problemas', component: Issues },
      { path: 'matriz', component: Matrix },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];