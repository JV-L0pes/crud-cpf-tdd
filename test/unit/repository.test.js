import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { createPersonRepository } from "../../src/repository.js";

const person = { cpf: "52998224725", nome: "Maria Silva", dataNascimento: "1990-05-20" };

describe("person repository", () => {
  let repository;

  beforeEach(() => {
    repository = createPersonRepository();
  });

  it("cria pessoa com id unico", () => {
    const created = repository.create(person);

    assert.ok(created.id);
    assert.equal(created.nome, "Maria Silva");
    assert.notEqual(repository.create(person).id, created.id);
  });

  it("lista todas as pessoas", () => {
    repository.create(person);

    assert.equal(repository.list().length, 1);
  });

  it("busca por id e por cpf", () => {
    const created = repository.create(person);

    assert.equal(repository.findById(created.id).cpf, person.cpf);
    assert.equal(repository.findByCpf(person.cpf).id, created.id);
  });

  it("devolve null quando nao encontra", () => {
    assert.equal(repository.findById("inexistente"), null);
    assert.equal(repository.findByCpf("00000000000"), null);
  });

  it("atualiza preservando o id", () => {
    const created = repository.create(person);
    const updated = repository.update(created.id, { nome: "Maria Souza" });

    assert.equal(updated.nome, "Maria Souza");
    assert.equal(updated.id, created.id);
    assert.equal(updated.cpf, person.cpf);
  });

  it("devolve null ao atualizar id inexistente", () => {
    assert.equal(repository.update("inexistente", { nome: "X" }), null);
  });

  it("remove pessoa existente", () => {
    const created = repository.create(person);

    assert.equal(repository.remove(created.id), true);
    assert.equal(repository.remove(created.id), false);
    assert.equal(repository.list().length, 0);
  });
});
