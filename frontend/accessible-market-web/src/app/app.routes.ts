import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent), title: 'AccessiUX Market' },
  { path: 'catalog', loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent), title: 'Catálogo | AccessiUX Market' },
  { path: 'products/:slug', loadComponent: () => import('./features/catalog/product-detail.component').then(m => m.ProductDetailComponent), title: 'Producto | AccessiUX Market' },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent), title: 'Iniciar sesión | AccessiUX Market' },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent), title: 'Crear cuenta | AccessiUX Market' },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent), title: 'Restablecer contraseña | AccessiUX Market' },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent), title: 'Nueva contraseña | AccessiUX Market' },
  { path: 'accessibility', loadComponent: () => import('./features/accessibility/accessibility.component').then(m => m.AccessibilityComponent), title: 'Accesibilidad | AccessiUX Market' },
  { path: 'cart', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent), title: 'Mi carrito | AccessiUX Market' },
  { path: 'checkout', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent), title: 'Checkout | AccessiUX Market' },
  { path: 'orders', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent), title: 'Mis pedidos | AccessiUX Market' },
  { path: 'orders/:id/invoice', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./features/orders/order-invoice.component').then(m => m.OrderInvoiceComponent), title: 'Factura accesible | AccessiUX Market' },
  { path: 'orders/:id', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./features/orders/orders.component').then(m => m.OrderDetailComponent), title: 'Detalle del pedido | AccessiUX Market' },
  { path: 'account', canActivate: [authGuard], loadComponent: () => import('./features/account/account.component').then(m => m.AccountComponent), title: 'Mi cuenta | AccessiUX Market' },
  { path: 'seller', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./features/seller/seller-dashboard.component').then(m => m.SellerDashboardComponent), title: 'Panel de vendedor | AccessiUX Market' },
  { path: 'admin', canActivate: [roleGuard], data: { roles: ['Administrator'] }, loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent), title: 'Administración | AccessiUX Market' },
  { path: '**', redirectTo: '' },
];
