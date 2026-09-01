import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Notice } from './notice.entity';

//Português - Faz a criação de uma tabela no banco de dados.
@Entity('notice_reads')
//Português - É feito a criação de restrição para impedir a duplicação no banco de dados. O mesmo usuário só pode ter uma única linha associada ao recado.
@Unique(['user', 'notice'])
export class NoticeRead {
  @PrimaryGeneratedColumn()
  id!: number;

  //Português - Um usuário pode ler múltiplos recados. Caso o usuário seja excluído, os registros serão apagados de forma automática.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  //Português - Um recado pode ser lido por vários usuários. Caso o recado seja deletado, sua marcação de leitura também será excluída.
  @ManyToOne(() => Notice, { onDelete: 'CASCADE' })
  notice!: Notice;

  //Português - Salvará de forma automática a data e hora exata que o usuário marcou a opção "Lida".
  @CreateDateColumn()
  readAt!: Date;
}