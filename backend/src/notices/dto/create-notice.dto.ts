import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateNoticeDto {
  //Português - Título explicativo do aviso.
  @ApiProperty({
    description: 'Título do comunicado ou aviso interno (Máx: 150 caracteres)',
    example: 'Mudança de Procedimento para Cancelamento',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O título deve ser um texto' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @MaxLength(150, { message: 'O título deve ter no máximo 150 caracteres' })
  title!: string;

  //Português - Conteúdo descritivo do comunicado.
  @ApiProperty({
    description: 'Descrição detalhada do procedimento, aviso ou comunicado',
    example: 'A partir de amanhã, deverá usar o ID 542 para efetuar o cancelamento no sistema.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O conteúdo deve ser um texto' })
  @IsNotEmpty({ message: 'O conteúdo é obrigatório' })
  @MaxLength(5000, { message: 'O conteúdo deve ter no máximo 5000 caracteres' })
  content!: string;

  //Português - Categoria do comunicado.
  @ApiProperty({
    description: 'Setor ou categoria do aviso (Máx: 50 caracteres)',
    example: 'Plantão',
    required: false,
    default: 'Geral',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'A categoria deve ser um texto' })
  @MaxLength(50, { message: 'A categoria deve ter no máximo 50 caracteres' })
  category?: string;
}
