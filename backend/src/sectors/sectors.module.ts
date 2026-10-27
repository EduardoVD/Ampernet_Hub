import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sector } from './entities/sector.entity';
import { User } from '../users/entities/user.entity';
import { SectorsService } from './sectors.service';
import { SectorsController } from './sectors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sector, User])],
  controllers: [SectorsController],
  providers: [SectorsService],
  exports: [SectorsService],
})
export class SectorsModule {}
