import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './core/components/toast-container/toast-container';
import { ConfirmModalComponent } from './core/components/confirm-modal/confirm-modal';

@Component({
  imports: [RouterOutlet, ToastContainerComponent, ConfirmModalComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('amper-frontend');
}
