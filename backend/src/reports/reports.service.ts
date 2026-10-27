import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Issue } from '../issues/entities/issue.entity';
import { Notice } from '../notices/entities/notice.entity';
import { NoticeRead } from '../notices/entities/notice-read.entity';
import { User } from '../users/entities/user.entity';
import { IssuesReportQueryDto } from './dto/issues-report-query.dto';
import { NoticesReportQueryDto } from './dto/notices-report-query.dto';
import { IssueStatus } from '../issues/enums/issue-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(NoticeRead)
    private readonly noticeReadRepository: Repository<NoticeRead>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private formatDateBoundary(dateStr: string, isEnd = false): string {
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
    return isEnd ? `${cleanDate} 23:59:59` : `${cleanDate} 00:00:00`;
  }

  async getIssuesReport(query: IssuesReportQueryDto, isPrivileged = false) {
    const qb = this.issueRepository.createQueryBuilder('issue')
      .leftJoinAndSelect('issue.author', 'author')
      .orderBy('issue.startedAt', 'DESC');

    if (isPrivileged && query.includeDeleted) {
      qb.withDeleted();
    }

    // Tratamento de fuso de banco: aplica limite exato de início e fim no dia
    if (query.startDate) {
      const start = this.formatDateBoundary(query.startDate, false);
      qb.andWhere('issue.startedAt >= :start', { start });
    }

    if (query.endDate) {
      const end = this.formatDateBoundary(query.endDate, true);
      qb.andWhere('issue.startedAt <= :end', { end });
    }

    if (query.status) {
      qb.andWhere('issue.status = :status', { status: query.status });
    }

    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(issue.title) LIKE :term OR LOWER(issue.description) LIKE :term OR LOWER(author.name) LIKE :term OR LOWER(author.sector) LIKE :term)',
        { term },
      );
    }

    // Teto de segurança para evitar estouro de memória em datasets massivos
    qb.take(1000);

    const items = await qb.getMany();

    // Cálculo de métricas analíticas (KPIs)
    let resolvedCount = 0;
    let ongoingCount = 0;
    let totalResolutionMinutes = 0;
    let longestResolutionMinutes = 0;

    const formattedItems = items.map((issue) => {
      let durationMinutes: number | null = null;
      let durationFormatted = 'Em andamento';

      const started = new Date(issue.startedAt);
      const isResolved = issue.status === IssueStatus.RESOLVED;

      if (isResolved) {
        resolvedCount++;
        const end = issue.resolvedAt ? new Date(issue.resolvedAt) : new Date(issue.updatedAt);
        const diffMs = Math.max(0, end.getTime() - started.getTime());
        durationMinutes = Math.floor(diffMs / 60000);
        totalResolutionMinutes += durationMinutes;

        if (durationMinutes > longestResolutionMinutes) {
          longestResolutionMinutes = durationMinutes;
        }

        const hours = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;
        durationFormatted = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
      } else {
        ongoingCount++;
        const diffMs = Math.max(0, Date.now() - started.getTime());
        const totalMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        durationFormatted = hours > 0 ? `${hours}h ${mins}min (Decorrido)` : `${mins}min (Decorrido)`;
      }

      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        startedAt: issue.startedAt,
        resolvedAt: issue.resolvedAt,
        durationMinutes,
        durationFormatted,
        isDeleted: !!issue.deletedAt,
        deletedAt: issue.deletedAt,
        author: issue.author
          ? {
              id: issue.author.id,
              name: issue.author.name,
              email: issue.author.email,
              sector: issue.author.sector || 'Não informado',
            }
          : null,
        createdAt: issue.createdAt,
      };
    });

    const total = items.length;
    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
    const avgResolutionTimeMinutes = resolvedCount > 0 ? Math.round(totalResolutionMinutes / resolvedCount) : 0;

    const avgHours = Math.floor(avgResolutionTimeMinutes / 60);
    const avgMins = avgResolutionTimeMinutes % 60;
    const avgResolutionTimeFormatted = resolvedCount > 0
      ? (avgHours > 0 ? `${avgHours}h ${avgMins}min` : `${avgMins}min`)
      : '0min';

    const longHours = Math.floor(longestResolutionMinutes / 60);
    const longMins = longestResolutionMinutes % 60;
    const longestResolutionFormatted = resolvedCount > 0
      ? (longHours > 0 ? `${longHours}h ${longMins}min` : `${longMins}min`)
      : '0min';

    return {
      items: formattedItems,
      stats: isPrivileged
        ? {
            total,
            resolved: resolvedCount,
            ongoing: ongoingCount,
            resolutionRate,
            avgResolutionTimeMinutes,
            avgResolutionTimeFormatted,
            longestResolutionMinutes,
            longestResolutionFormatted,
          }
        : null,
    };
  }

  async getNoticesReport(query: NoticesReportQueryDto, isPrivileged = false) {
    const qb = this.noticeRepository.createQueryBuilder('notice')
      .leftJoinAndSelect('notice.author', 'author')
      .orderBy('notice.createdAt', 'DESC');

    if (isPrivileged && query.includeDeleted) {
      qb.withDeleted();
    }

    // Tratamento de fuso de banco: aplica limite exato de início e fim no dia
    if (query.startDate) {
      const start = this.formatDateBoundary(query.startDate, false);
      qb.andWhere('notice.createdAt >= :start', { start });
    }

    if (query.endDate) {
      const end = this.formatDateBoundary(query.endDate, true);
      qb.andWhere('notice.createdAt <= :end', { end });
    }

    if (query.category && query.category !== 'all') {
      qb.andWhere('notice.category = :category', { category: query.category });
    }

    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(notice.title) LIKE :term OR LOWER(notice.content) LIKE :term OR LOWER(author.name) LIKE :term)',
        { term },
      );
    }

    // Teto de segurança para evitar estouro de memória em datasets massivos
    qb.take(1000);

    const notices = await qb.getMany();

    if (!isPrivileged) {
      const formattedNotices = notices.map((notice) => ({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        category: notice.category || 'Geral',
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
        isDeleted: !!notice.deletedAt,
        deletedAt: notice.deletedAt,
        author: notice.author ? { id: notice.author.id, name: notice.author.name, email: notice.author.email } : null,
        readCount: 0,
        totalUsers: 0,
        readPercentage: 0,
      }));

      return {
        items: formattedNotices,
        stats: null,
      };
    }

    const totalActiveUsers = await this.userRepository.count({ where: { isActive: true } });

    // Obter leituras de cada aviso (apenas para Admin e Supervisor)
    const reads = await this.noticeReadRepository.createQueryBuilder('read')
      .leftJoinAndSelect('read.notice', 'notice')
      .leftJoinAndSelect('read.user', 'user')
      .getMany();

    const readCountMap = new Map<number, number>();
    for (const r of reads) {
      if (r.notice?.id) {
        readCountMap.set(r.notice.id, (readCountMap.get(r.notice.id) || 0) + 1);
      }
    }

    let totalReadsAcrossPeriod = 0;
    let sumPercentages = 0;
    const categoryCountMap = new Map<string, number>();

    const formattedNotices = notices.map((notice) => {
      const readCount = readCountMap.get(notice.id) || 0;
      totalReadsAcrossPeriod += readCount;

      const percentage = totalActiveUsers > 0
        ? Math.min(100, Math.round((readCount / totalActiveUsers) * 100))
        : 0;

      sumPercentages += percentage;

      const cat = notice.category || 'Geral';
      categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1);

      return {
        id: notice.id,
        title: notice.title,
        content: notice.content,
        category: cat,
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
        isDeleted: !!notice.deletedAt,
        deletedAt: notice.deletedAt,
        author: notice.author ? { id: notice.author.id, name: notice.author.name, email: notice.author.email } : null,
        readCount,
        totalUsers: totalActiveUsers,
        readPercentage: percentage,
      };
    });

    const totalNotices = notices.length;
    const avgReadPercentage = totalNotices > 0 ? Math.round(sumPercentages / totalNotices) : 0;

    const categoriesBreakdown: Array<{ category: string; count: number }> = [];
    categoryCountMap.forEach((count, category) => {
      categoriesBreakdown.push({ category, count });
    });

    return {
      items: formattedNotices,
      stats: {
        totalNotices,
        totalActiveUsers,
        totalReads: totalReadsAcrossPeriod,
        avgReadPercentage,
        categoriesBreakdown,
      },
    };
  }
}
