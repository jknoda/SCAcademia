import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-training-attendance-placeholder',
  standalone: false,
  templateUrl: './training-attendance-placeholder.component.html',
  styleUrls: ['./training-attendance-placeholder.component.scss'],
})
export class TrainingAttendancePlaceholderComponent {
  sessionId = '';

  constructor(private route: ActivatedRoute, private router: Router) {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
  }

  backHome(): void {
    this.router.navigate(['/home']);
  }
}
