//Português - Importa o decorator do Swagger para documentar os campos aceitos no payload.
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  //Português - Documenta o campo de nome no Swagger com descrição e exemplo.
  @ApiProperty({
    description: 'Nome completo do colaborador',
    example: 'João da Silva',
  })
  name!: string;

  //Português - Documenta o campo de e-mail corporativo.
  @ApiProperty({
    description: 'E-mail de acesso ao sistema',
    example: 'joao.silva@ampernet.com.br',
  })
  email!: string;

  //Português - Documenta o campo de senha de acesso.
  @ApiProperty({
    description: 'Senha de acesso (Mínimo de 6 caracteres)',
    example: 'SenhaForte@123',
  })
  password!: string;

  //Português - Documenta o nível de acesso (Opcional no cadastro).
  @ApiProperty({
    description: 'Papel do usuário no sistema',
    example: 'user',
    required: false,
    default: 'user',
  })
  role?: string;
}