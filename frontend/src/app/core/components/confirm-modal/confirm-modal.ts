import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../services/confirm';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrls: ['./confirm-modal.scss']
})
export class ConfirmModalComponent {
  private confirmService = inject(ConfirmService);
  dialog = this.confirmService.currentDialog;

  onConfirm(): void {
    this.confirmService.resolveDialog(true);
  }

  onCancel(): void {
    this.confirmService.resolveDialog(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog()) {
      this.onCancel();
    }
  }
}

