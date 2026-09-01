import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NoticesModule } from './notices/notices.module';

@Module({
  //Português - Seção de importações de módulos externos ou submódulos da aplicação.
  imports: [
    //Português - Inicializa a configuração global da conexão com o banco de dados.
    TypeOrmModule.forRoot({
      //Português - Define o tipo/driver do banco de dados relacional.
      type: 'mysql',
      //Português - Endereço do host onde o MySQL está rodando localmente.
      host: 'localhost',
      //Português - Porta padrão de comunicação do MySQL.
      port: 3306,
      //Português - Nome de usuário com permissão de acesso ao banco.
      username: 'root',
      //Português - Senha definida durante a instalação e conexão no MySQL Shell.
      password: '@EduardoVD2026',
      //Português - Nome da base de dados criada previamente.
      database: 'amper_hub_db',
      //Português - Carrega automaticamente todas as entidades (@Entity) registradas nos módulos.
      autoLoadEntities: true,
      //Português - Sincroniza tabelas com o código automaticamente a cada inicialização.
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    NoticesModule,
  ],
})
//Português - Exporta a classe do módulo raiz para ser instanciada no main.ts.
export class AppModule {}