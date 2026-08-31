//Português - Importa os decorators do Swagger e de validação de dados.
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  //Português - Documenta o campo de e-mail de acesso.
  @ApiProperty({
    description: 'E-mail cadastrado do usuário',
    example: 'joao.silva@ampernet.com.br',
  })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email!: string;

  //Português - Documenta a senha enviada para autenticação.
  @ApiProperty({
    description: 'Senha de acesso',
    example: 'SenhaForte@123',
  })
  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password!: string;
}