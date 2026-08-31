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
  ) {}

  async create(createNoticeDto: CreateNoticeDto, author: User): Promise<Notice> {
    const newNotice = this.noticeRepository.create({
      ...createNoticeDto,
      author,
    });
    return await this.noticeRepository.save(newNotice);
  }

  // Lista todos os recados e marca se o usuário autenticado já os leu
  async findAll(userId?: number): Promise<any[]> {
    const notices = await this.noticeRepository.find({
      order: { createdAt: 'DESC' },
    });

    if (!userId) {
      return notices.map((n) => ({ ...n, isRead: false }));
    }

    // Busca quais avisos este usuário já leu
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

  // Registra a leitura do recado no banco de dados
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
}