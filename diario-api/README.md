# diario-api

## Como rodar

1. Crie o banco executando o script `diarioBD.sql` (banco `"diarioBD"`, com aspas por causa das maiúsculas).
## script estará no arquivo .zip
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie `.env.example` para `.env` e preencha `DATABASE_URL` e os dois segredos JWT. Para gerar um segredo:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
4. Inicie:
   ```bash
   npm run dev     # com recarga automática (nodemon)
   npm start       # produção
   ```
   A API sobe em `http://localhost:3000/api` (porta configurável em `PORT`). Requer Node 18 ou superior.

## Bibliotecas

| Pacote | Para que serve |
|---|---|
| express | servidor HTTP e rotas |
| cors | libera o acesso do app/navegador à API |
| dotenv | lê as variáveis do arquivo `.env` |
| pg | conexão com o PostgreSQL |
| jsonwebtoken | gera e valida os tokens da sessão |
| bcryptjs | criptografa (hash) as senhas |
| nodemon (dev) | reinicia o servidor ao salvar arquivos |

## Estrutura (MVC)

```
src/
  server.js          sobe o servidor e conecta ao banco
  app.js             configura Express, CORS, JSON, rotas e erros
  config/            env.js (variáveis) e db.js (pool + transações)
  routes/            URLs -> controllers
  controllers/       regras de cada requisição (validação, respostas)
  models/            consultas SQL (única camada que fala com o banco)
  middlewares/       autenticar.js (token), exigirConsentimento.js e erros.js (tratamento de erros)
  services/          authService.js (par de tokens) e consentimentoService.js (validação do aceite)
  content/           termos.js (texto do aviso, Termo e Política, com número de versão)
  utils/             token.js, validadores.js, AppError.js
```

Em uma API, a "view" do MVC é a resposta JSON enviada pelos controllers.

## Como funciona a sessão com tokens

- No **cadastro** e no **login** a API devolve dois tokens JWT:
  - `accessToken` (curto, 15 min): vai no cabeçalho `Authorization: Bearer <token>` em toda rota protegida.
  - `refreshToken` (longo, 7 dias): serve apenas para pedir um novo par em `POST /api/auth/refresh`.
- O banco guarda só o **hash SHA-256** dos tokens na tabela `sessoes`, com IP, user agent, expiração e revogação.
- A cada requisição protegida a API confere a assinatura **e** se a sessão continua válida no banco. Por isso o logout e a troca de senha têm efeito imediato.
- O refresh token é de **uso único**: ao usá-lo, ele é revogado e um novo par é emitido.
- Trocar a senha encerra todas as sessões do usuário e devolve tokens novos para o dispositivo atual.

No app React Native, guarde os tokens em armazenamento seguro (por exemplo `expo-secure-store`) e, ao receber `401`, tente `POST /api/auth/refresh` uma vez antes de mandar o usuário para o login.

## Endpoints

Prefixo: `/api`. Corpos em JSON. Rotas marcadas com 🔒 exigem `Authorization: Bearer <accessToken>`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/saude` | verifica se a API está no ar |
| GET | `/humores` | lista de humores (id, nome, valor 1 a 5, ícone) |
| GET | `/areas-interesse` | lista de áreas de interesse para o cadastro |
| GET | `/termos/atual` | aviso de consentimento, Termo de Autorização e Política de Privacidade (versão vigente) |
| POST | `/usuarios` | **cadastro** (já devolve os tokens). Aceita `consentimento: { versao, aceito: true }`; é obrigatório para enviar `areas_interesse` |
| GET | `/consentimentos/atual` 🔒 | situação do aceite: `{ vigente, versao, aceito_em, versao_vigente }` |
| POST | `/consentimentos` 🔒 | registra o aceite (`{ "versao": "1.0", "aceito": true }`) |
| POST | `/auth/login` | login |
| POST | `/auth/refresh` | novo par de tokens a partir do refresh token |
| POST | `/auth/logout` 🔒 | encerra a sessão (aceita `refreshToken` no corpo) |
| GET | `/auth/me` 🔒 | usuário logado |
| GET | `/usuarios/:id` 🔒 | perfil (`:id` pode ser `me`) |
| PUT/PATCH | `/usuarios/:id` 🔒 | atualiza nome, e-mail, data de nascimento e/ou áreas |
| PATCH | `/usuarios/:id/senha` 🔒 | troca a senha (`senha_atual`, `senha_nova`) |
| DELETE | `/usuarios/:id` 🔒 | exclui a conta e todos os dados (exige `senha` no corpo) |
| POST | `/entradas` 🔒 | registra uma entrada de emoção (exige aceite da versão vigente do Termo) |
| GET | `/entradas` 🔒 | lista as suas entradas (filtros: `de`, `ate`, `humor_id`, `limite`, `offset`) |
| GET | `/entradas/:id` 🔒 | uma entrada |
| PUT/PATCH | `/entradas/:id` 🔒 | edita a entrada (parcial) |
| DELETE | `/entradas/:id` 🔒 | apaga a entrada |

Cada usuário só enxerga e altera os próprios dados: usar o id de outro usuário retorna `403` e entradas alheias retornam `404`.

### Consentimento (LGPD)

- O texto do Termo e da Política está em `src/content/termos.js`. Nome, endereço e e-mail do encarregado vêm do `.env` (`EMPRESA_*`, `ENCARREGADO_*`, `TERMOS_VIGENTE_DESDE`, `BACKUP_DIAS`).
- `POST /entradas`, `PUT/PATCH /entradas/:id` e a gravação de áreas de interesse só funcionam com aceite da versão vigente; sem ele a API responde `403` com `erro.codigo = "CONSENTIMENTO_NECESSARIO"`.
- Ler, listar e apagar dados continuam livres, para a pessoa sempre poder consultar e remover o que é dela.
- A resposta de `usuario` traz `consentimento: { vigente, versao, aceito_em, versao_vigente }` (login, cadastro, `/auth/me`).
- Cada aceite vira uma linha na tabela `consentimentos` (data e hora, versão, texto exibido, IP e aparelho). O texto gravado é sempre o do servidor.
- **Mudou o texto?** Aumente `VERSAO` em `termos.js`: quem aceitou a versão antiga é barrado até aceitar de novo (`TERMO_DESATUALIZADO` se o app enviar a versão antiga).
- Retirar a autorização = `DELETE /usuarios/me` com a senha: apaga a conta e, em cascata, os registros de consentimento.

### Exemplos

```bash
# cadastro (e-mail é guardado em minúsculas)
curl -X POST http://localhost:3000/api/usuarios -H "Content-Type: application/json" \
  -d '{"nome":"Rafael","email":"rafael@exemplo.com","senha":"Senha@123","data_nascimento":"1995-05-10","areas_interesse":[1,3]}'

# login
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"rafael@exemplo.com","senha":"Senha@123"}'

# nova entrada de emoção (as 3 perguntas viram o texto da entrada)
curl -X POST http://localhost:3000/api/entradas \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"humor_id":4,"data_entrada":"2026-11-22","fez_bem":"Caminhei no fim da tarde","fez_mal":"Nada de relevante","aprendeu":"Me mover melhora meu humor"}'

# listar as entradas de um período
curl "http://localhost:3000/api/entradas?de=2026-11-01&ate=2026-11-30" -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### Corpo de uma entrada

| Campo | Obrigatório | Observação |
|---|---|---|
| `humor_id` | sim | id vindo de `GET /humores` |
| `texto` | sim* | texto livre. *Alternativamente envie `fez_bem`, `fez_mal` e/ou `aprendeu`, que a API junta em um único texto |
| `data_entrada` | não | `AAAA-MM-DD`. Se omitida, usa a data de hoje no fuso `DB_TIMEZONE` |
| `foto_url` | não | URL ou caminho da foto (até 500 caracteres); `null` remove |

Envie sempre `data_entrada` com a data local do aparelho do usuário para evitar diferenças de fuso.

### Erros

Todas as respostas de erro seguem o formato:

```json
{ "erro": { "mensagem": "Dados inválidos.", "detalhes": { "email": "Informe um e-mail válido." }, "codigo": "..." } }
```

`codigo` só aparece em alguns erros (`CONSENTIMENTO_NECESSARIO`, `TERMO_DESATUALIZADO`).

Códigos usados: `400` dados inválidos, `401` token ausente/inválido/expirado ou login incorreto, `403` acesso a dados de outro usuário ou falta de aceite do Termo, `404` não encontrado, `409` e-mail já cadastrado, `500` erro interno.

## Observações de segurança

- Senhas são guardadas apenas como hash bcrypt (máximo de 72 bytes por limitação do algoritmo).
- Os segredos JWT ficam só no `.env`, que está no `.gitignore`. Em produção use segredos de pelo menos 32 caracteres e HTTPS.
- Para produção, considere adicionar limite de tentativas de login (por exemplo `express-rate-limit`) e o `helmet`.
- O CORS aceita qualquer origem por padrão; defina `CORS_ORIGIN` para restringir. Apps nativos de React Native não são afetados por CORS, mas o Expo Web é.
- `foto_url` só guarda o endereço da imagem. O upload do arquivo não faz parte desta API.
