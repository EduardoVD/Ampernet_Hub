import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticesService } from './notices.service';
import { NoticesController } from './notices.controller';
import { Notice } from './entities/notice.entity';
import { NoticeRead } from './entities/notice-read.entity';
import { User } from '../users/entities/user.entity';

//Português - Define a classe como um módulo oficial da aplicação.
@Module({
  imports: [TypeOrmModule.forFeature([Notice, NoticeRead, User])],
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
//Português - Torna o serviço de recados público e acessível caso outro módulo precise consultar avisos.
export class NoticesModule {}