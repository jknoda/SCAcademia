import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-training-notes-placeholder',
  standalone: false,
  templateUrl: './training-notes-placeholder.component.html',
  styleUrls: ['./training-notes-placeholder.component.scss'],
})
export class TrainingNotesPlaceholderComponent implements OnInit {
  sessionId = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
  }
}
