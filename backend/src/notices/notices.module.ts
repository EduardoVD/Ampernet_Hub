//Português - Importa o decorator Module do NestJS.
import { Module } from '@nestjs/common';

//Português - Importa o TypeOrmModule para injetar repositórios.
import { TypeOrmModule } from '@nestjs/typeorm';

//Português - Importa os componentes do recurso de recados.
import { NoticesService } from './notices.service';
import { NoticesController } from './notices.controller';
import { Notice } from './entities/notice.entity';

@Module({
  //Português - Disponibiliza o repositório da entidade Notice para este módulo.
  imports: [TypeOrmModule.forFeature([Notice])],
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class NoticesModule {}