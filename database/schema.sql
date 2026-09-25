-- Schema de referência para execução manual no DBeaver
-- Use este arquivo se precisar recriar as tabelas em um banco existente

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE status_registro AS ENUM ('ativo', 'pago', 'multa_pendente', 'finalizado');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS registros_estacionamento (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa           VARCHAR(8) NOT NULL,
    token           VARCHAR(7) NOT NULL UNIQUE,
    motorista_nome  VARCHAR(120) NOT NULL,
    modelo          VARCHAR(60),
    cor             VARCHAR(30),
    entrada_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    saida_em        TIMESTAMPTZ,
    pago_em         TIMESTAMPTZ,
    valor_cobrado   DECIMAL(10, 2),
    valor_multa     DECIMAL(10, 2),
    multa_paga_em   TIMESTAMPTZ,
    status          status_registro NOT NULL DEFAULT 'ativo',
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_valor_positivo CHECK (valor_cobrado IS NULL OR valor_cobrado >= 0),
    CONSTRAINT chk_multa_positiva CHECK (valor_multa IS NULL OR valor_multa >= 0)
);

CREATE INDEX IF NOT EXISTS idx_registros_placa ON registros_estacionamento (placa);
CREATE INDEX IF NOT EXISTS idx_registros_status ON registros_estacionamento (status);
CREATE INDEX IF NOT EXISTS idx_registros_token ON registros_estacionamento (token);

CREATE UNIQUE INDEX IF NOT EXISTS idx_placa_no_patio
    ON registros_estacionamento (placa)
    WHERE status <> 'finalizado';
