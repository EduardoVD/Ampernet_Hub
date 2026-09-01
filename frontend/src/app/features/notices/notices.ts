import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoticesService } from '../../core/services/notices';
import { AuthService } from '../../core/services/auth';

export interface NoticeDetail {
  id: string;
  title: string;
  category: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  read: boolean;
}

@Component({
  selector: 'app-notices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notices.html',
  styleUrls: ['./notices.scss']
})
export class NoticesComponent implements OnInit {
  private noticesService = inject(NoticesService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  notices = signal<NoticeDetail[]>([]);

  canManageNotices = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'supervisor';
  });

  isCreateModalOpen = signal(false);
  newNoticeTitle = signal('');
  newNoticeCategory = signal('Geral');
  newNoticeContent = signal('');
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadNotices();
  }

  loadNotices(): void {
    this.noticesService.getNotices().subscribe({
      next: (data) => {
        const formatted = data.map((item) => {
          const authorName = typeof item.author === 'object' ? item.author?.name : (item.author || 'Equipe');
          
          const createdDate = new Date(item.createdAt);
          const formattedCreated = `${createdDate.toLocaleDateString('pt-BR')} · ${createdDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

          let formattedUpdated: string | undefined = undefined;
          if (item.updatedAt && item.updatedAt !== item.createdAt) {
            const updatedDate = new Date(item.updatedAt);
            formattedUpdated = `${updatedDate.toLocaleDateString('pt-BR')} · ${updatedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
          }

          return {
            id: String(item.id),
            title: item.title,
            category: item.category || 'Geral',
            description: item.content || '',
            author: authorName,
            createdAt: formattedCreated,
            updatedAt: formattedUpdated,
            read: item.isRead ?? false
          };
        });

        this.notices.set(formatted);
      },
      error: (err: any) => console.error('Erro ao carregar recados no mural:', err)
    });
  }

  markAsRead(id: string): void {
    this.noticesService.markAsRead(id).subscribe({
      next: () => {
        this.notices.update(items =>
          items.map(item => (item.id === id ? { ...item, read: true } : item))
        );
      },
      error: (err: any) => console.error('Erro ao marcar como lido no banco:', err)
    });
  }

  openCreateModal(): void {
    this.newNoticeTitle.set('');
    this.newNoticeCategory.set('Geral');
    this.newNoticeContent.set('');
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreateNotice(): void {
    if (!this.newNoticeTitle().trim() || !this.newNoticeContent().trim()) {
      alert('Por favor, preencha o título e o conteúdo do aviso.');
      return;
    }

    this.isSubmitting.set(true);
    this.noticesService.createNotice({
      title: this.newNoticeTitle().trim(),
      content: this.newNoticeContent().trim(),
      category: this.newNoticeCategory().trim() || 'Geral'
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.loadNotices();
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        console.error('Erro ao cadastrar novo aviso:', err);
        alert('Erro ao publicar aviso. Verifique suas permissões.');
      }
    });
  }

  deleteNotice(id: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (confirm('Tem certeza que deseja excluir este aviso do mural?')) {
      this.noticesService.deleteNotice(id).subscribe({
        next: () => {
          this.notices.update(items => items.filter(item => item.id !== id));
        },
        error: (err: any) => {
          console.error('Erro ao excluir aviso:', err);
          alert('Não foi possível excluir o aviso.');
        }
      });
    }
  }
}