import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    //Português - Importa o "UsersModule" para permitir que o "AuthService" use o "UsersService".
    UsersModule,
    //Português - Registra o Passport com a estratégia padrão "jwt".
    PassportModule.register({ defaultStrategy: 'jwt' }),
    //Português - Configura a assinatura de tokens JWT.
    JwtModule.register({
      //Português - Chave de assinatura do Token.
      secret: 'CHAVE_SECRETA_SUPER_SEGURA_AMPER_HUB', 
      //Português - Tempo de validade do token (8 horas de expediente).
      signOptions: { expiresIn: '8h' }, 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}