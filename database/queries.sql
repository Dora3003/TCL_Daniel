-- Consultas úteis para validação no DBeaver

-- Veículos atualmente no pátio
SELECT id, placa, entrada_em, status
FROM registros_estacionamento
WHERE status = 'ativo'
ORDER BY entrada_em;

-- Histórico de uma placa
SELECT id, placa, entrada_em, saida_em, valor_cobrado, status
FROM registros_estacionamento
WHERE placa = 'ABC1234'
ORDER BY entrada_em DESC;

-- Resumo geral
SELECT status, COUNT(*) AS total
FROM registros_estacionamento
GROUP BY status;
