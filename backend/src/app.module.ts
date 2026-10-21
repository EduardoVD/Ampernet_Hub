import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NoticesModule } from './notices/notices.module';
import { IssuesModule } from './issues/issues.module';
import { ResponsibilitiesModule } from './responsibilities/responsibilities.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  //Português - Seção de importações de módulos externos ou submódulos da aplicação.
  imports: [
    //Português - Carrega as variáveis de ambiente (.env) de forma global.
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    //Português - Rate Limiting global (Proteção contra sobrecarga e abuso de requisições).
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120, // 120 requisições por minuto por IP para uso geral
      },
    ]),
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
        // Em produção, desativa synchronize para prevenir perda acidental de dados.
        synchronize:
          configService.get<string>('NODE_ENV') === 'production'
            ? false
            : configService.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
      }),
    }),
    UsersModule,
    AuthModule,
    NoticesModule,
    IssuesModule,
    ResponsibilitiesModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
//Português - Exporta a classe do módulo raiz para ser instanciada no main.ts.
export class AppModule {}