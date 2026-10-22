import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { calculateAge, validatePersonInput } from "./domain/person.js";

const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

function toResponse(person) {
  return { ...person, idade: calculateAge(person.dataNascimento) };
}

export function createApp(repository) {
  const app = express();
  app.use(express.json());
  app.use(express.static(publicDirectory));

  app.get("/health", (request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/persons", (request, response) => {
    response.json(repository.list().map(toResponse));
  });

  app.post("/api/persons", (request, response) => {
    const result = validatePersonInput(request.body);
    if (!result.valid) {
      return response.status(400).json({ error: "Dados inválidos", campos: result.errors });
    }
    if (repository.findByCpf(result.value.cpf)) {
      return response.status(409).json({ error: "CPF já cadastrado" });
    }

    return response.status(201).json(toResponse(repository.create(result.value)));
  });

  app.get("/api/persons/:id", (request, response) => {
    const person = repository.findById(request.params.id);
    if (!person) return response.status(404).json({ error: "Pessoa não encontrada" });

    return response.json(toResponse(person));
  });

  app.put("/api/persons/:id", (request, response) => {
    const current = repository.findById(request.params.id);
    if (!current) return response.status(404).json({ error: "Pessoa não encontrada" });

    const result = validatePersonInput({ ...current, ...request.body });
    if (!result.valid) {
      return response.status(400).json({ error: "Dados inválidos", campos: result.errors });
    }

    const duplicated = repository.findByCpf(result.value.cpf);
    if (duplicated && duplicated.id !== current.id) {
      return response.status(409).json({ error: "CPF já cadastrado" });
    }

    return response.json(toResponse(repository.update(current.id, result.value)));
  });

  app.delete("/api/persons/:id", (request, response) => {
    if (!repository.remove(request.params.id)) {
      return response.status(404).json({ error: "Pessoa não encontrada" });
    }

    return response.status(204).end();
  });

  app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && "body" in error) {
      return response.status(400).json({ error: "JSON inválido" });
    }

    return next(error);
  });

  return app;
}
