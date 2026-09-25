-- Schema inicial do estacionamento
-- Executado automaticamente na primeira subida do container PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE status_registro AS ENUM ('ativo', 'pago', 'multa_pendente', 'finalizado');

CREATE TABLE registros_estacionamento (
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

CREATE INDEX idx_registros_placa ON registros_estacionamento (placa);
CREATE INDEX idx_registros_status ON registros_estacionamento (status);
CREATE INDEX idx_registros_token ON registros_estacionamento (token);

CREATE UNIQUE INDEX idx_placa_no_patio
    ON registros_estacionamento (placa)
    WHERE status <> 'finalizado';

COMMENT ON TABLE registros_estacionamento IS 'Tickets de estadia: entrada, pagamento, multa e saída';
COMMENT ON COLUMN registros_estacionamento.token IS 'Código do ticket (7 caracteres A-Z0-9)';
COMMENT ON COLUMN registros_estacionamento.placa IS 'Placa normalizada (ABC1234 ou ABC1D23)';
