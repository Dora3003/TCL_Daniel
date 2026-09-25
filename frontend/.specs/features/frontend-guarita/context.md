# Frontend Guarita — Context (Discuss)

## Input validation & bounds

- Campo placa: máximo 8 caracteres visíveis; aceita hífen opcional
- Validação client-side espelha regex do backend (feedback rápido); backend é fonte da verdade
- Botões desabilitados durante loading para evitar double-submit

## Failure / partial-failure states

- Erro de rede: banner persistente + toast de erro na ação
- Erro 4xx da API: mensagem específica por código (`PLACA_INVALIDA`, `PLACA_JA_ATIVA`, etc.)
- Erro 5xx: mensagem genérica "Erro no servidor. Tente novamente."

## Idempotency / duplicate handling

- Botão desabilitado durante POST evita cliques duplos
- Após erro 409, lista é atualizada para refletir estado real

## Auth boundaries

- N/A — sem login no MVP

## Concurrency / ordering

- Ações sequenciais por botão (não paralelas no mesmo formulário)
- Lista atualizada após cada ação bem-sucedida

## Data lifecycle

- N/A — frontend não persiste dados localmente (sem localStorage no MVP)

## Observability

- Erros de API logados no console em desenvolvimento
- N/A para métricas em produção (escopo acadêmico)

## External-dependency failure

- Backend offline: banner + desabilitar formulários
- Health check opcional no mount da aplicação

## State-transition integrity

- Após entrada bem-sucedida: veículo aparece na lista
- Após saída bem-sucedida: veículo some da lista; valor exibido uma vez
- Lista sempre reflete estado do servidor após cada ação
