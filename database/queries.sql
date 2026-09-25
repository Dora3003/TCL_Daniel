-- Consultas úteis para validação no DBeaver

-- Veículos no pátio (ainda não saíram)
SELECT id, placa, token, motorista_nome, entrada_em, status, pago_em, valor_cobrado, valor_multa
FROM registros_estacionamento
WHERE status <> 'finalizado'
ORDER BY entrada_em;

-- Ticket por token
SELECT *
FROM registros_estacionamento
WHERE token = 'U3T98LX';

-- Histórico de uma placa
SELECT id, placa, token, entrada_em, saida_em, valor_cobrado, valor_multa, status
FROM registros_estacionamento
WHERE placa = 'ABC1234'
ORDER BY entrada_em DESC;

-- Resumo geral
SELECT status, COUNT(*) AS total
FROM registros_estacionamento
GROUP BY status;
