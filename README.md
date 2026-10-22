# crud-cpf-tdd

CRUD de pessoas com CPF, nome e data de nascimento, com idade calculada a partir da data — nunca armazenada.

![CI](https://github.com/JV-L0pes/crud-cpf-tdd/actions/workflows/ci.yml/badge.svg)

## Stack

- Node.js 22+ (ESM)
- Express 5
- `node:test` para testes unitários e de integração
- ESLint 9 (flat config) e Prettier
- Docker (multi-stage, non-root)
- GitHub Actions

## Como rodar

```bash
npm ci
npm start
```

Aplicação em `http://localhost:3000`.

## Scripts

| Script                 | Descrição                        |
| ---------------------- | -------------------------------- |
| `npm start`            | Sobe o servidor                  |
| `npm run dev`          | Sobe com `--watch`               |
| `npm test`             | Testes unitários e de integração |
| `npm run lint`         | Análise estática                 |
| `npm run format`       | Formata o código                 |
| `npm run format:check` | Verifica a formatação            |
| `npm run verify`       | Formatação + lint + testes       |

## API

| Método   | Rota               | Descrição                         |
| -------- | ------------------ | --------------------------------- |
| `GET`    | `/health`          | Healthcheck                       |
| `GET`    | `/api/persons`     | Lista pessoas com idade calculada |
| `POST`   | `/api/persons`     | Cria pessoa                       |
| `GET`    | `/api/persons/:id` | Busca por id                      |
| `PUT`    | `/api/persons/:id` | Atualiza campos enviados          |
| `DELETE` | `/api/persons/:id` | Remove pessoa                     |

```bash
curl -X POST http://localhost:3000/api/persons \
  -H "content-type: application/json" \
  -d '{"cpf":"529.982.247-25","nome":"Maria Silva","dataNascimento":"1990-05-20"}'
```

Resposta:

```json
{
  "id": "8b1f...",
  "cpf": "52998224725",
  "nome": "Maria Silva",
  "dataNascimento": "1990-05-20",
  "idade": 36
}
```

Erros: `400` payload inválido (com `campos` por field), `404` pessoa inexistente, `409` CPF duplicado.

## Regras

- CPF validado pelos dígitos verificadores, normalizado para 11 dígitos.
- Nome obrigatório, mínimo 2 caracteres.
- Data de nascimento no formato `YYYY-MM-DD`, não futura.
- Idade calculada em toda leitura, considerando o dia do aniversário como completo.

## Docker

```bash
docker build -t crud-cpf-tdd .
docker run --rm -p 3000:3000 crud-cpf-tdd
```

Imagem multi-stage (`node:24-alpine`), usuário `node` (não-root) e `HEALTHCHECK` em `/health`.

## CI

`.github/workflows/ci.yml` roda em push na `main` e em pull request:

1. `npm ci`
2. `npm run format:check` — formatação
3. `npm run lint` — análise estática
4. `npm test` — testes unitários e de integração (Node 22 e 24)
5. `docker build` — imagem

## Estrutura

```
src/domain/person.js   validacao e calculo de idade (puro)
src/repository.js      CRUD em memoria
src/app.js             rotas Express
src/server.js          bootstrap
public/                front monocromatico
test/unit/             testes de dominio e repositorio
test/integration/      testes HTTP
.github/workflows/     pipeline de CI
```
