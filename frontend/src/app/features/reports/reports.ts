import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss'],
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private noticesService = inject(NoticesService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  currentUser = this.authService.currentUser;

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

  // Filtros Temporais
  periodPreset = signal<'today' | '7days' | '30days' | 'month' | 'all' | 'custom'>('30days');
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
    this.applyPreset('30days', false);
    this.loadData();
  }

  setTab(tab: 'issues' | 'notices'): void {
    this.activeTab.set(tab);
    this.loadData();
  }

  applyPreset(preset: 'today' | '7days' | '30days' | 'month' | 'all' | 'custom', reload = true): void {
    this.periodPreset.set(preset);
    const today = new Date();
    const formatYMD = (d: Date) => d.toISOString().slice(0, 10);

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

  exportCsv(): void {
    if (!this.canExport()) {
      this.toastService.warning('Apenas supervisores e administradores podem exportar relatórios.', 'Acesso Restrito');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    if (this.activeTab() === 'issues') {
      const data = this.issuesData();
      if (!data || !data.items.length) {
        this.toastService.warning('Nenhum registro para exportar com os filtros atuais.', 'Relatório Vazio');
        return;
      }

      const headers = [
        'ID',
        'Título',
        'Descrição',
        'Status',
        'Data Início',
        'Data Resolução',
        'Duração',
        'Operador Responsável',
        'E-mail Operador',
      ];

      const rows = data.items.map((i) => [
        i.id,
        i.title,
        i.description,
        i.status === 'resolved' ? 'Resolvido' : 'Em andamento',
        this.formatDateTime(i.startedAt),
        i.resolvedAt ? this.formatDateTime(i.resolvedAt) : 'N/A',
        i.durationFormatted,
        i.author?.name || 'Não informado',
        i.author?.email || 'N/A',
      ]);

      this.reportsService.exportToCsv(`Relatorio_Ocorrencias_AmperHub_${todayStr}`, headers, rows);
      this.toastService.success('Relatório de ocorrências baixado com sucesso em CSV!', 'Exportação Concluída');
    } else {
      const data = this.noticesData();
      if (!data || !data.items.length) {
        this.toastService.warning('Nenhum comunicado para exportar com os filtros atuais.', 'Relatório Vazio');
        return;
      }

      const headers = [
        'ID',
        'Título',
        'Categoria',
        'Conteúdo',
        'Data Publicação',
        'Autor',
        'Leituras Confirmadas',
        'Total Colaboradores',
        '% Adesão',
      ];

      const rows = data.items.map((n) => [
        n.id,
        n.title,
        n.category,
        n.content,
        this.formatDateTime(n.createdAt),
        n.author?.name || 'Não informado',
        n.readCount,
        n.totalUsers,
        `${n.readPercentage}%`,
      ]);

      this.reportsService.exportToCsv(`Relatorio_Comunicados_AmperHub_${todayStr}`, headers, rows);
      this.toastService.success('Relatório de comunicados baixado com sucesso em CSV!', 'Exportação Concluída');
    }
  }

  printReport(): void {
    if (!this.canExport()) {
      this.toastService.warning('Apenas supervisores e administradores podem imprimir relatórios.', 'Acesso Restrito');
      return;
    }
    window.print();
  }

  formatDateTime(isoDate?: string | null): string {
    if (!isoDate) return '—';
    const d = new Date(isoDate);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
}
