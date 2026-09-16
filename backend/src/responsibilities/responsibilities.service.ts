import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Responsibility } from './entities/responsibility.entity';
import { CreateResponsibilityDto } from './dto/create-responsibility.dto';
import { UpdateResponsibilityDto } from './dto/update-responsibility.dto';

@Injectable()
export class ResponsibilitiesService {
  constructor(
    @InjectRepository(Responsibility)
    private readonly responsibilityRepository: Repository<Responsibility>,
  ) {}

  async findAll(city?: string, sector?: string): Promise<Responsibility[]> {
    const query = this.responsibilityRepository
      .createQueryBuilder('resp')
      .orderBy('resp.city', 'ASC')
      .addOrderBy('resp.sector', 'ASC');

    if (city) {
      query.andWhere('LOWER(resp.city) LIKE LOWER(:city)', { city: `%${city}%` });
    }

    if (sector) {
      query.andWhere('LOWER(resp.sector) LIKE LOWER(:sector)', { sector: `%${sector}%` });
    }

    return await query.getMany();
  }

  async findOne(id: number): Promise<Responsibility> {
    const item = await this.responsibilityRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Responsável com ID ${id} não encontrado na matriz.`);
    }
    return item;
  }

  async create(createDto: CreateResponsibilityDto): Promise<Responsibility> {
    const item = this.responsibilityRepository.create(createDto);
    return await this.responsibilityRepository.save(item);
  }

  async update(id: number, updateDto: UpdateResponsibilityDto): Promise<Responsibility> {
    const item = await this.findOne(id);
    this.responsibilityRepository.merge(item, updateDto);
    return await this.responsibilityRepository.save(item);
  }

  async remove(id: number): Promise<{ message: string }> {
    const item = await this.findOne(id);
    await this.responsibilityRepository.remove(item);
    return { message: `Registro ${id} removido da matriz com sucesso.` };
  }
}
