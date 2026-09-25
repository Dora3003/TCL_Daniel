export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Estacionamento Guarita API',
    version: '0.1.0',
    description:
      'API TLC do estacionamento: cadastro na guarita, login por token, pagamento, multa e saída na catraca.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Guarita', description: 'Cadastro e consulta do operador' },
    { name: 'Cliente', description: 'Ticket, pagamento e multa' },
    { name: 'Catraca', description: 'Validação de saída' },
    { name: 'Ops', description: 'Saúde do serviço' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Ops'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Banco conectado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
          },
          '503': {
            description: 'Banco desconectado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
          },
        },
      },
    },
    '/api/entrada': {
      post: {
        tags: ['Guarita'],
        summary: 'Registrar entrada e gerar token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EntradaRequest' },
              example: {
                placa: 'ABC-1234',
                motoristaNome: 'Ana Souza',
                modelo: 'Onix',
                cor: 'Prata',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Ticket criado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/EntradaResponse' } } },
          },
          '400': { $ref: '#/components/responses/Erro' },
          '409': { $ref: '#/components/responses/Erro' },
          '503': { $ref: '#/components/responses/Erro' },
        },
      },
    },
    '/api/ativos': {
      get: {
        tags: ['Guarita'],
        summary: 'Listar veículos no pátio',
        responses: {
          '200': {
            description: 'Lista de veículos (pode ser vazia)',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Ativo' } },
              },
            },
          },
        },
      },
    },
    '/api/historico/{placa}': {
      get: {
        tags: ['Guarita'],
        summary: 'Histórico finalizado por placa',
        parameters: [{ $ref: '#/components/parameters/Placa' }],
        responses: {
          '200': {
            description: 'Estadias finalizadas',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/HistoricoItem' } },
              },
            },
          },
          '400': { $ref: '#/components/responses/Erro' },
        },
      },
    },
    '/api/tickets/{token}': {
      get: {
        tags: ['Cliente'],
        summary: 'Login do cliente pelo token do ticket',
        parameters: [{ $ref: '#/components/parameters/Token' }],
        responses: {
          '200': {
            description: 'Estado atual do ticket',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } },
          },
          '400': { $ref: '#/components/responses/Erro' },
          '404': { $ref: '#/components/responses/Erro' },
        },
      },
    },
    '/api/tickets/{token}/pagamentos': {
      post: {
        tags: ['Cliente'],
        summary: 'Pagar estadia e abrir janela de 10 minutos',
        parameters: [{ $ref: '#/components/parameters/Token' }],
        responses: {
          '200': {
            description: 'Pagamento registrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Pagamento' } } },
          },
          '400': { $ref: '#/components/responses/Erro' },
          '404': { $ref: '#/components/responses/Erro' },
          '409': { $ref: '#/components/responses/Erro' },
        },
      },
    },
    '/api/tickets/{token}/multas': {
      post: {
        tags: ['Cliente'],
        summary: 'Pagar multa de 15% e reabrir janela de saída',
        parameters: [{ $ref: '#/components/parameters/Token' }],
        responses: {
          '200': {
            description: 'Multa paga',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/MultaPaga' } } },
          },
          '404': { $ref: '#/components/responses/Erro' },
          '409': { $ref: '#/components/responses/Erro' },
        },
      },
    },
    '/api/saida': {
      post: {
        tags: ['Catraca'],
        summary: 'Validar token na saída',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SaidaRequest' },
              example: { token: 'U3T98LX' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Saída liberada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SaidaResponse' } } },
          },
          '400': { $ref: '#/components/responses/Erro' },
          '402': { $ref: '#/components/responses/Erro' },
          '404': { $ref: '#/components/responses/Erro' },
          '409': { $ref: '#/components/responses/ErroComMulta' },
        },
      },
    },
  },
  components: {
    parameters: {
      Token: {
        name: 'token',
        in: 'path',
        required: true,
        schema: { type: 'string', pattern: '^[A-Z0-9]{7}$', example: 'U3T98LX' },
      },
      Placa: {
        name: 'placa',
        in: 'path',
        required: true,
        schema: { type: 'string', example: 'ABC-1234' },
      },
    },
    schemas: {
      Erro: {
        type: 'object',
        required: ['erro', 'mensagem'],
        properties: {
          erro: { type: 'string', example: 'PLACA_INVALIDA' },
          mensagem: { type: 'string' },
          valorMulta: { type: 'number', example: 1.5 },
        },
      },
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          db: { type: 'string', enum: ['connected', 'disconnected'] },
        },
      },
      EntradaRequest: {
        type: 'object',
        required: ['placa', 'motoristaNome'],
        properties: {
          placa: { type: 'string', example: 'ABC-1234' },
          motoristaNome: { type: 'string', example: 'Ana Souza' },
          modelo: { type: 'string', example: 'Onix' },
          cor: { type: 'string', example: 'Prata' },
        },
      },
      EntradaResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          placa: { type: 'string' },
          motoristaNome: { type: 'string' },
          modelo: { type: 'string', nullable: true },
          cor: { type: 'string', nullable: true },
          token: { type: 'string', example: 'U3T98LX' },
          loginUrl: { type: 'string', example: 'http://localhost:5173/?token=U3T98LX' },
          entradaEm: { type: 'string', format: 'date-time' },
          status: { type: 'string', example: 'ativo' },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          placa: { type: 'string' },
          motoristaNome: { type: 'string' },
          entradaEm: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['ativo', 'pago', 'multa_pendente'] },
          duracaoMinutos: { type: 'integer' },
          valorAtual: { type: 'number' },
          valorMulta: { type: 'number', nullable: true },
          janelaSaidaExpiraEm: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Pagamento: {
        type: 'object',
        properties: {
          valorCobrado: { type: 'number', example: 10 },
          pagoEm: { type: 'string', format: 'date-time' },
          status: { type: 'string', example: 'pago' },
          janelaSaidaExpiraEm: { type: 'string', format: 'date-time' },
        },
      },
      MultaPaga: {
        type: 'object',
        properties: {
          valorMulta: { type: 'number', example: 1.5 },
          pagoEm: { type: 'string', format: 'date-time' },
          status: { type: 'string', example: 'pago' },
          janelaSaidaExpiraEm: { type: 'string', format: 'date-time' },
        },
      },
      SaidaRequest: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string', example: 'U3T98LX' } },
      },
      SaidaResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          placa: { type: 'string' },
          entradaEm: { type: 'string', format: 'date-time' },
          saidaEm: { type: 'string', format: 'date-time' },
          duracaoMinutos: { type: 'integer' },
          valorCobrado: { type: 'number' },
          status: { type: 'string', example: 'finalizado' },
        },
      },
      Ativo: {
        type: 'object',
        properties: {
          placa: { type: 'string' },
          motoristaNome: { type: 'string' },
          token: { type: 'string' },
          entradaEm: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          tempoDecorridoMinutos: { type: 'integer' },
        },
      },
      HistoricoItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          placa: { type: 'string' },
          entradaEm: { type: 'string', format: 'date-time' },
          saidaEm: { type: 'string', format: 'date-time', nullable: true },
          valorCobrado: { type: 'number', nullable: true },
          status: { type: 'string', example: 'finalizado' },
        },
      },
    },
    responses: {
      Erro: {
        description: 'Erro de negócio ou validação',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
      },
      ErroComMulta: {
        description: 'Janela de saída expirada',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
      },
    },
  },
} as const;
