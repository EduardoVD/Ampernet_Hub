import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

//Português - Herda todos os campos de CreateUserDto tornando-os opcionais.
export class UpdateUserDto extends PartialType(CreateUserDto) {}