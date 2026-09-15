import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IssueStatus } from '../enums/issue-status.enum';

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.ONGOING,
  })
  status!: IssueStatus;

  @Column({ type: 'datetime' })
  startedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt?: Date | null;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  author?: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
