import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReportsService,
  IssueHistoryItem,
  IssueHistoryReport,
  NoticeHistoryItem,
  NoticeHistoryReport,
} from '../../core/services/reports';
import { NoticesService, NoticeReadStatusResponse } from '../../core/services/notices';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';
import { EmptyStateComponent } from '../../core/components/empty-state/empty-state.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, RouterLink],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss'],
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private noticesService = inject(NoticesService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  // Streams de busca com debounce reativo (350ms)
  private issueSearch$ = new Subject<string>();
  private noticeSearch$ = new Subject<string>();

  // Apenas Admin e Supervisor podem extrair relatórios (CSV e Impressão) e visualizar métricas/estatísticas
  canExport = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'supervisor';
  });

  canViewMetrics = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'supervisor';
  });

  activeTab = signal<'issues' | 'notices'>('issues');
  isLoading = signal(false);

  // Filtros Temporais (Personalizado como padrão direto)
  periodPreset = signal<'today' | '7days' | '30days' | 'month' | 'all' | 'custom'>('custom');
  startDate = signal('');
  endDate = signal('');

  // Filtros Ocorrências
  issueStatus = signal<'all' | 'ongoing' | 'resolved'>('all');
  issueSearch = signal('');
  includeDeletedIssues = signal(false);

  // Filtros Avisos
  noticeCategory = signal('all');
  noticeSearch = signal('');
  includeDeletedNotices = signal(false);

  // Dados carregados
  issuesData = signal<IssueHistoryReport | null>(null);
  noticesData = signal<NoticeHistoryReport | null>(null);

  // Modais de Ficha Detalhada
  inspectingIssue = signal<IssueHistoryItem | null>(null);
  inspectingNotice = signal<NoticeHistoryItem | null>(null);
  noticeReadStatus = signal<NoticeReadStatusResponse | null>(null);
  isLoadingReadStatus = signal(false);

  ngOnInit(): void {
    // Escuta de busca reativa debounced
    this.issueSearch$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadData();
      });

    this.noticeSearch$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadData();
      });

    // Detecta aba inicial via query param (?tab=notices ou ?tab=issues)
    const initialTab = this.route.snapshot.queryParamMap.get('tab');
    if (initialTab === 'notices' || initialTab === 'recados') {
      this.activeTab.set('notices');
    } else if (initialTab === 'issues' || initialTab === 'problemas') {
      this.activeTab.set('issues');
    }

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const tab = params['tab'];
      if ((tab === 'notices' || tab === 'recados') && this.activeTab() !== 'notices') {
        this.activeTab.set('notices');
        this.loadData();
      } else if ((tab === 'issues' || tab === 'problemas') && this.activeTab() !== 'issues') {
        this.activeTab.set('issues');
        this.loadData();
      }
    });

    this.applyPreset('30days', false);
    this.periodPreset.set('custom');
    this.loadData();
  }

  onIssueSearchInput(value: string): void {
    this.issueSearch.set(value);
    this.issueSearch$.next(value);
  }

  onNoticeSearchInput(value: string): void {
    this.noticeSearch.set(value);
    this.noticeSearch$.next(value);
  }

  onStartDateChange(value: string): void {
    if (this.startDate() === value) return;
    this.startDate.set(value);
    if (value && this.endDate() && value > this.endDate()) {
      this.endDate.set(value);
    }
    this.periodPreset.set('custom');
    this.loadData();
  }

  onEndDateChange(value: string): void {
    if (this.endDate() === value) return;
    this.endDate.set(value);
    if (value && this.startDate() && value < this.startDate()) {
      this.startDate.set(value);
    }
    this.periodPreset.set('custom');
    this.loadData();
  }

  onIssueStatusChange(value: 'all' | 'ongoing' | 'resolved'): void {
    this.issueStatus.set(value);
    this.loadData();
  }

  onNoticeCategoryChange(value: string): void {
    this.noticeCategory.set(value);
    this.loadData();
  }

  onIncludeDeletedIssuesChange(value: boolean): void {
    this.includeDeletedIssues.set(value);
    this.loadData();
  }

  onIncludeDeletedNoticesChange(value: boolean): void {
    this.includeDeletedNotices.set(value);
    this.loadData();
  }

  setTab(tab: 'issues' | 'notices'): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    this.loadData();
  }

  applyPreset(preset: 'today' | '7days' | '30days' | 'month' | 'all' | 'custom', reload = true): void {
    this.periodPreset.set(preset);
    const today = new Date();

    // Tratamento de fuso local: decompõe ano/mês/dia garantindo precisão mesmo após as 21h em fuso UTC-3
    const formatYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const dStr = formatYMD(today);
      this.startDate.set(dStr);
      this.endDate.set(dStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      this.startDate.set(formatYMD(past));
      this.endDate.set(formatYMD(today));
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      this.startDate.set(formatYMD(past));
      this.endDate.set(formatYMD(today));
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      this.startDate.set(formatYMD(firstDay));
      this.endDate.set(formatYMD(today));
    } else if (preset === 'all') {
      this.startDate.set('');
      this.endDate.set('');
    }

    if (reload) {
      this.loadData();
    }
  }

  loadData(): void {
    this.isLoading.set(true);

    if (this.activeTab() === 'issues') {
      this.reportsService
        .getIssuesReport({
          startDate: this.startDate() || undefined,
          endDate: this.endDate() || undefined,
          status: this.issueStatus(),
          search: this.issueSearch(),
          includeDeleted: this.includeDeletedIssues(),
        })
        .subscribe({
          next: (res) => {
            this.issuesData.set(res);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Erro ao carregar relatório de ocorrências:', err);
            this.toastService.error('Não foi possível carregar os dados de histórico.', 'Erro');
            this.isLoading.set(false);
          },
        });
    } else {
      this.reportsService
        .getNoticesReport({
          startDate: this.startDate() || undefined,
          endDate: this.endDate() || undefined,
          category: this.noticeCategory(),
          search: this.noticeSearch(),
          includeDeleted: this.includeDeletedNotices(),
        })
        .subscribe({
          next: (res) => {
            this.noticesData.set(res);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Erro ao carregar relatório de avisos:', err);
            this.toastService.error('Não foi possível carregar o histórico de avisos.', 'Erro');
            this.isLoading.set(false);
          },
        });
    }
  }

  openIssueDetails(item: IssueHistoryItem): void {
    this.inspectingIssue.set(item);
  }

  closeIssueDetails(): void {
    this.inspectingIssue.set(null);
  }

  openNoticeDetails(item: NoticeHistoryItem): void {
    this.inspectingNotice.set(item);
    if (!this.canViewMetrics()) {
      return;
    }

    this.isLoadingReadStatus.set(true);
    this.noticeReadStatus.set(null);

    this.noticesService.getReadStatus(item.id).subscribe({
      next: (status) => {
        this.noticeReadStatus.set(status);
        this.isLoadingReadStatus.set(false);
      },
      error: (err) => {
        console.error('Erro ao buscar status de leitura:', err);
        this.isLoadingReadStatus.set(false);
      },
    });
  }

  closeNoticeDetails(): void {
    this.inspectingNotice.set(null);
    this.noticeReadStatus.set(null);
  }

  printReport(): void {
    if (!this.canExport()) {
      this.toastService.warning('Apenas supervisores e administradores podem imprimir relatórios.', 'Acesso Restrito');
      return;
    }
    window.print();
  }

  formatDateTime(isoDate?: string | null): string {
    if (!isoDate) return 'Sem Resolução';
    const d = new Date(isoDate);
    const date = d.toLocaleDateString('pt-BR');
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${date} · ${time}`;
  }

  formatDate(isoDate?: string | null): string {
    if (!isoDate) return '—';
    const d = new Date(isoDate);
    return d.toLocaleDateString('pt-BR');
  }

  formatTime(isoDate?: string | null): string {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDuration(duration?: string): string {
    if (!duration) return '—';
    return duration.replace(/\(decorrido\)/gi, '(Decorrido)');
  }

  formatPeriodDisplay(): string {
    const start = this.startDate();
    const end = this.endDate();
    if (!start && !end) return 'Todo o Histórico (Sem restrição de data)';

    const formatYMDToBR = (val?: string) => {
      if (!val) return '';
      const parts = val.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return val;
    };

    if (start && end) {
      return `${formatYMDToBR(start)} até ${formatYMDToBR(end)}`;
    } else if (start) {
      return `A partir de ${formatYMDToBR(start)}`;
    } else {
      return `Até ${formatYMDToBR(end)}`;
    }
  }

  getStatusLabel(): string {
    const s = this.issueStatus();
    if (s === 'ongoing') return 'Apenas Em Andamento';
    if (s === 'resolved') return 'Apenas Resolvidos';
    return 'Todos os Status';
  }

  get currentEmissionDate(): string {
    const d = new Date();
    const date = d.toLocaleDateString('pt-BR');
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${date} às ${time}`;
  }
}
