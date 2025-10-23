import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consultation-not-found',
  templateUrl: './consultation-not-found.component.html',
  styleUrls: ['./consultation-not-found.component.scss']
})
export class ConsultationNotFoundComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
