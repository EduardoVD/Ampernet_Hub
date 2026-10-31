import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { NoticeRead } from './entities/notice-read.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(NoticeRead)
    private readonly noticeReadRepository: Repository<NoticeRead>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createNoticeDto: CreateNoticeDto, author: User): Promise<Notice> {
    const newNotice = this.noticeRepository.create({
      ...createNoticeDto,
      author,
    });
    return await this.noticeRepository.save(newNotice);
  }

  //Português - Lista todos os recados ativos para o usuário autenticado.
  // Regra de expiração individual:
  // - Recados não lidos permanecem visíveis indefinidamente.
  // - Recados lidos permanecem visíveis por 24 horas a partir da confirmação de leitura individual (readAt).
  async findAll(userId?: number, limit = 100): Promise<any[]> {
    const fetchLimit = limit > 0 ? Math.max(limit, 200) : 200;
    const notices = await this.noticeRepository.find({
      order: { createdAt: 'DESC' },
      take: fetchLimit,
    });

    if (!userId) {
      return notices.map((n) => ({ ...n, isRead: false, readAt: null }));
    }

    //Português - Busca quais avisos este usuário já leu com data de leitura.
    const userReads = await this.noticeReadRepository.find({
      where: { user: { id: userId } },
      relations: { notice: true },
    });

    const readMap = new Map<number, Date>();
    for (const r of userReads) {
      if (r.notice?.id) {
        readMap.set(r.notice.id, r.readAt);
      }
    }

    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    // Filtra os recados:
    // Se o usuário não leu, permanece visível indefinidamente.
    // Se leu, só permanece visível nas primeiras 24 horas após a leitura.
    const visibleNotices = notices.filter((notice) => {
      const readAt = readMap.get(notice.id);
      if (!readAt) {
        return true;
      }
      const timeSinceRead = now - new Date(readAt).getTime();
      return timeSinceRead < TWENTY_FOUR_HOURS_MS;
    });

    return visibleNotices.map((notice) => {
      const readAt = readMap.get(notice.id);
      return {
        ...notice,
        isRead: !!readAt,
        readAt: readAt ? readAt.toISOString() : null,
      };
    });
  }

  async findOne(id: number): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException(`Recado com ID ${id} não encontrado.`);
    }
    return notice;
  }

  //Português - Registra a leitura do recado no banco de dados.
  async markAsRead(noticeId: number, user: User): Promise<{ message: string }> {
    const notice = await this.findOne(noticeId);

    const existingRead = await this.noticeReadRepository.findOne({
      where: {
        notice: { id: notice.id },
        user: { id: user.id },
      },
    });

    if (!existingRead) {
      const read = this.noticeReadRepository.create({ notice, user });
      await this.noticeReadRepository.save(read);
    }

    return { message: 'Aviso marcado como lido com sucesso.' };
  }

  async update(id: number, updateNoticeDto: UpdateNoticeDto): Promise<Notice> {
    const notice = await this.findOne(id);
    this.noticeRepository.merge(notice, updateNoticeDto);
    return await this.noticeRepository.save(notice);
  }

  async remove(id: number): Promise<{ message: string }> {
    const notice = await this.findOne(id);
    await this.noticeRepository.softRemove(notice);
    return { message: `Recado ${id} removido com sucesso.` };
  }

  async getReadStatus(noticeId: number) {
    const notice = await this.findOne(noticeId);

    const activeUsers = await this.userRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const reads = await this.noticeReadRepository.find({
      where: { notice: { id: notice.id } },
      relations: { user: true },
      order: { readAt: 'DESC' },
    });

    const readMap = new Map<number, Date>();
    for (const r of reads) {
      if (r.user) {
        readMap.set(r.user.id, r.readAt);
      }
    }

    const readers: Array<{ id: number; name: string; email: string; readAt: Date }> = [];
    const pending: Array<{ id: number; name: string; email: string}> = [];

    for (const user of activeUsers) {
      if (readMap.has(user.id)) {
        readers.push({
          id: user.id,
          name: user.name,
          email: user.email,
          readAt: readMap.get(user.id)!,
        });
      } else {
        pending.push({
          id: user.id,
          name: user.name,
          email: user.email,
        });
      }
    }

    const totalUsers = activeUsers.length;
    const readCount = readers.length;
    const pendingCount = pending.length;
    const percentage = totalUsers > 0 ? Math.round(readCount / totalUsers * 100) : 0;

    return {
      noticeId: notice.id,
      noticeTitle: notice.title,
      totalUsers,
      readCount,
      pendingCount,
      percentage,
      readers,
      pending,
    };
  }
}