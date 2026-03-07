import { Routes } from '@angular/router';

import { LoginPage } from './features/auth/login.page';
import { RegisterPage } from './features/auth/register.page';
import { BudgetsPage } from './features/budgets/budgets.page';
import { DashboardPage } from './features/dashboard/dashboard.page';
import { HomePage } from './features/home/home.page';
import { TransactionsPage } from './features/transactions/transactions.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomePage },
  { path: 'auth/login', component: LoginPage },
  { path: 'auth/register', component: RegisterPage },
  { path: 'dashboard', component: DashboardPage },
  { path: 'budgets', component: BudgetsPage },
  { path: 'transactions', component: TransactionsPage },
  { path: '**', redirectTo: 'home' }
];
