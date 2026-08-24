//Português - Importa o decorator Module do NestJS.
import { Module } from '@nestjs/common';

///Português - Importa o TypeOrmModule para disponibilizar repositórios de entidades.
import { TypeOrmModule } from '@nestjs/typeorm';

///Português - Importa o serviço de usuários.
import { UsersService } from './users.service';

///Português - Importa o controlador de usuários.
import { UsersController } from './users.controller';

///Português - Importa a entidade User recém-criada.
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