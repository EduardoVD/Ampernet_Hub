import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastItem[]>([]);

  show(type: ToastType, message: string, title?: string, duration: number = 4000): void {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastItem = { id, type, message, title, duration };

    this.toasts.update((current) => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: string, title: string = 'Sucesso!'): void {
    this.show('success', message, title);
  }

  error(message: string, title: string = 'Erro'): void {
    this.show('error', message, title, 5000);
  }

  warning(message: string, title: string = 'Atenção'): void {
    this.show('warning', message, title, 4500);
  }

  info(message: string, title: string = 'Informação'): void {
    this.show('info', message, title);
  }

  dismiss(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}

