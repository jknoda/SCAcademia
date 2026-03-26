import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-training-review-placeholder',
  standalone: false,
  templateUrl: './training-review-placeholder.component.html',
  styleUrls: ['./training-review-placeholder.component.scss'],
})
export class TrainingReviewPlaceholderComponent implements OnInit {
  sessionId = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
  }
}
