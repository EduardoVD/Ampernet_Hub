import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  readonly isTvMode = signal<boolean>(false);

  toggleTvMode(): void {
    this.isTvMode.update(val => !val);
  }

  setTvMode(enabled: boolean): void {
    this.isTvMode.set(enabled);
  }
}

