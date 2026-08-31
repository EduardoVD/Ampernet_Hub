//Português - Importa decorators e exceções HTTP.
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

//Português - Importa o serviço de usuários e o DTO de login.
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    //Português - Injeta o serviço de usuários para buscar pelo e-mail.
    private readonly usersService: UsersService,
    //Português - Injeta o serviço JWT para emissão do token assinado.
    private readonly jwtService: JwtService,
  ) {}

  //Português - Método de autenticação e geração de token.
  async login(loginDto: LoginDto) {
    //Português - Busca o usuário pelo e-mail informado.
    const user = await this.usersService.findByEmail(loginDto.email);

    //Português - Valida se o usuário existe e se a conta está ativa.
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta de usuário inativa. Procure o administrador.');
    }

    //Português - Compara a senha informada com o hash salvo no banco via Bcrypt.
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    //Português - Monta o payload contendo as claims de identificação e permissão.
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    //Português - Retorna o token assinado e as informações básicas do colaborador.
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}