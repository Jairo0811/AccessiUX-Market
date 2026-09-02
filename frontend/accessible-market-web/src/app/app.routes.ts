import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((module) => module.HomeComponent),
    title: 'AccessiUX Market',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((module) => module.LoginComponent),
    title: 'Iniciar sesión | AccessiUX Market',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then((module) => module.RegisterComponent),
    title: 'Crear cuenta | AccessiUX Market',
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password.component').then((module) => module.ForgotPasswordComponent),
    title: 'Restablecer contraseña | AccessiUX Market',
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password.component').then((module) => module.ResetPasswordComponent),
    title: 'Nueva contraseña | AccessiUX Market',
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/account.component').then((module) => module.AccountComponent),
    title: 'Mi cuenta | AccessiUX Market',
  },
  { path: '**', redirectTo: '' },
];
