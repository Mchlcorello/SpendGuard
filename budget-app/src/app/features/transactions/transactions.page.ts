import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [CardModule],
  templateUrl: './transactions.page.html',
  styleUrl: './transactions.page.scss'
})
export class TransactionsPage {}
