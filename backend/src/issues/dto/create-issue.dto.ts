import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IssueStatus } from '../enums/issue-status.enum';

export class CreateIssueDto {
  @ApiProperty({
    description: 'Título da ocorrência ou manutenção (Máx: 150 caracteres)',
    example: 'PGO - OLT DANTAS OFFLINE',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O título deve ser um texto' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @MaxLength(150, { message: 'O título deve ter no máximo 150 caracteres' })
  title!: string;

  @ApiProperty({
    description: 'Descrição detalhada da ocorrência',
    example: 'OLT do ponto Dantas apresentou queda total de sinal...',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'A descrição deve ser um texto' })
  @IsNotEmpty({ message: 'A descrição é obrigatória' })
  @MaxLength(5000, { message: 'A descrição deve ter no máximo 5000 caracteres' })
  description!: string;

  @ApiProperty({
    description: 'Status do problema (ongoing ou resolved)',
    enum: IssueStatus,
    default: IssueStatus.ONGOING,
    required: false,
  })
  @IsOptional()
  @IsEnum(IssueStatus, { message: 'Status deve ser ongoing ou resolved' })
  status?: IssueStatus;

  @ApiProperty({
    description: 'Data e hora do início da ocorrência (formato ISO 8601 ou compatível)',
    example: '2026-08-18T09:14:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'A data de início deve ser uma string de data válida' })
  startedAt?: string;

  @ApiProperty({
    description: 'Data e hora do término da ocorrência (se já resolvido)',
    example: '2026-08-18T11:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'A data de término deve ser uma string de data válida' })
  resolvedAt?: string;
}
