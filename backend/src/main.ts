import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
//Português - Função assíncrona principal que inicializa o ciclo de vida do servidor.
async function bootstrap() {
  //Português - Cria a instância principal da aplicação HTTP baseada no AppModule.
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  //Português - Ativa a validação global de DTOs descartando propriedades não declaradas (whitelist).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
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

  //Português - Inicia o servidor HTTP escutando na porta 3000.
  await app.listen(3000);
}

//Português - Executa a função de inicialização da aplicação.
bootstrap();