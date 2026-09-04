# Ampernet Hub

Sistema interno desenvolvido para centralizar a comunicação da equipe, avisos operacionais e gestão de ocorrências da **Ampernet Telecom**.

---

## Tecnologias

- **Front-End:** Angular 19, TypeScript, SCSS
- **Back-End:** NestJS 11, TypeORM
- **Banco de Dados:** MySQL
- **Autenticação:** JWT (JSON Web Token)

---

## Como Executar o Projeto

### 1. Configurar o Banco de Dados
Certifique-se de que o serviço do MySQL está em execução e crie a base de dados:
```sql
CREATE DATABASE amper_hub_db;
```

### 2. Configurar o arquivo `.env` (Back-End)
Na pasta `backend`, copie o arquivo de modelo:
- Renomeie `.env.example` para `.env`
- Insira a senha do seu MySQL no campo `DB_PASSWORD`

### 3. Instalar as Dependências
Execute a instalação nas duas pastas:
```bash

cd backend
npm install


cd ../frontend
npm install
```

### 4. Iniciar o Sistema
  - Back-End: `cd backend && npm run start:dev` (inicia em `http://localhost:3000`)
  - Front-End: `cd frontend && npm start` (inicia em `http://localhost:4200`)

---

## 📖 Documentação da API (Swagger)
Com o servidor backend em execução, acesse a documentação interativa em:  
→ **http://localhost:3000/api**
