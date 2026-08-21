import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: '',
        // pathMatch: 'full' -> chỉ khớp khi KHÔNG còn đoạn URL nào chưa tiêu thụ.
        pathMatch: 'full',
        loadComponent: () => import('@features/home/home').then((m) => m.Home),
        title: 'pages.home',
      },
      {
        path: '403',
        loadComponent: () =>
          import('@features/errors/forbidden/forbidden').then((m) => m.Forbidden),
        title: 'pages.forbidden',
      },
      {
        // Trang 404 là một địa chỉ THẬT, không phải chỉ là đích của wildcard.
        path: '404',
        loadComponent: () => import('@features/errors/not-found/not-found').then((m) => m.NotFound),
        title: 'pages.notFound',
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('@layout/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [],
  },
  {
    path: '**',
    redirectTo: '404',
  },
];
