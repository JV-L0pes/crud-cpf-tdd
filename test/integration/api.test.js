import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { createApp } from "../../src/app.js";
import { createPersonRepository } from "../../src/repository.js";

const validPayload = {
  cpf: "529.982.247-25",
  nome: "Maria Silva",
  dataNascimento: "1990-05-20",
};
const secondPayload = { cpf: "168.995.350-09", nome: "Joao Souza", dataNascimento: "1985-01-10" };

let server;
let baseUrl;
let repository;

before(async () => {
  repository = createPersonRepository();
  server = createApp(repository).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

beforeEach(() => {
  for (const person of repository.list()) repository.remove(person.id);
});

describe("GET /health", () => {
  it("responde ok", async () => {
    const response = await fetch(`${baseUrl}/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

describe("POST /api/persons", () => {
  it("cria pessoa e devolve idade calculada", async () => {
    const response = await fetch(`${baseUrl}/api/persons`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.cpf, "52998224725");
    assert.equal(body.nome, "Maria Silva");
    assert.equal(typeof body.idade, "number");
    assert.ok(body.id);
    assert.equal(body.idade, expectedAge("1990-05-20"));
  });

  it("recusa payload invalido com 400 e erros por campo", async () => {
    const response = await fetch(`${baseUrl}/api/persons`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cpf: "11111111111", nome: "", dataNascimento: "2999-01-01" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "Dados inválidos");
    assert.deepEqual(Object.keys(body.campos).sort(), ["cpf", "dataNascimento", "nome"]);
  });

  it("recusa json malformado com 400", async () => {
    const response = await fetch(`${baseUrl}/api/persons`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ nao e json",
    });

    assert.equal(response.status, 400);
  });

  it("recusa cpf duplicado com 409", async () => {
    await createPerson(validPayload);
    const response = await fetch(`${baseUrl}/api/persons`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validPayload, nome: "Outra Pessoa" }),
    });

    assert.equal(response.status, 409);
  });

  it("recusa cpf com tipo inesperado com 400 em json", async () => {
    const response = await fetch(`${baseUrl}/api/persons`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validPayload, cpf: { toString: null } }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.ok(body.campos.cpf);
  });
});

describe("GET /api/persons", () => {
  it("lista vazio no inicio", async () => {
    const response = await fetch(`${baseUrl}/api/persons`);

    assert.deepEqual(await response.json(), []);
  });

  it("lista pessoas criadas com idade", async () => {
    await createPerson(validPayload);
    const response = await fetch(`${baseUrl}/api/persons`);
    const body = await response.json();

    assert.equal(body.length, 1);
    assert.equal(body[0].idade, expectedAge("1990-05-20"));
  });
});

describe("GET /api/persons/:id", () => {
  it("devolve a pessoa criada", async () => {
    const created = await createPerson(validPayload);
    const response = await fetch(`${baseUrl}/api/persons/${created.id}`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.id, created.id);
  });

  it("devolve 404 para id inexistente", async () => {
    const response = await fetch(`${baseUrl}/api/persons/nao-existe`);

    assert.equal(response.status, 404);
  });
});

describe("PUT /api/persons/:id", () => {
  it("atualiza apenas o nome enviado", async () => {
    const created = await createPerson(validPayload);
    const response = await fetch(`${baseUrl}/api/persons/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nome: "Maria Souza" }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.nome, "Maria Souza");
    assert.equal(body.cpf, created.cpf);
  });

  it("devolve 404 para id inexistente", async () => {
    const response = await fetch(`${baseUrl}/api/persons/nao-existe`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nome: "Maria Souza" }),
    });

    assert.equal(response.status, 404);
  });

  it("recusa cpf de outra pessoa com 409", async () => {
    const first = await createPerson(validPayload);
    const second = await createPerson(secondPayload);
    const response = await fetch(`${baseUrl}/api/persons/${second.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cpf: first.cpf }),
    });

    assert.equal(response.status, 409);
  });

  it("recusa atualizacao invalida com 400", async () => {
    const created = await createPerson(validPayload);
    const response = await fetch(`${baseUrl}/api/persons/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dataNascimento: "2999-01-01" }),
    });

    assert.equal(response.status, 400);
  });

  it("preserva o registro quando o cpf chega com tipo inesperado", async () => {
    const created = await createPerson(validPayload);
    const response = await fetch(`${baseUrl}/api/persons/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cpf: { toString: null } }),
    });

    assert.equal(response.status, 400);
    const stored = await fetch(`${baseUrl}/api/persons/${created.id}`).then((r) => r.json());
    assert.equal(stored.cpf, created.cpf);
  });
});

describe("DELETE /api/persons/:id", () => {
  it("remove e devolve 204", async () => {
    const created = await createPerson(validPayload);
    const response = await fetch(`${baseUrl}/api/persons/${created.id}`, { method: "DELETE" });

    assert.equal(response.status, 204);
    const missing = await fetch(`${baseUrl}/api/persons/${created.id}`);
    assert.equal(missing.status, 404);
  });

  it("devolve 404 para id inexistente", async () => {
    const response = await fetch(`${baseUrl}/api/persons/nao-existe`, { method: "DELETE" });

    assert.equal(response.status, 404);
  });
});

async function createPerson(payload) {
  const response = await fetch(`${baseUrl}/api/persons`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response.json();
}

function expectedAge(birthDate) {
  const [year, month, day] = birthDate.split("-").map(Number);
  const today = new Date();
  const age = today.getUTCFullYear() - year;
  const hadBirthday =
    today.getUTCMonth() > month - 1 ||
    (today.getUTCMonth() === month - 1 && today.getUTCDate() >= day);

  return hadBirthday ? age : age - 1;
}
