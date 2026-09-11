-- Schema de referência para execução manual no DBeaver
-- Use este arquivo se precisar recriar as tabelas em um banco existente

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE status_registro AS ENUM ('ativo', 'finalizado');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS registros_estacionamento (
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

CREATE INDEX IF NOT EXISTS idx_registros_placa ON registros_estacionamento (placa);
CREATE INDEX IF NOT EXISTS idx_registros_status ON registros_estacionamento (status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_placa_ativa
    ON registros_estacionamento (placa)
    WHERE status = 'ativo';
