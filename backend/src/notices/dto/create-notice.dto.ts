import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNoticeDto {
  //Português - Título explicativo do aviso.
  @ApiProperty({
    description: 'Título do comunicado ou aviso interno',
    example: 'Mudança de Procedimento para Cancelamento',
  })
  @IsString({ message: 'O título deve ser um texto' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  title!: string;

  //Português - Conteúdo descritivo do comunicado.
  @ApiProperty({
    description: 'Descrição detalhada do procedimento, aviso ou comunicado',
    example: 'A partir de amanhã, deverá usar o ID 542 para efetuar o cancelamento no sistema.',
  })
  @IsString({ message: 'O conteúdo deve ser um texto' })
  @IsNotEmpty({ message: 'O conteúdo é obrigatório' })
  content!: string;

  //Português - Categoria do comunicado.
  @ApiProperty({
    description: 'Setor ou categoria do aviso',
    example: 'Plantão',
    required: false,
    default: 'Geral',
  })
  @IsOptional()
  @IsString({ message: 'A categoria deve ser um texto' })
  category?: string;
}
