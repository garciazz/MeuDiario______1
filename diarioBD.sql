-- =====================================================================
-- Script de criação do banco "diarioBD" (PostgreSQL)
-- Execução:
--   1) Conectado ao banco padrão (ex.: postgres), rode apenas o CREATE DATABASE.
--   2) Conecte-se ao novo banco:  \c "diarioBD"
--   3) Rode o restante do script.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) BANCO DE DADOS
-- (As aspas preservam a caixa mista: o nome fica exatamente "diarioBD".
--  Em consultas/conexões, use sempre "diarioBD" entre aspas duplas.)
-- ---------------------------------------------------------------------
CREATE DATABASE "diarioBD"
    ENCODING 'UTF8'
    TEMPLATE template0;

-- >>> A partir daqui, execute conectado ao banco "diarioBD" <<<
-- \c "diarioBD"

-- ---------------------------------------------------------------------
-- 2) FUNÇÃO AUXILIAR: atualiza automaticamente a coluna atualizado_em
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 3) USUÁRIOS
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome            VARCHAR(120)  NOT NULL,
    email           VARCHAR(255)  NOT NULL,
    senha_hash      VARCHAR(255)  NOT NULL,           -- nunca armazenar senha em texto puro (use bcrypt/argon2)
    data_nascimento DATE,
    ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- E-mail único sem diferenciar maiúsculas/minúsculas
CREATE UNIQUE INDEX ux_usuarios_email ON usuarios (LOWER(email));

CREATE TRIGGER trg_usuarios_atualizado_em
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ---------------------------------------------------------------------
-- 4) SESSÕES / TOKENS
-- Guarda apenas o HASH do token (SHA-256), nunca o token em si.
-- Permite logout (revogação), expiração e controle por dispositivo.
-- ---------------------------------------------------------------------
CREATE TABLE sessoes (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id    BIGINT       NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    token_hash    VARCHAR(255) NOT NULL UNIQUE,
    tipo          VARCHAR(10)  NOT NULL DEFAULT 'access'
                  CHECK (tipo IN ('access', 'refresh')),
    ip            INET,
    user_agent    TEXT,
    criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expira_em     TIMESTAMPTZ  NOT NULL,
    revogado_em   TIMESTAMPTZ,                         -- preenchido no logout
    CHECK (expira_em > criado_em)
);

CREATE INDEX ix_sessoes_usuario   ON sessoes (usuario_id);
CREATE INDEX ix_sessoes_expiracao ON sessoes (expira_em);

-- ---------------------------------------------------------------------
-- 5) ÁREAS DE INTERESSE (catálogo) + vínculo com usuários (N:N)
-- ---------------------------------------------------------------------
CREATE TABLE areas_interesse (
    id        SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome      VARCHAR(80)  NOT NULL UNIQUE,
    descricao VARCHAR(255)
);

CREATE TABLE usuario_areas_interesse (
    usuario_id BIGINT   NOT NULL REFERENCES usuarios (id)         ON DELETE CASCADE,
    area_id    SMALLINT NOT NULL REFERENCES areas_interesse (id)  ON DELETE CASCADE,
    criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (usuario_id, area_id)
);

CREATE INDEX ix_uai_area ON usuario_areas_interesse (area_id);

-- ---------------------------------------------------------------------
-- 6) HUMORES (catálogo)
-- "valor" numérico (1 a 5) facilita médias, gráficos e relatórios.
-- ---------------------------------------------------------------------
CREATE TABLE humores (
    id    SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome  VARCHAR(40) NOT NULL UNIQUE,
    valor SMALLINT    NOT NULL CHECK (valor BETWEEN 1 AND 5),
    icone VARCHAR(40)                                   -- ex.: emoji ou nome do ícone no front-end
);

-- ---------------------------------------------------------------------
-- 7) ENTRADAS DO DIÁRIO
-- ---------------------------------------------------------------------
CREATE TABLE entradas (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id    BIGINT      NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    humor_id      SMALLINT    NOT NULL REFERENCES humores (id),
    texto         TEXT        NOT NULL,
    data_entrada  DATE        NOT NULL DEFAULT CURRENT_DATE,  -- dia a que a entrada se refere (base dos relatórios)
    foto_url      VARCHAR(500),                               -- opcional (caminho/URL do arquivo)
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consultas e relatórios por usuário e período
CREATE INDEX ix_entradas_usuario_data ON entradas (usuario_id, data_entrada DESC);
CREATE INDEX ix_entradas_humor        ON entradas (humor_id);

CREATE TRIGGER trg_entradas_atualizado_em
    BEFORE UPDATE ON entradas
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ---------------------------------------------------------------------
-- 8) TAGS (organização) + vínculo com entradas (N:N)
-- Cada usuário tem suas próprias tags.
-- ---------------------------------------------------------------------
CREATE TABLE tags (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT      NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    nome       VARCHAR(50) NOT NULL,
    cor        CHAR(7),                                       -- ex.: '#FF8800'
    criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ux_tags_usuario_nome UNIQUE (usuario_id, nome),
    CONSTRAINT ck_tags_cor CHECK (cor IS NULL OR cor ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE entrada_tags (
    entrada_id BIGINT NOT NULL REFERENCES entradas (id) ON DELETE CASCADE,
    tag_id     BIGINT NOT NULL REFERENCES tags (id)     ON DELETE CASCADE,
    PRIMARY KEY (entrada_id, tag_id)
);

CREATE INDEX ix_entrada_tags_tag ON entrada_tags (tag_id);

-- ---------------------------------------------------------------------
-- 9) LEMBRETES
-- ---------------------------------------------------------------------
CREATE TABLE lembretes (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id    BIGINT       NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    titulo        VARCHAR(120) NOT NULL,
    descricao     TEXT,
    data_hora     TIMESTAMPTZ  NOT NULL,                      -- quando o lembrete deve disparar
    recorrencia   VARCHAR(10)  NOT NULL DEFAULT 'nenhuma'
                  CHECK (recorrencia IN ('nenhuma', 'diaria', 'semanal', 'mensal')),
    ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_lembretes_usuario_data ON lembretes (usuario_id, data_hora)
    WHERE ativo;

CREATE TRIGGER trg_lembretes_atualizado_em
    BEFORE UPDATE ON lembretes
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ---------------------------------------------------------------------
-- 9.1) CONSENTIMENTOS (LGPD): prova do aceite do Termo de Autorização
--      Guarda data/hora, versão do Termo e o texto exibido ao usuário.
--      Um novo aceite = uma nova linha (o histórico é preservado).
-- ---------------------------------------------------------------------
CREATE TABLE consentimentos (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id    BIGINT       NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    versao        VARCHAR(20)  NOT NULL,
    texto_exibido TEXT         NOT NULL,
    aceito_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ip            INET,
    user_agent    VARCHAR(500)
);
CREATE INDEX ix_consentimentos_usuario ON consentimentos (usuario_id, aceito_em DESC);

-- ---------------------------------------------------------------------
-- 10) DADOS INICIAIS (catálogos)
-- ---------------------------------------------------------------------
INSERT INTO areas_interesse (nome) VALUES
    ('Ansiedade'),
    ('Autonomia'),
    ('Crise de Pânico'),
    ('Desenvolvimento Pessoal'),
    ('Rotina de Estudos'),
    ('Exercício Físico'),
    ('Burnout'),
    ('Infância'),
    ('Comunicação Interpessoal'),
    ('Autocontrole'),
    ('Relacionamentos'),
    ('Autoestima');

INSERT INTO humores (nome, valor, icone) VALUES
    ('Muito triste', 1, '😢'),
    ('Triste',       2, '🙁'),
    ('Neutro',       3, '😐'),
    ('Feliz',        4, '🙂'),
    ('Muito feliz',  5, '😄');

-- ---------------------------------------------------------------------
-- 11) EXEMPLO DE RELATÓRIO: humor médio por mês de um usuário
-- ---------------------------------------------------------------------
-- SELECT DATE_TRUNC('month', e.data_entrada) AS mes,
--        ROUND(AVG(h.valor), 2)              AS humor_medio,
--        COUNT(*)                            AS total_entradas
--   FROM entradas e
--   JOIN humores  h ON h.id = e.humor_id
--  WHERE e.usuario_id = 1
--  GROUP BY 1
--  ORDER BY 1;
