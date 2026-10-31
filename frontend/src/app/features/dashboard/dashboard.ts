import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../../core/services/auth';
import { NoticesService } from '../../core/services/notices';
import { IssuesService, IssueItem } from '../../core/services/issues';
import { ResponsibilitiesService, ResponsibilityItem } from '../../core/services/responsibilities';
import { EmptyStateComponent } from '../../core/components/empty-state/empty-state.component';

export interface NoticeItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
}

export interface ModalDetail {
  title: string;
  description: string;
  badge?: string;
  statusClass?: string;
  noticeId?: string;
  isRead?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private noticesService = inject(NoticesService);
  private issuesService = inject(IssuesService);
  private responsibilitiesService = inject(ResponsibilitiesService);

  currentUser = this.authService.currentUser;

  cityFilter = signal('');
  sectorFilter = signal('');
  searchFilter = signal('');

  issues = signal<IssueItem[]>([]);
  notices = signal<NoticeItem[]>([]);
  responsibilities = signal<ResponsibilityItem[]>([]);

  // Estado do Alerta contextual em Problemas Gerais
  currentAlert = signal<{ type: 'created' | 'resolved'; title: string } | null>(null);
  alertFadingOut = signal(false);
  cardsFadingOut = signal(false);
  isRestoringCards = signal(false);

  private knownIssuesMap = new Map<number, { status: string; title: string }>();
  private isInitialLoadDone = false;
  private issuesPollingSub?: Subscription;

  private alertTimeout: any = null;
  private alertFadeTimeout: any = null;
  private alertStartTimeout: any = null;
  private restoreCardsTimeout: any = null;

  activeModal = signal<ModalDetail | null>(null);

  canScrollLeft = signal(false);
  canScrollRight = signal(false);
  showLeftArrow = signal(false);
  showRightArrow = signal(false);
  holdingDirection = signal<'left' | 'right' | null>(null);

  private holdTimeout: any = null;
  private animFrameId: number | null = null;
  private isHolding = false;

  @ViewChild('issuesScroll') issuesScrollRef?: ElementRef<HTMLDivElement>;

  filteredResponsibilities = computed(() => {
    const city = this.cityFilter().trim().toLowerCase();
    const sector = this.sectorFilter().trim().toLowerCase();
    const search = this.searchFilter().trim().toLowerCase();

    return this.responsibilities().filter(item => {
      const matchCity = !city || item.city.toLowerCase().includes(city);
      const matchSector = !sector || item.sector.toLowerCase().includes(sector);
      const matchSearch =
        !search ||
        item.responsible.toLowerCase().includes(search) ||
        (item.ramal && item.ramal.toLowerCase().includes(search)) ||
        (item.email && item.email.toLowerCase().includes(search));

      return matchCity && matchSector && matchSearch;
    });
  });

  ngOnInit(): void {
    this.loadBackendNotices();
    this.loadBackendIssues(false);
    this.loadBackendResponsibilities();

    // Polling a cada 6 segundos para detecção de novos problemas/resoluções em tempo real
    this.issuesPollingSub = interval(6000).subscribe(() => {
      this.loadBackendIssues(true);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateScrollState(), 100);
  }

  ngOnDestroy(): void {
    this.stopContinuousScroll();
    this.issuesPollingSub?.unsubscribe();
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    if (this.alertFadeTimeout) clearTimeout(this.alertFadeTimeout);
    if (this.alertStartTimeout) clearTimeout(this.alertStartTimeout);
    if (this.restoreCardsTimeout) clearTimeout(this.restoreCardsTimeout);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateScrollState();
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  onWindowMouseUp(): void {
    if (this.isHolding || this.holdTimeout || this.holdingDirection()) {
      this.stopContinuousScroll();
    }
  }

  onWrapperMouseMove(event: MouseEvent): void {
    this.updateScrollState();
    const wrapper = event.currentTarget as HTMLElement;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const distFromRight = rect.width - mouseX;
    const proximityZone = 140;

    this.showLeftArrow.set(mouseX <= proximityZone && mouseX < distFromRight);
    this.showRightArrow.set(distFromRight <= proximityZone && distFromRight < mouseX);
  }

  onWrapperMouseLeave(): void {
    this.showLeftArrow.set(false);
    this.showRightArrow.set(false);
  }

  updateScrollState(): void {
    const el = this.issuesScrollRef?.nativeElement;
    if (!el) {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    this.canScrollLeft.set(el.scrollLeft > 4);
    this.canScrollRight.set(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }

  onMouseDownArrow(direction: 'left' | 'right', event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.stopContinuousScroll();
    this.holdingDirection.set(direction);

    this.holdTimeout = setTimeout(() => {
      this.isHolding = true;
      this.startContinuousScroll(direction);
    }, 180);
  }

  onMouseUpArrow(direction: 'left' | 'right'): void {
    if (!this.isHolding && this.holdTimeout) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
      this.holdingDirection.set(null);
      this.scrollIssues(direction);
    } else {
      this.stopContinuousScroll();
    }
  }

  onMouseLeaveArrow(): void {
    if (this.holdTimeout && !this.isHolding) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
      this.holdingDirection.set(null);
    }
  }

  private startContinuousScroll(direction: 'left' | 'right'): void {
    const el = this.issuesScrollRef?.nativeElement;
    if (!el) return;

    el.style.scrollBehavior = 'auto';
    const speed = direction === 'left' ? -10 : 10;

    const step = () => {
      if (!this.isHolding || !el) return;
      el.scrollLeft += speed;
      this.updateScrollState();

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (direction === 'left' && el.scrollLeft <= 0) {
        this.stopContinuousScroll();
        return;
      }
      if (direction === 'right' && el.scrollLeft >= maxScroll) {
        this.stopContinuousScroll();
        return;
      }

      this.animFrameId = requestAnimationFrame(step);
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  private stopContinuousScroll(): void {
    if (this.holdTimeout) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isHolding = false;
    this.holdingDirection.set(null);
    const el = this.issuesScrollRef?.nativeElement;
    if (el) {
      el.style.scrollBehavior = '';
      this.updateScrollState();
    }
  }

  scrollIssues(direction: 'left' | 'right'): void {
    const el = this.issuesScrollRef?.nativeElement;
    if (!el) return;
    el.style.scrollBehavior = 'smooth';
    const scrollAmount = 310;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => this.updateScrollState(), 350);
  }

  loadBackendIssues(silent = false): void {
    this.issuesService.getIssues().subscribe({
      next: (data) => {
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        const activeIssues = data.filter((i) => {
          if (i.status === 'resolved') {
            const resolvedTime = i.resolvedAt ? new Date(i.resolvedAt).getTime() : 0;
            return resolvedTime >= twentyFourHoursAgo;
          }
          return true;
        });

        if (this.isInitialLoadDone && silent) {
          for (const item of activeIssues) {
            const previous = this.knownIssuesMap.get(item.id);
            if (!previous) {
              this.triggerAlert(item.status === 'resolved' ? 'resolved' : 'created', item.title);
            } else if (previous.status === 'ongoing' && item.status === 'resolved') {
              this.triggerAlert('resolved', item.title);
            }
          }
        }

        this.knownIssuesMap.clear();
        for (const item of activeIssues) {
          this.knownIssuesMap.set(item.id, { status: item.status, title: item.title });
        }

        const hasChanged = !this.isInitialLoadDone || this.hasIssuesChanged(this.issues(), activeIssues);
        this.isInitialLoadDone = true;

        if (hasChanged) {
          this.issues.set(activeIssues);
          setTimeout(() => this.updateScrollState(), 50);
        }
      },
      error: (err: any) => console.error('Erro ao carregar ocorrências:', err)
    });
  }

  private hasIssuesChanged(current: IssueItem[], incoming: IssueItem[]): boolean {
    if (current.length !== incoming.length) return true;
    for (let i = 0; i < incoming.length; i++) {
      const a = current[i];
      const b = incoming[i];
      if (!a || !b) return true;
      if (
        a.id !== b.id ||
        a.status !== b.status ||
        a.title !== b.title ||
        a.description !== b.description ||
        a.startedAt !== b.startedAt ||
        a.resolvedAt !== b.resolvedAt
      ) {
        return true;
      }
    }
    return false;
  }

  trackById(_index: number, issue: IssueItem): number {
    return issue.id;
  }

  triggerAlert(type: 'created' | 'resolved', title: string): void {
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    if (this.alertFadeTimeout) clearTimeout(this.alertFadeTimeout);
    if (this.alertStartTimeout) clearTimeout(this.alertStartTimeout);
    if (this.restoreCardsTimeout) clearTimeout(this.restoreCardsTimeout);

    this.isRestoringCards.set(false);
    this.alertFadingOut.set(false);

    // Passo 1: Ocultar o conteúdo interno da seção com fade out (350ms)
    this.cardsFadingOut.set(true);

    // Passo 2: Exibir a tela/overlay de aviso após a transição suave de fade out dos cards
    this.alertStartTimeout = setTimeout(() => {
      this.cardsFadingOut.set(false);
      this.currentAlert.set({ type, title });

      // Passo 3: Ocultar o aviso com fade out aos 4.4s
      this.alertFadeTimeout = setTimeout(() => {
        this.alertFadingOut.set(true);
      }, 4400);

      // Passo 4: Encerrar o aviso e reexibir os cards com fade in aos 5.0s
      this.alertTimeout = setTimeout(() => {
        this.currentAlert.set(null);
        this.alertFadingOut.set(false);
        this.isRestoringCards.set(true);

        this.restoreCardsTimeout = setTimeout(() => {
          this.isRestoringCards.set(false);
          this.updateScrollState();
        }, 400);
      }, 5000);
    }, 350);
  }

  dismissAlert(): void {
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    if (this.alertFadeTimeout) clearTimeout(this.alertFadeTimeout);
    if (this.alertStartTimeout) clearTimeout(this.alertStartTimeout);
    if (this.restoreCardsTimeout) clearTimeout(this.restoreCardsTimeout);

    this.currentAlert.set(null);
    this.alertFadingOut.set(false);
    this.cardsFadingOut.set(false);
    this.isRestoringCards.set(true);

    this.restoreCardsTimeout = setTimeout(() => {
      this.isRestoringCards.set(false);
      this.updateScrollState();
    }, 400);
  }

  loadBackendNotices(): void {
    this.noticesService.getNotices().subscribe({
      next: (data) => {
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const formatted = data
          .filter((item) => {
            if (!item.isRead || !item.readAt) return true;
            return now - new Date(item.readAt).getTime() < TWENTY_FOUR_HOURS_MS;
          })
          .map((item) => ({
            id: String(item.id),
            title: item.title,
            description: item.content || '',
            read: item.isRead,
            readAt: item.readAt || null,
          }));
        this.notices.set(formatted);
      },
      error: (err: any) => console.error('Erro ao carregar recados:', err)
    });
  }

  loadBackendResponsibilities(): void {
    this.responsibilitiesService.getResponsibilities().subscribe({
      next: (data) => this.responsibilities.set(data),
      error: (err: any) => console.error('Erro ao carregar matriz de responsabilidades:', err)
    });
  }

  markNoticeAsRead(id: string): void {
    this.noticesService.markAsRead(id).subscribe({
      next: () => {
        const nowIso = new Date().toISOString();
        this.notices.update(items =>
          items.map(n => (n.id === id ? { ...n, read: true, readAt: nowIso } : n))
        );

        if (this.activeModal()?.noticeId === id) {
          this.activeModal.update(modal => (modal ? { ...modal, isRead: true } : null));
        }
      },
      error: (err: any) => console.error('Erro ao marcar como lido no banco:', err)
    });
  }

  @HostListener('document:keydown.escape')
  onKeydownHandler(): void {
    if (this.activeModal()) {
      this.closeModal();
    }
  }

  openIssueModal(issue: IssueItem): void {
    this.activeModal.set({
      title: issue.title,
      description: issue.description,
      badge: issue.status === 'ongoing' ? 'Problema Ocorrendo' : 'Problema Resolvido',
      statusClass: issue.status
    });
  }

  openNoticeModal(notice: NoticeItem): void {
    this.activeModal.set({
      title: notice.title,
      description: notice.description,
      noticeId: notice.id,
      isRead: notice.read
    });
  }

  closeModal(): void {
    this.activeModal.set(null);
  }
}