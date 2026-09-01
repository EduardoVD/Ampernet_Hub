import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum';

//Português - Faz a definição de uma chave única constante para guardar e depois recuperar esses metadados.
export const ROLES_KEY = 'roles';
//Português - Permite utilizar a sintaxe "@Roles(...)" aceitando um ou mais papéis da enum "UserRole". 
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
