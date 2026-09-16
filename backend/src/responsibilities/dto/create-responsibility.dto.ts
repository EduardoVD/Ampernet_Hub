import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateResponsibilityDto {
  @ApiProperty({
    description: 'Setor ou equipe responsável',
    example: 'NOC',
  })
  @IsString({ message: 'O setor deve ser um texto' })
  @IsNotEmpty({ message: 'O setor é obrigatório' })
  sector!: string;

  @ApiProperty({
    description: 'Cidade de atuação',
    example: 'Fortaleza',
  })
  @IsString({ message: 'A cidade deve ser um texto' })
  @IsNotEmpty({ message: 'A cidade é obrigatória' })
  city!: string;

  @ApiProperty({
    description: 'Nome do colaborador responsável',
    example: 'Carlos Lima',
  })
  @IsString({ message: 'O nome do responsável deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do responsável é obrigatório' })
  responsible!: string;

  @ApiProperty({
    description: 'Número do ramal interno',
    example: '4002',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O ramal deve ser um texto' })
  ramal?: string;

  @ApiProperty({
    description: 'E-mail para contato com o responsável',
    example: 'carlos.lima@ampernet.com.br',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email?: string;
}
