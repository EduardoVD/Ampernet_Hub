import { Component, OnInit, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { NoticesService } from '../../core/services/notices';

export interface IssueItem {
  id: string;
  title: string;
  description: string;
  status: 'ongoing' | 'resolved';
}

export interface NoticeItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
}

export interface ResponsibilityItem {
  sector: string;
  city: string;
  responsible: string;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private noticesService = inject(NoticesService);

  // Usuário autenticado vindo do backend
  currentUser = this.authService.currentUser;

  cityFilter = signal('');
  sectorFilter = signal('');

  issues = signal<IssueItem[]>([]);
  notices = signal<NoticeItem[]>([]);

  responsibilities = signal<ResponsibilityItem[]>([
    { sector: 'NOC', city: 'Fortaleza', responsible: 'Carlos Lima' },
    { sector: 'Suporte', city: 'Caucaia', responsible: 'Ana Souza' },
    { sector: 'Comercial', city: 'Maracanaú', responsible: 'João Ferreira' },
    { sector: 'Técnico', city: 'Sobral', responsible: 'Maria Oliveira' }
  ]);

  activeModal = signal<ModalDetail | null>(null);

  filteredResponsibilities = computed(() => {
    const city = this.cityFilter().toLowerCase();
    const sector = this.sectorFilter().toLowerCase();

    return this.responsibilities().filter(item =>
      item.city.toLowerCase().includes(city) &&
      item.sector.toLowerCase().includes(sector)
    );
  });

  ngOnInit(): void {
    this.loadBackendNotices();
  }

  loadBackendNotices(): void {
    this.noticesService.getNotices().subscribe({
      next: (data) => {
        const formatted = data.map((item) => ({
          id: String(item.id),
          title: item.title,
          description: item.content || '',
          read: item.isRead // ✅ Vem direto do banco de dados
        }));
        this.notices.set(formatted);
      },
      error: (err: any) => console.error('Erro ao carregar recados:', err)
    });
  }

  markNoticeAsRead(id: string): void {
    this.noticesService.markAsRead(id).subscribe({
      next: () => {
        // Atualiza a tela em tempo real
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