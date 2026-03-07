import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [CardModule],
  templateUrl: './budgets.page.html',
  styleUrl: './budgets.page.scss'
})
export class BudgetsPage {}
