//Português - Importa o decorator do Swagger para documentar os campos aceitos no login.
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  //Português - Documenta o campo de e-mail de acesso.
  @ApiProperty({
    description: 'E-mail cadastrado do usuário',
    example: 'joao.silva@ampernet.com.br',
  })
  email!: string;

  //Português - Documenta a senha enviada para autenticação.
  @ApiProperty({
    description: 'Senha de acesso',
    example: 'SenhaForte@123',
  })
  password!: string;
}