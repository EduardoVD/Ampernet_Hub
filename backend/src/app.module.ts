import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NoticesModule } from './notices/notices.module';

@Module({
  //Português - Seção de importações de módulos externos ou submódulos da aplicação.
  imports: [
    //Português - Carrega as variáveis de ambiente (.env) de forma global.
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    //Português - Conexão assíncrona com o MySQL usando variáveis de ambiente.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE', 'amper_hub_db'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    NoticesModule,
  ],
})
//Português - Exporta a classe do módulo raiz para ser instanciada no main.ts.
export class AppModule {}