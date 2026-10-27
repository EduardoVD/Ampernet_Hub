import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectorDto {
  @ApiProperty({ example: 'Logística', description: 'Nome do setor / departamento' })
  @IsString({ message: 'O nome do setor deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O nome do setor é obrigatório.' })
  @MaxLength(100, { message: 'O nome do setor não pode exceder 100 caracteres.' })
  name!: string;
}

