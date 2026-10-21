import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from 'typeorm';

//Português - Importa a entidade User para relacionar o criador do comunicado.
import { User } from '../../users/entities/user.entity';

@Entity('notices')
export class Notice {
  //Português - Chave primária auto-incrementável.
  @PrimaryGeneratedColumn()
  id!: number;

  //Português - Título principal do comunicado.
  @Column({ type: 'varchar', length: 150 })
  title!: string;

  //Português - Conteúdo detalhado do aviso ou procedimento.
  @Column({ type: 'text' })
  content!: string;

  //Português - Categoria do aviso (Exemplo: 'Procedimentos', 'Campanhas'...).
  @Column({ type: 'varchar', length: 50, default: 'Geral' })
  category!: string;

  //Português - Relacionamento Muitos-para-Um: Muitos recados pertencem a um único autor (User).
  //Português - eager: true carrega automaticamente o autor; onDelete: SET NULL preserva comunicados caso autor seja excluído.
  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  author?: User | null;

  //Português - Data de criação gerada automaticamente.
  @CreateDateColumn()
  createdAt!: Date;

  //Português - Data de alteração atualizada automaticamente.
  @UpdateDateColumn()
  updatedAt!: Date;

  //Português - Data de exclusão lógica (soft delete) para preservação de histórico.
  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date | null;
}
