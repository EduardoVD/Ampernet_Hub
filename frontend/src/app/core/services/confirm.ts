import { Injectable, signal } from '@angular/core';

export type ConfirmType = 'danger' | 'warning' | 'primary';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

interface ActiveConfirmDialog extends ConfirmDialogOptions {
  id: string;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  currentDialog = signal<ActiveConfirmDialog | null>(null);

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const id = `${Date.now()}`;
      this.currentDialog.set({
        ...options,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'primary',
        id,
        resolve
      });
    });
  }

  resolveDialog(confirmed: boolean): void {
    const dialog = this.currentDialog();
    if (dialog) {
      dialog.resolve(confirmed);
      this.currentDialog.set(null);
    }
  }
}

