//Português - Importa o decorator do Swagger e os validadores de dados.
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  //Português - Documenta o campo de nome no Swagger com descrição e exemplo.
  @ApiProperty({
    description: 'Nome completo do colaborador',
    example: 'João da Silva',
  })
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name!: string;

  //Português - Documenta o campo de e-mail corporativo.
  @ApiProperty({
    description: 'E-mail de acesso ao sistema',
    example: 'joao.silva@ampernet.com.br',
  })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email!: string;

  //Português - Documenta o campo de senha de acesso.
  @ApiProperty({
    description: 'Senha de acesso (Mínimo de 6 caracteres)',
    example: 'SenhaForte@123',
  })
  @IsString({ message: 'A senha deve ser um texto' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password!: string;

  //Português - Documenta o nível de acesso (Opcional no cadastro).
  @ApiProperty({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    example: UserRole.USER,
    required: false,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Papel de usuário inválido' })
  role?: UserRole;
}