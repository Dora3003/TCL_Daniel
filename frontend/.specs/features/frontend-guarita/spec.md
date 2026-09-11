# Frontend Guarita — Specification

## Problem Statement

O operador da guarita precisa de uma interface visual simples para registrar entradas e saídas de veículos, visualizar o pátio e consultar valores cobrados — sem depender de ferramentas como curl ou Postman.

## Goals

- [ ] Interface React responsiva simulando o painel da guarita
- [ ] Formulário de entrada de placa com feedback imediato de erro/sucesso
- [ ] Listagem em tempo quase real dos veículos no pátio
- [ ] Ação de saída com exibição do valor cobrado após confirmação

## Out of Scope

| Feature                | Reason                                      |
| ---------------------- | ------------------------------------------- |
| App mobile nativo      | Web responsiva cobre o MVP                  |
| Impressão de ticket    | Apenas exibição na tela                     |
| Dark mode              | Nice-to-have; não prioritário               |
| Internacionalização    | Interface em português apenas               |
| Login / perfis         | Operador único (AD implícito)               |

---

## Assumptions & Open Questions

| Assumption / decision    | Chosen default                    | Rationale                              | Confirmed? |
| ------------------------ | --------------------------------- | -------------------------------------- | ---------- |
| Build tool               | Vite + React                      | Setup rápido, HMR, padrão atual        | n          |
| Estilização              | CSS Modules ou CSS puro           | Atividade pede HTML/CSS com React      | n          |
| URL da API               | `http://localhost:3000/api`       | Backend Express na porta 3000          | y          |
| Atualização da lista     | Refresh manual + após cada ação   | Sem WebSocket no MVP                   | y          |

**Open questions:** confirmar Vite e abordagem de CSS com o grupo.

---

## User Stories

### P1: Registrar entrada pela interface ⭐ MVP

**User Story**: Como operador da guarita, quero digitar a placa e clicar em "Registrar Entrada" para que o veículo apareça no pátio.

**Why P1**: Primeira interação do operador; demonstra integração frontend ↔ API ↔ banco.

**Acceptance Criteria**:

1. WHEN o operador preenche o campo placa e clica "Registrar Entrada" THEN the UI SHALL enviar `POST /api/entrada` e exibir mensagem de sucesso com placa e horário de entrada
2. IF a API retornar erro `PLACA_INVALIDA` THEN the UI SHALL exibir mensagem de erro abaixo do campo sem limpar o formulário
3. IF a API retornar erro `PLACA_JA_ATIVA` THEN the UI SHALL exibir mensagem informando que o veículo já está no pátio
4. WHEN a entrada é registrada com sucesso THEN the UI SHALL limpar o campo placa e atualizar a lista de veículos ativos
5. The UI SHALL desabilitar o botão de envio enquanto a requisição estiver em andamento

**Independent Test**: Digitar placa válida, clicar entrar, ver confirmação e veículo na lista.

---

### P1: Registrar saída e exibir valor ⭐ MVP

**User Story**: Como operador, quero registrar a saída de um veículo e ver imediatamente quanto cobrar.

**Why P1**: Demonstra regra de negócio de cálculo de valor na interface.

**Acceptance Criteria**:

1. WHEN o operador clica "Registrar Saída" em um veículo da lista THEN the UI SHALL enviar `POST /api/saida` e exibir modal ou painel com `duracaoMinutos` e `valorCobrado` formatado em BRL (ex.: `R$ 10,00`)
2. WHEN a saída é confirmada THEN the UI SHALL remover o veículo da lista de ativos
3. IF a API retornar `REGISTRO_NAO_ENCONTRADO` THEN the UI SHALL exibir erro e atualizar a lista de ativos
4. The UI SHALL formatar datas/horas no fuso `America/Sao_Paulo` (ex.: `11/09/2026 13:00`)

**Independent Test**: Registrar entrada, clicar saída, ver valor exibido e lista atualizada.

---

### P2: Painel de veículos no pátio

**User Story**: Como operador, quero ver todos os veículos atualmente estacionados com tempo de permanência.

**Why P2**: Visão operacional central da guarita.

**Acceptance Criteria**:

1. WHEN a página carrega THEN the UI SHALL buscar `GET /api/ativos` e exibir tabela/cards com placa, horário de entrada e tempo decorrido
2. WHEN a lista está vazia THEN the UI SHALL exibir estado vazio com mensagem "Nenhum veículo no pátio"
3. WHEN o operador clica "Atualizar" THEN the UI SHALL recarregar a lista sem recarregar a página inteira
4. WHILE a requisição de listagem está em andamento the UI SHALL exibir indicador de carregamento

**Independent Test**: Com 2 veículos ativos no banco, abrir página e ver ambos listados.

---

### P3: Consultar histórico por placa

**User Story**: Como operador, quero buscar o histórico de uma placa para ver estadias anteriores.

**Why P3**: Terceira funcionalidade relevante exigida pela atividade.

**Acceptance Criteria**:

1. WHEN o operador digita uma placa e clica "Buscar Histórico" THEN the UI SHALL chamar `GET /api/historico/:placa` e exibir tabela com entrada, saída, duração e valor
2. WHEN não houver histórico THEN the UI SHALL exibir "Nenhum registro encontrado para esta placa"
3. IF placa inválida THEN the UI SHALL exibir erro de validação antes de chamar a API

**Independent Test**: Buscar placa com estadias finalizadas e ver tabela populada.

---

## Edge Cases

- IF a API estiver offline THEN the UI SHALL exibir banner "Servidor indisponível. Verifique se o backend está rodando."
- IF resposta da API demorar mais de 10 segundos THEN the UI SHALL exibir timeout e reabilitar botões
- WHEN placa é digitada com minúsculas THEN the UI SHALL exibir em maiúsculas no campo (máscara visual)
- IF tela for menor que 768px THEN the UI SHALL manter layout utilizável (responsivo)

---

## Requirement Traceability

| Requirement ID | Story                    | Phase  | Status  |
| -------------- | ------------------------ | ------ | ------- |
| UI-01          | P1: Entrada              | Design | Pending |
| UI-02          | P1: Entrada              | Design | Pending |
| UI-03          | P1: Entrada              | Design | Pending |
| UI-04          | P1: Entrada              | Design | Pending |
| UI-05          | P1: Entrada              | Design | Pending |
| UI-06          | P1: Saída                | Design | Pending |
| UI-07          | P1: Saída                | Design | Pending |
| UI-08          | P1: Saída                | Design | Pending |
| UI-09          | P1: Saída                | Design | Pending |
| UI-10          | P2: Painel ativos        | Design | Pending |
| UI-11          | P2: Painel ativos        | Design | Pending |
| UI-12          | P2: Painel ativos        | Design | Pending |
| UI-13          | P2: Painel ativos        | Design | Pending |
| UI-14          | P3: Histórico            | Design | Pending |
| UI-15          | P3: Histórico            | Design | Pending |
| UI-16          | P3: Histórico            | Design | Pending |

**Coverage:** 16 total, 0 mapped to tasks, 16 unmapped ⚠️

---

## Success Criteria

- [ ] Operador consegue completar fluxo entrada → listagem → saída → ver valor em menos de 1 minuto
- [ ] Interface funcional em Chrome/Firefox com backend e banco rodando
- [ ] Mensagens de erro compreensíveis em português
- [ ] Layout identificável como "painel de guarita" na apresentação
