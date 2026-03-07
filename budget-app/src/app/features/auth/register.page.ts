import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CardModule],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage {}
