//Português - Importa o decorator do Swagger para documentação dos campos.
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoticeDto {
  //Português - Título explicativo do aviso.
  @ApiProperty({
    description: 'Título do comunicado ou aviso interno',
    example: 'Manutenção preventiva no POP Central',
  })
  title!: string;

  //Português - Conteúdo descritivo do comunicado.
  @ApiProperty({
    description: 'Descrição detalhada do procedimento, plantão ou ocorrência',
    example: 'A manutenção ocorrerá na madrugada de quarta-feira a partir das 02:00.',
  })
  content!: string;

  //Português - Categoria do comunicado.
  @ApiProperty({
    description: 'Setor ou categoria do aviso',
    example: 'Plantão',
    required: false,
    default: 'Geral',
  })
  category?: string;

  //Português - Nível de urgência do aviso.
  @ApiProperty({
    description: 'Nível de prioridade do aviso (baixa, media, alta)',
    example: 'alta',
    required: false,
    default: 'media',
  })
  priority?: string;
}
