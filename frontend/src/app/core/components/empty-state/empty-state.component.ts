import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EmptyStateIcon = 'issues' | 'notices' | 'matrix' | 'reports' | 'search' | 'users' | 'default';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() icon: EmptyStateIcon = 'default';
  @Input() title: string = '';
  @Input() message?: string;
  @Input() compact: boolean = false;
}

