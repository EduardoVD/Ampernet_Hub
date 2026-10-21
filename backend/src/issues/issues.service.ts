import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueStatus } from './enums/issue-status.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
  ) {}

  async create(createIssueDto: CreateIssueDto, author?: User): Promise<Issue> {
    const startedAt = createIssueDto.startedAt
      ? new Date(createIssueDto.startedAt)
      : new Date();

    let resolvedAt: Date | null = null;
    if (createIssueDto.status === IssueStatus.RESOLVED) {
      resolvedAt = createIssueDto.resolvedAt
        ? new Date(createIssueDto.resolvedAt)
        : new Date();

      if (resolvedAt < startedAt) {
        throw new BadRequestException(
          'A data de término não pode ser anterior à data de início da ocorrência.',
        );
      }
    }

    const issue = this.issueRepository.create({
      title: createIssueDto.title,
      description: createIssueDto.description,
      status: createIssueDto.status || IssueStatus.ONGOING,
      startedAt,
      resolvedAt,
      author,
    });

    return await this.issueRepository.save(issue);
  }

  async findAll(status?: IssueStatus, limit = 100): Promise<Issue[]> {
    const query = this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.author', 'author')
      .orderBy('issue.status', 'ASC')
      .addOrderBy('issue.startedAt', 'DESC');

    if (status) {
      query.andWhere('issue.status = :status', { status });
    }

    if (limit && limit > 0) {
      query.take(limit);
    }

    return await query.getMany();
  }

  async findOne(id: number): Promise<Issue> {
    const issue = await this.issueRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!issue) {
      throw new NotFoundException(`Ocorrência com ID ${id} não encontrada.`);
    }

    return issue;
  }

  async update(id: number, updateIssueDto: UpdateIssueDto): Promise<Issue> {
    const issue = await this.findOne(id);

    if (updateIssueDto.startedAt) {
      issue.startedAt = new Date(updateIssueDto.startedAt);
    }

    if (updateIssueDto.status) {
      issue.status = updateIssueDto.status;
      if (issue.status === IssueStatus.RESOLVED) {
        if (!issue.resolvedAt) {
          issue.resolvedAt = updateIssueDto.resolvedAt
            ? new Date(updateIssueDto.resolvedAt)
            : new Date();
        }
      } else if (issue.status === IssueStatus.ONGOING) {
        issue.resolvedAt = null;
      }
    }

    if (updateIssueDto.resolvedAt !== undefined) {
      if (issue.status === IssueStatus.RESOLVED) {
        issue.resolvedAt = updateIssueDto.resolvedAt
          ? new Date(updateIssueDto.resolvedAt)
          : null;
      } else {
        issue.resolvedAt = null;
      }
    }

    // Validação cronológica: término nunca pode ser anterior ao início
    if (issue.status === IssueStatus.RESOLVED && issue.resolvedAt && issue.startedAt) {
      if (issue.resolvedAt < issue.startedAt) {
        throw new BadRequestException(
          'A data de término não pode ser anterior à data de início da ocorrência.',
        );
      }
    }

    if (updateIssueDto.title) {
      issue.title = updateIssueDto.title;
    }

    if (updateIssueDto.description) {
      issue.description = updateIssueDto.description;
    }

    return await this.issueRepository.save(issue);
  }

  async resolve(id: number): Promise<Issue> {
    const issue = await this.findOne(id);
    // Caso de borda: idempotência e proteção contra concorrência (não sobrescreve resolução histórica)
    if (issue.status === IssueStatus.RESOLVED) {
      return issue;
    }
    issue.status = IssueStatus.RESOLVED;
    issue.resolvedAt = new Date();
    return await this.issueRepository.save(issue);
  }

  async remove(id: number): Promise<{ message: string }> {
    const issue = await this.findOne(id);
    await this.issueRepository.softRemove(issue);
    return { message: `Ocorrência ${id} removida com sucesso.` };
  }
}
