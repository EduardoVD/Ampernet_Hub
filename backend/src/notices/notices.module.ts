import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticesService } from './notices.service';
import { NoticesController } from './notices.controller';
import { Notice } from './entities/notice.entity';
import { NoticeRead } from './entities/notice-read.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notice, NoticeRead])],
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class NoticesModule {}