import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssuesService, IssueItem } from '../../core/services/issues';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';
import { ConfirmService } from '../../core/services/confirm';

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issues.html',
  styleUrls: ['./issues.scss'],
})
export class Issues implements OnInit {
  private issuesService = inject(IssuesService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  currentUser = this.authService.currentUser;
  issues = signal<IssueItem[]>([]);
  activeFilter = signal<'all' | 'ongoing' | 'resolved'>('all');

  canManage = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'supervisor';
  });

  filteredIssues = computed(() => {
    const filter = this.activeFilter();
    const list = this.issues();
    if (filter === 'all') return list;
    return list.filter((i) => i.status === filter);
  });

  isModalOpen = signal(false);
  editingIssueId = signal<number | null>(null);
  issueTitle = signal('');
  issueDescription = signal('');
  issueStatus = signal<'ongoing' | 'resolved'>('ongoing');
  issueStartedAt = signal('');
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadIssues();
  }

  loadIssues(): void {
    this.issuesService.getIssues().subscribe({
      next: (data) => this.issues.set(data),
      error: (err) => console.error('Erro ao carregar ocorrências:', err),
    });
  }

  setFilter(filter: 'all' | 'ongoing' | 'resolved'): void {
    this.activeFilter.set(filter);
  }

  openCreateModal(): void {
    this.editingIssueId.set(null);
    this.issueTitle.set('');
    this.issueDescription.set('');
    this.issueStatus.set('ongoing');

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    this.issueStartedAt.set(now.toISOString().slice(0, 16));

    this.isModalOpen.set(true);
  }

  openEditModal(issue: IssueItem, event?: Event): void {
    if (event) event.stopPropagation();

    this.editingIssueId.set(issue.id);
    this.issueTitle.set(issue.title);
    this.issueDescription.set(issue.description);
    this.issueStatus.set(issue.status);

    if (issue.startedAt) {
      const d = new Date(issue.startedAt);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      this.issueStartedAt.set(d.toISOString().slice(0, 16));
    }

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingIssueId.set(null);
  }

  submitIssue(): void {
    if (!this.issueTitle().trim() || !this.issueDescription().trim()) {
      this.toastService.warning('Por favor, preencha o título e a descrição da ocorrência.', 'Campos Obrigatórios');
      return;
    }

    this.isSubmitting.set(true);
    const id = this.editingIssueId();

    const payload = {
      title: this.issueTitle().trim(),
      description: this.issueDescription().trim(),
      status: this.issueStatus(),
      startedAt: this.issueStartedAt()
        ? new Date(this.issueStartedAt()).toISOString()
        : new Date().toISOString(),
    };

    if (id) {
      this.issuesService.updateIssue(id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadIssues();
          this.toastService.success('Ocorrência atualizada com sucesso!', 'Ocorrências');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Erro ao atualizar ocorrência:', err);
          this.toastService.error('Erro ao atualizar ocorrência. Verifique suas permissões.', 'Acesso Negado');
        },
      });
    } else {
      this.issuesService.createIssue(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadIssues();
          this.toastService.success('Ocorrência registrada com sucesso!', 'Registrado');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Erro ao cadastrar ocorrência:', err);
          this.toastService.error('Erro ao cadastrar ocorrência. Verifique suas permissões.', 'Acesso Negado');
        },
      });
    }
  }

  resolveIssue(issue: IssueItem, event?: Event): void {
    if (event) event.stopPropagation();

    this.confirmService.confirm({
      title: 'Marcar Ocorrência como Resolvida',
      message: `Deseja registrar o encerramento da ocorrência "${issue.title}" no horário atual?`,
      confirmText: 'Sim, Marcar Resolvida',
      cancelText: 'Cancelar',
      type: 'primary'
    }).then((confirmed) => {
      if (confirmed) {
        this.issuesService.resolveIssue(issue.id).subscribe({
          next: () => {
            this.loadIssues();
            this.toastService.success(`Ocorrência "${issue.title}" marcada como resolvida!`, 'Resolvido');
          },
          error: (err) => {
            console.error('Erro ao resolver ocorrência:', err);
            this.toastService.error('Não foi possível resolver a ocorrência.', 'Erro');
          },
        });
      }
    });
  }

  deleteIssue(issue: IssueItem, event?: Event): void {
    if (event) event.stopPropagation();

    this.confirmService.confirm({
      title: 'Excluir Ocorrência',
      message: `Tem certeza que deseja remover permanentemente a ocorrência "${issue.title}"?`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.issuesService.deleteIssue(issue.id).subscribe({
          next: () => {
            this.issues.update((list) => list.filter((i) => i.id !== issue.id));
            this.toastService.success('Ocorrência removida com sucesso.', 'Removido');
          },
          error: (err) => {
            console.error('Erro ao excluir ocorrência:', err);
            this.toastService.error('Não foi possível excluir a ocorrência.', 'Erro');
          },
        });
      }
    });
  }
}
