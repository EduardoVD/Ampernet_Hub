import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    this.loadBackendIssues();
    this.loadBackendResponsibilities();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateScrollState(), 100);
  }

  ngOnDestroy(): void {
    this.stopContinuousScroll();
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

  loadBackendIssues(): void {
    this.issuesService.getIssues().subscribe({
      next: (data) => {
        this.issues.set(data);
        setTimeout(() => this.updateScrollState(), 50);
      },
      error: (err: any) => console.error('Erro ao carregar ocorrências:', err)
    });
  }

  loadBackendNotices(): void {
    this.noticesService.getNotices().subscribe({
      next: (data) => {
        const formatted = data.map((item) => ({
          id: String(item.id),
          title: item.title,
          description: item.content || '',
          read: item.isRead
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
        this.notices.update(items =>
          items.map(n => (n.id === id ? { ...n, read: true } : n))
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