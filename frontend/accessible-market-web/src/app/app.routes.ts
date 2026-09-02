import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent), title: 'AccessiUX Market' },
  { path: 'catalog', loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent), title: 'Catálogo | AccessiUX Market' },
  { path: 'products/:slug', loadComponent: () => import('./features/catalog/product-detail.component').then(m => m.ProductDetailComponent), title: 'Producto | AccessiUX Market' },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent), title: 'Iniciar sesión | AccessiUX Market' },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent), title: 'Crear cuenta | AccessiUX Market' },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent), title: 'Restablecer contraseña | AccessiUX Market' },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent), title: 'Nueva contraseña | AccessiUX Market' },
  { path: 'account', canActivate: [authGuard], loadComponent: () => import('./features/account/account.component').then(m => m.AccountComponent), title: 'Mi cuenta | AccessiUX Market' },
  { path: 'seller', canActivate: [authGuard], loadComponent: () => import('./features/seller/seller-dashboard.component').then(m => m.SellerDashboardComponent), title: 'Panel de vendedor | AccessiUX Market' },
  { path: '**', redirectTo: '' },
];
