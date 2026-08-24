//Português - Importa os decorators do TypeORM para mapeamento objeto-relacional.
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

//Português - Define que esta classe representa a tabela 'users' no banco de dados.
@Entity('users')
export class User {
  //Português - Chave primária auto-incrementável.
  @PrimaryGeneratedColumn()
  id: number;

  //Português - Nome completo do usuário.
  @Column({ type: 'varchar', length: 100 })
  name: string;

  //Português - E-mail único para login no sistema.
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  //Português - Senha com * criptográfico.
  @Column({ type: 'varchar', length: 255 })
  password: string;

  //Português - Papel do usuário no sistema (Exemplo: 'admin', 'user', 'supervisor').
  @Column({ type: 'varchar', length: 50, default: 'user' })
  role: string;

  //Português - Status de ativação da conta.
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  //Português - Data e hora de criação do registro (Gerada Automaticamente).
  @CreateDateColumn()
  createdAt: Date;

  //Português - Data e hora da última atualização do registro (Gerada Automaticamente).
  @UpdateDateColumn()
  updatedAt: Date;
}