import { randomUUID } from "node:crypto";

export function createPersonRepository() {
  const people = new Map();

  return {
    create(data) {
      const person = { id: randomUUID(), ...data };
      people.set(person.id, person);
      return person;
    },
    list() {
      return [...people.values()];
    },
    findById(id) {
      return people.get(id) ?? null;
    },
    findByCpf(cpf) {
      return [...people.values()].find((person) => person.cpf === cpf) ?? null;
    },
    update(id, data) {
      const current = people.get(id);
      if (!current) return null;

      const updated = { ...current, ...data, id };
      people.set(id, updated);
      return updated;
    },
    remove(id) {
      return people.delete(id);
    },
  };
}
