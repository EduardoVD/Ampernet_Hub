import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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
  //Português - eager: true carrega automaticamente os dados do autor nas consultas.
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  author!: User;

  //Português - Data de criação gerada automaticamente.
  @CreateDateColumn()
  createdAt!: Date;

  //Português - Data de alteração atualizada automaticamente.
  @UpdateDateColumn()
  updatedAt!: Date;
}
