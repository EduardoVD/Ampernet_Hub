//Português - Importa os decorators do Swagger e validadores de dados.
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNoticeDto {
  //Português - Título explicativo do aviso.
  @ApiProperty({
    description: 'Título do comunicado ou aviso interno',
    example: 'Manutenção preventiva no POP Central',
  })
  @IsString({ message: 'O título deve ser um texto' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  title!: string;

  //Português - Conteúdo descritivo do comunicado.
  @ApiProperty({
    description: 'Descrição detalhada do procedimento, plantão ou ocorrência',
    example: 'A manutenção ocorrerá na madrugada de quarta-feira a partir das 02:00.',
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
