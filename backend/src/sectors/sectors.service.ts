import {
  Injectable,
  OnModuleInit,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from './entities/sector.entity';
import { User } from '../users/entities/user.entity';
import { CreateSectorDto } from './dto/create-sector.dto';

export interface SectorWithCollaborators {
  id: number;
  name: string;
  collaboratorsCount: number;
  collaborators: {
    id: number;
    responsible: string;
    email?: string | null;
  }[];
  createdAt: Date;
}

@Injectable()
export class SectorsService implements OnModuleInit {
  private readonly defaultSectors = [
    'NOC',
    'Agendamento',
    'Infraestrutura',
    'Relacionamento',
    'Administração',
  ];

  private readonly legacyOldDefaults = [
    'Suporte',
    'Comercial',
    'Técnico',
    'Financeiro',
  ];

  constructor(
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    try {
      await this.seedInitialSectors();
    } catch (err) {
      console.warn('Aviso ao inicializar setores padrões:', err);
    }
  }

  private async seedInitialSectors() {
    // 1. Garante que os setores padrões existam na base
    for (const name of this.defaultSectors) {
      const exists = await this.sectorRepository
        .createQueryBuilder('s')
        .where('LOWER(s.name) = LOWER(:name)', { name })
        .getOne();

      if (!exists) {
        await this.sectorRepository.save(this.sectorRepository.create({ name }));
      }
    }

    // 2. Remove setores padrões legados que não possuem usuários vinculados
    for (const legacy of this.legacyOldDefaults) {
      const sector = await this.sectorRepository
        .createQueryBuilder('s')
        .where('LOWER(s.name) = LOWER(:name)', { name: legacy })
        .getOne();

      if (sector) {
        const userCount = await this.userRepository
          .createQueryBuilder('u')
          .where('LOWER(u.sector) = LOWER(:name)', { name: legacy })
          .getCount();

        if (userCount === 0) {
          await this.sectorRepository.remove(sector);
        }
      }
    }
  }

  async findAll(): Promise<Sector[]> {
    return await this.sectorRepository.find({
      order: { name: 'ASC' },
    });
  }

  // Lista os setores e exclusivamente os colaboradores com login e conta ativa no sistema
  async findAllWithCollaborators(): Promise<SectorWithCollaborators[]> {
    const sectors = await this.findAll();
    const activeUsers = await this.userRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const result = sectors.map((sector) => {
      const sName = sector.name.trim().toLowerCase();
      const matchedUsers = activeUsers.filter(
        (u) => (u.sector || '').trim().toLowerCase() === sName,
      );

      return {
        id: sector.id,
        name: sector.name,
        collaboratorsCount: matchedUsers.length,
        collaborators: matchedUsers.map((u) => ({
          id: u.id,
          responsible: u.name,
          email: u.email,
        })),
        createdAt: sector.createdAt,
      };
    });

    // Ordenação decrescente pela quantidade de colaboradores vinculados
    return result.sort((a, b) => {
      if (b.collaboratorsCount !== a.collaboratorsCount) {
        return b.collaboratorsCount - a.collaboratorsCount;
      }
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }

  async findOne(id: number): Promise<Sector> {
    const sector = await this.sectorRepository.findOne({ where: { id } });
    if (!sector) {
      throw new NotFoundException(`Setor com ID ${id} não encontrado.`);
    }
    return sector;
  }

  async create(createDto: CreateSectorDto): Promise<Sector> {
    const trimmedName = createDto.name.trim();

    if (!trimmedName) {
      throw new BadRequestException('O nome do setor não pode ser vazio.');
    }

    const existing = await this.sectorRepository
      .createQueryBuilder('s')
      .where('LOWER(s.name) = LOWER(:name)', { name: trimmedName })
      .getOne();

    if (existing) {
      throw new ConflictException(`O setor "${trimmedName}" já está cadastrado.`);
    }

    const newSector = this.sectorRepository.create({ name: trimmedName });
    return await this.sectorRepository.save(newSector);
  }

  async remove(id: number): Promise<{ message: string }> {
    const sector = await this.findOne(id);

    const linkedUserCount = await this.userRepository
      .createQueryBuilder('u')
      .where('LOWER(u.sector) = LOWER(:name)', { name: sector.name })
      .getCount();

    if (linkedUserCount > 0) {
      throw new BadRequestException(
        `Não é possível remover o setor "${sector.name}" pois existem ${linkedUserCount} usuário(s) com conta no sistema vinculado(s) a ele.`,
      );
    }

    await this.sectorRepository.remove(sector);
    return { message: `Setor "${sector.name}" removido com sucesso.` };
  }
}
