import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { MainLayoutComponent } from './core/layout/main-layout';
import { DashboardComponent } from './features/dashboard/dashboard';
import { NoticesComponent } from './features/notices/notices';
import { Issues } from './features/issues/issues';
import { Matrix } from './features/matrix/matrix';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
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