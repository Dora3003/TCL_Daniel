# Frontend Guarita — Design

## Layout da aplicação

```
┌─────────────────────────────────────────────────────┐
│  🅿️  Estacionamento — Painel da Guarita             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ Registrar Entrada ──────────────────────────┐   │
│  │  Placa: [ ABC-1234        ] [Registrar Entrada]│ │
│  │  ⚠ mensagem de erro/sucesso                   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Veículos no Pátio ──────────── [Atualizar] ─┐  │
│  │  Placa     │ Entrada    │ Tempo  │ Ação       │  │
│  │  ABC-1234  │ 13:00      │ 45 min │ [Saída]    │  │
│  │  XYZ-9876  │ 12:30      │ 1h15   │ [Saída]    │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Consultar Histórico ────────────────────────┐  │
│  │  Placa: [ ABC-1234 ] [Buscar Histórico]       │  │
│  │  (tabela de resultados)                       │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Componentes React

```
App
├── Header
├── EntradaForm          # POST /api/entrada
├── VeiculosAtivos       # GET /api/ativos
│   └── VeiculoCard      # botão saída → POST /api/saida
├── SaidaModal           # exibe valor após saída
├── HistoricoForm        # GET /api/historico/:placa
│   └── HistoricoTable
└── ErrorBanner          # servidor offline
```

## Serviço de API (client)

```typescript
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const api = {
  registrarEntrada: (placa: string) =>
    fetch(`${API_BASE}/entrada`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placa }) }),

  registrarSaida: (placa: string) =>
    fetch(`${API_BASE}/saida`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placa }) }),

  listarAtivos: () => fetch(`${API_BASE}/ativos`),

  historico: (placa: string) => fetch(`${API_BASE}/historico/${placa}`),

  health: () => fetch(`${API_BASE}/health`),
};
```

## Estados da UI

| Estado            | Comportamento                                      |
| ----------------- | -------------------------------------------------- |
| `idle`            | Formulários habilitados                            |
| `loading`         | Botões desabilitados, spinner na seção afetada     |
| `success`         | Toast/mensagem verde, formulário limpo             |
| `error`           | Mensagem vermelha com código traduzido             |
| `offline`         | Banner amarelo, formulários desabilitados          |

## Formatação

```typescript
// Valor em BRL
new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

// Data/hora
new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(date);

// Tempo decorrido
function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m} min`;
}
```

## Estrutura de arquivos

```
frontend/
├── .specs/features/frontend-guarita/
├── package.json
├── vite.config.ts
├── index.html
├── .env.example          # VITE_API_URL=http://localhost:3000/api
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── components/
    │   ├── Header.tsx
    │   ├── EntradaForm.tsx
    │   ├── VeiculosAtivos.tsx
    │   ├── VeiculoCard.tsx
    │   ├── SaidaModal.tsx
    │   ├── HistoricoForm.tsx
    │   ├── HistoricoTable.tsx
    │   └── ErrorBanner.tsx
    ├── services/
    │   └── api.ts
    ├── hooks/
    │   └── useApi.ts
    └── utils/
        ├── format.ts
        └── placa.ts
```

## Paleta visual (guarita)

| Elemento       | Cor        | Uso                        |
| -------------- | ---------- | -------------------------- |
| Primária       | `#1a56db`  | Botões de ação principal   |
| Sucesso        | `#059669`  | Confirmações               |
| Erro           | `#dc2626`  | Mensagens de erro          |
| Fundo          | `#f8fafc`  | Background geral           |
| Card           | `#ffffff`  | Seções do painel           |
| Texto          | `#1e293b`  | Conteúdo principal         |

## Dependências previstas

| Pacote        | Uso              |
| ------------- | ---------------- |
| react         | UI               |
| react-dom     | Renderização     |
| vite          | Build e dev      |
| typescript    | Tipagem          |
