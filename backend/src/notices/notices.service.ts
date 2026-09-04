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

  //Português - Lista todos os recados e marca se o usuário autenticado já os leu.
  async findAll(userId?: number): Promise<any[]> {
    const notices = await this.noticeRepository.find({
      order: { createdAt: 'DESC' },
    });

    if (!userId) {
      return notices.map((n) => ({ ...n, isRead: false }));
    }

    //Português - Busca quais avisos este usuário já leu.
    const userReads = await this.noticeReadRepository.find({
      where: { user: { id: userId } },
      relations: { notice: true },
    });

    const readNoticeIds = new Set(userReads.map((r) => r.notice?.id));

    return notices.map((notice) => ({
      ...notice,
      isRead: readNoticeIds.has(notice.id),
    }));
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
    await this.noticeRepository.remove(notice);
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