import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

//Português - Função assíncrona principal que inicializa o ciclo de vida do servidor.
async function bootstrap() {
  //Português - Cria a instância principal da aplicação HTTP baseada no AppModule.
  const app = await NestFactory.create(AppModule);

  //Português - Headers HTTP de segurança (proteção contra Clickjacking, sniffing de MIME e vazamentos).
  app.use(
    helmet({
      contentSecurityPolicy: false, // Preserva integridade visual do Swagger UI (/api)
      crossOriginEmbedderPolicy: false,
    }),
  );

  //Português - Configura o CORS com as origens permitidas da aplicação e métodos aceitos.
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  //Português - Filtro global de exceções para padronização de erros e prevenção de vazamento de dados internos.
  app.useGlobalFilters(new AllExceptionsFilter());

  //Português - Ativa a validação global de DTOs descartando propriedades não declaradas e rejeitando campos intrusos.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //Português - Instancia e configura o construtor de documentação da API.
  const config = new DocumentBuilder()
    //Português - Define o título principal exibido no cabeçalho da documentação Swagger.
    .setTitle('Ampernet - Hub de Operações API')
    //Português - Define a descrição com o escopo operacional do sistema.
    .setDescription('API para Gestão de Informações...')
    //Português - Define a versão atual da documentação da API.
    .setVersion('1.0')
    //Português - Adiciona o suporte a autenticação por Bearer Token (JWT) no Swagger.
    .addBearerAuth()
    //Português - Constrói o objeto final de configurações do OpenAPI.
    .build();
    
  //Português - Gera o documento OpenAPI mapeando os endpoints a partir da aplicação e da configuração.
  const document = SwaggerModule.createDocument(app, config);

  //Português - Registra a rota '/api' para servir a interface visual do Swagger no navegador.
  SwaggerModule.setup('api', app, document);

  //Português - Inicia o servidor HTTP escutando na porta configurada no .env ou 3000.
  const port = process.env.PORT || 3000;
  await app.listen(port);
}

//Português - Executa a função de inicialização da aplicação.
bootstrap();