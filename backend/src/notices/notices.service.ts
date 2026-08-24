//Português - Importa decorators de injeção e exceções HTTP padrão do NestJS.
import { Injectable, NotFoundException } from '@nestjs/common';

//Português - Importa o decorator para injeção do repositório da entidade Notice.
import { InjectRepository } from '@nestjs/typeorm';

//Português - Importa o tipo genérico Repository do TypeORM.
import { Repository } from 'typeorm';

//Português - Importa a entidade Notice.
import { Notice } from './entities/notice.entity';

//Português - Importa os DTOs de criação e atualização de recados.
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

//Português - Importa a entidade User para associar o autor do aviso.
import { User } from '../users/entities/user.entity';

@Injectable()
export class NoticesService {
  //Português - Injeta o repositório TypeORM da tabela 'notices' no construtor.
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  //Português - Cria um novo recado vinculado ao usuário autenticado.
  async create(createNoticeDto: CreateNoticeDto, author: User): Promise<Notice> {
    const newNotice = this.noticeRepository.create({
      ...createNoticeDto,
      //Português - Associa o autor automaticamente.
      author,
    });

    return await this.noticeRepository.save(newNotice);
  }

  //Português - Lista todos os recados cadastrados, ordenados do mais recente para o mais antigo.
  async findAll(): Promise<Notice[]> {
    return await this.noticeRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  //Português - Busca um recado específico pelo ID numérico.
  async findOne(id: number): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({ where: { id } });

    //Português - Lança erro HTTP 404 caso o recado não exista.
    if (!notice) {
      throw new NotFoundException(`Recado com ID ${id} não encontrado.`);
    }

    return notice;
  }

  //Português - Atualiza as informações de um recado existente.
  async update(id: number, updateNoticeDto: UpdateNoticeDto): Promise<Notice> {
    const notice = await this.findOne(id);
    this.noticeRepository.merge(notice, updateNoticeDto);
    return await this.noticeRepository.save(notice);
  }

  //Português - Remove um recado do banco de dados.
  async remove(id: number): Promise<{ message: string }> {
    const notice = await this.findOne(id);
    await this.noticeRepository.remove(notice);
    return { message: `Recado ${id} removido com sucesso.` };
  }
}
