require('dotenv').config({ quiet: true });

const obrigatorias = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const ausentes = obrigatorias.filter((chave) => !process.env[chave]);
if (ausentes.length) {
  throw new Error(
    `Variáveis de ambiente obrigatórias ausentes: ${ausentes.join(', ')}. Veja o arquivo .env.example.`
  );
}
if (!process.env.DATABASE_URL && !process.env.PGDATABASE) {
  throw new Error('Defina DATABASE_URL (ou as variáveis PG*) no arquivo .env.');
}

if (process.env.DB_TIMEZONE && !/^[A-Za-z0-9_/+-]+$/.test(process.env.DB_TIMEZONE)) {
  throw new Error('DB_TIMEZONE inválido. Exemplo: America/Sao_Paulo.');
}

const ambiente = process.env.NODE_ENV || 'development';
if (
  ambiente === 'production' &&
  (process.env.JWT_ACCESS_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32)
) {
  throw new Error('Em produção, os segredos JWT precisam ter pelo menos 32 caracteres.');
}

module.exports = {
  env: ambiente,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  dbTimezone: process.env.DB_TIMEZONE || 'America/Sao_Paulo',
  corsOrigins: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean),
  // Dados que aparecem no Termo e na Política de Privacidade (podem ser trocados no .env).
  termos: {
    empresa: process.env.EMPRESA_NOME || 'RG Systems',
    cidade: process.env.EMPRESA_CIDADE || 'Palotina/PR',
    pais: process.env.EMPRESA_PAIS || 'Brasil',
    endereco: process.env.EMPRESA_ENDERECO || 'José Bonifácio, 289, Osvaldo Cruz, Palotina/PR',
    encarregadoNome: process.env.ENCARREGADO_NOME || 'Rafael Garcia',
    encarregadoEmail: process.env.ENCARREGADO_EMAIL || 'rafael.cerci@ufpr.br',
    vigenteDesde: process.env.TERMOS_VIGENTE_DESDE || '10 de novembro de 2026',
    backupDias: Number(process.env.BACKUP_DIAS) || 360,
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  trustProxy: process.env.TRUST_PROXY === 'true',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  },
};
