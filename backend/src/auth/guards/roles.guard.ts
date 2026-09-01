import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
//Português - Qualquer classe com essa interface precisa ter o método "canActive", que deverá liberar o acesso ou lançar uma exceção.
export class RolesGuard implements CanActivate {
  //Português - Faz a leitura dos metadados anexados pelos Decorators.
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    //Português - Lê quais papéis foram exigidos na rota ou no Controller inteiro.
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    //Português - Caso a rota não tiver "@Roles()", fará a liberação do acesso imediatamente retornando True.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    //Português - Obtém os dados do usuário autenticado que forma injetados na requisição.
    const { user } = context.switchToHttp().getRequest();

    //Português - Fará a verificação de duas situações: Usuário não existe na requisição e papel do usuário não está presente na lista de papéis permitidos.
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Você não possuí permissão para acessar essa função!');
    }

    //Português - Caso o papel do colaborador seja compatível, fluxo seguirá normalmente para a execução do método do Controller.
    return true;
  }
}
