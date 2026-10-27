import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  //Português - Documenta o campo de nome no Swagger com descrição e exemplo.
  @ApiProperty({
    description: 'Nome completo do colaborador (Máx: 100 caracteres)',
    example: 'João da Silva',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  name!: string;

  //Português - Documenta o campo de e-mail corporativo.
  @ApiProperty({
    description: 'E-mail de acesso ao sistema (Máx: 150 caracteres)',
    example: 'joao.silva@ampernet.com.br',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @MaxLength(150, { message: 'O e-mail deve ter no máximo 150 caracteres' })
  email!: string;

  //Português - Documenta o campo de setor/departamento.
  @ApiProperty({
    description: 'Setor / Departamento do colaborador no sistema (Máx: 100 caracteres)',
    example: 'Administração',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O setor deve ser um texto' })
  @IsNotEmpty({ message: 'O setor é obrigatório' })
  @MaxLength(100, { message: 'O setor deve ter no máximo 100 caracteres' })
  sector!: string;

  //Português - Documenta o campo de senha de acesso.
  @ApiProperty({
    description: 'Senha de acesso (Mínimo de 6 e máximo de 100 caracteres)',
    example: 'SenhaForte@123',
  })
  @IsString({ message: 'A senha deve ser um texto' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  @MaxLength(100, { message: 'A senha deve ter no máximo 100 caracteres' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password!: string;

  //Português - Documenta o nível de acesso.
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

  //Português - Status de ativação da conta.
  @ApiProperty({
    description: 'Status de ativação da conta',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'O status da conta deve ser verdadeiro ou falso' })
  isActive?: boolean;
}
