import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CardModule, ButtonModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {}
