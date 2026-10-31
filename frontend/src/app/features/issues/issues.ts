import { Component, OnInit, OnDestroy, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { IssuesService, IssueItem } from '../../core/services/issues';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';
import { ConfirmService } from '../../core/services/confirm';
import { LayoutService } from '../../core/services/layout.service';
import { EmptyStateComponent } from '../../core/components/empty-state/empty-state.component';

export interface IssueAlert {
  type: 'created' | 'resolved';
  title: string;
}

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, RouterLink],
  templateUrl: './issues.html',
  styleUrls: ['./issues.scss'],
})
export class Issues implements OnInit, OnDestroy {
  private issuesService = inject(IssuesService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private layoutService = inject(LayoutService);

  currentUser = this.authService.currentUser;
  isTvMode = this.layoutService.isTvMode;
  issues = signal<IssueItem[]>([]);
  activeFilter = signal<'all' | 'ongoing' | 'resolved'>('all');

  // Estado do Overlay de Alerta em tempo real e transição de visibilidade
  currentAlert = signal<IssueAlert | null>(null);
  alertFadingOut = signal(false);
  cardsFadingOut = signal(false);
  isRestoringCards = signal(false);

  private alertTimeout: any = null;
  private alertFadeTimeout: any = null;
  private alertStartTimeout: any = null;
  private restoreCardsTimeout: any = null;
  private pollingSub?: Subscription;
  private knownIssuesMap = new Map<number, { status: string; title: string }>();
  private isInitialLoadDone = false;

  canManage = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'supervisor';
  });

  filteredIssues = computed(() => {
    const filter = this.activeFilter();
    const list = this.issues();
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Regra de expiração automática: problemas resolvidos permanecem na tela ativa por até 24 horas
    const activeList = list.filter((i) => {
      if (i.status === 'resolved') {
        const resolvedTime = i.resolvedAt ? new Date(i.resolvedAt).getTime() : 0;
        return resolvedTime >= twentyFourHoursAgo;
      }
      return true;
    });

    if (filter === 'all') return activeList;
    return activeList.filter((i) => i.status === filter);
  });

  isModalOpen = signal(false);
  editingIssueId = signal<number | null>(null);
  issueTitle = signal('');
  issueDescription = signal('');
  issueStatus = signal<'ongoing' | 'resolved'>('ongoing');
  issueStartedAt = signal('');
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadIssues(false);
    this.pollingSub = interval(6000).subscribe(() => {
      this.loadIssues(true);
    });
  }

  loadIssues(silent = false): void {
    this.issuesService.getIssues().subscribe({
      next: (data) => {
        if (this.isInitialLoadDone && silent) {
          for (const item of data) {
            const previous = this.knownIssuesMap.get(item.id);
            if (!previous) {
              this.triggerAlert(item.status === 'resolved' ? 'resolved' : 'created', item.title);
            } else if (previous.status === 'ongoing' && item.status === 'resolved') {
              this.triggerAlert('resolved', item.title);
            }
          }
        }

        this.knownIssuesMap.clear();
        for (const item of data) {
          this.knownIssuesMap.set(item.id, { status: item.status, title: item.title });
        }

        const hasChanged = !this.isInitialLoadDone || this.hasDataChanged(this.issues(), data);
        this.isInitialLoadDone = true;

        // Atualiza o estado da lista apenas se houver alterações reais,
        // evitando re-renderizações e flickers na interface durante o background polling
        if (hasChanged) {
          this.issues.set(data);
        }
      },
      error: (err) => console.error('Erro ao carregar ocorrências:', err),
    });
  }

  private hasDataChanged(current: IssueItem[], incoming: IssueItem[]): boolean {
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

    // Passo 1: Ocultar os cards com fade out
    this.cardsFadingOut.set(true);

    // Rola para o topo para garantir enquadramento limpo da área de conteúdo
    const pageEl = document.querySelector('.issues-page');
    if (pageEl) {
      pageEl.scrollTop = 0;
    }

    // Passo 2: Exibir a tela/overlay de aviso após a transição suave de fade out dos cards (350ms)
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
    }, 400);
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
          if (payload.status === 'resolved') {
            this.triggerAlert('resolved', payload.title);
          }
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
          this.triggerAlert(payload.status === 'resolved' ? 'resolved' : 'created', payload.title);
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
            this.triggerAlert('resolved', issue.title);
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

  toggleTvMode(): void {
    this.layoutService.toggleTvMode();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isTvMode() && !this.isModalOpen()) {
      this.layoutService.setTvMode(false);
    }
  }

  ngOnDestroy(): void {
    this.layoutService.setTvMode(false);
    this.pollingSub?.unsubscribe();
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    if (this.alertFadeTimeout) clearTimeout(this.alertFadeTimeout);
    if (this.alertStartTimeout) clearTimeout(this.alertStartTimeout);
    if (this.restoreCardsTimeout) clearTimeout(this.restoreCardsTimeout);
  }

  getTvDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  }

  getTvDuration(issue: IssueItem): string {
    if (!issue.startedAt) return '-';
    const start = new Date(issue.startedAt).getTime();
    const end = issue.status === 'resolved' && issue.resolvedAt
      ? new Date(issue.resolvedAt).getTime()
      : Date.now();
    const diffMs = Math.max(0, end - start);
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
  }

  getTvDepartment(issue: IssueItem): string {
    return issue.author?.sector || 'Geral';
  }
}
