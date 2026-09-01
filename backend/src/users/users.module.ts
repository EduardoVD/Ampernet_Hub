import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  //Português - Registra a entidade User para uso do repositório neste módulo.
  imports: [TypeOrmModule.forFeature([User])],
  //Português - Define o controlador responsável pelas rotas HTTP de usuários.
  controllers: [UsersController],
  //Português - Define o serviço com a lógica de negócio.
  providers: [UsersService],
  //Português - Exporta o serviço para ser usado futuramente pelo módulo de autenticação (AuthModule).
  exports: [UsersService],
})
export class UsersModule {}