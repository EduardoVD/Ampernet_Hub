import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Notice } from './notice.entity';

@Entity('notice_reads')
@Unique(['user', 'notice'])
export class NoticeRead {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Notice, { onDelete: 'CASCADE' })
  notice!: Notice;

  @CreateDateColumn()
  readAt!: Date;
}