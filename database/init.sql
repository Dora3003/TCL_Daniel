-- Schema inicial do estacionamento
-- Executado automaticamente na primeira subida do container PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE status_registro AS ENUM ('ativo', 'finalizado');

CREATE TABLE registros_estacionamento (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa           VARCHAR(8) NOT NULL,
    entrada_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    saida_em        TIMESTAMPTZ,
    valor_cobrado   DECIMAL(10, 2),
    status          status_registro NOT NULL DEFAULT 'ativo',
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_valor_positivo CHECK (valor_cobrado IS NULL OR valor_cobrado >= 0),
    CONSTRAINT chk_saida_quando_finalizado CHECK (
        (status = 'ativo' AND saida_em IS NULL AND valor_cobrado IS NULL)
        OR (status = 'finalizado' AND saida_em IS NOT NULL AND valor_cobrado IS NOT NULL)
    )
);

CREATE INDEX idx_registros_placa ON registros_estacionamento (placa);
CREATE INDEX idx_registros_status ON registros_estacionamento (status);

-- Uma placa só pode ter um registro ativo por vez
CREATE UNIQUE INDEX idx_placa_ativa
    ON registros_estacionamento (placa)
    WHERE status = 'ativo';

COMMENT ON TABLE registros_estacionamento IS 'Registros de entrada e saída de veículos no estacionamento';
COMMENT ON COLUMN registros_estacionamento.placa IS 'Placa normalizada em maiúsculas (ABC-1234 ou ABC1D23)';
