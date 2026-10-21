import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateResponsibilityDto {
  @ApiProperty({
    description: 'Setor ou equipe responsável (Máx: 100 caracteres)',
    example: 'NOC',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O setor deve ser um texto' })
  @IsNotEmpty({ message: 'O setor é obrigatório' })
  @MaxLength(100, { message: 'O setor deve ter no máximo 100 caracteres' })
  sector!: string;

  @ApiProperty({
    description: 'Cidade de atuação (Máx: 100 caracteres)',
    example: 'Fortaleza',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'A cidade deve ser um texto' })
  @IsNotEmpty({ message: 'A cidade é obrigatória' })
  @MaxLength(100, { message: 'A cidade deve ter no máximo 100 caracteres' })
  city!: string;

  @ApiProperty({
    description: 'Nome do colaborador responsável (Máx: 150 caracteres)',
    example: 'Carlos Lima',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O nome do responsável deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do responsável é obrigatório' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres' })
  responsible!: string;

  @ApiProperty({
    description: 'Número do ramal interno (Máx: 50 caracteres)',
    example: '4002',
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'O ramal deve ser um texto' })
  @MaxLength(50, { message: 'O ramal deve ter no máximo 50 caracteres' })
  ramal?: string;

  @ApiProperty({
    description: 'E-mail para contato com o responsável (Máx: 150 caracteres)',
    example: 'carlos.lima@ampernet.com.br',
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @MaxLength(150, { message: 'O e-mail deve ter no máximo 150 caracteres' })
  email?: string;
}
