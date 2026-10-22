import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateAge,
  isValidCpf,
  normalizeCpf,
  parseBirthDate,
  validatePersonInput,
} from "../../src/domain/person.js";

describe("normalizeCpf", () => {
  it("remove pontuacao e mantem apenas digitos", () => {
    assert.equal(normalizeCpf("529.982.247-25"), "52998224725");
  });

  it("devolve string vazia para entrada nula", () => {
    assert.equal(normalizeCpf(null), "");
  });
});

describe("isValidCpf", () => {
  it("aceita CPF com digitos verificadores corretos", () => {
    assert.equal(isValidCpf("52998224725"), true);
  });

  it("aceita CPF pontuado", () => {
    assert.equal(isValidCpf("529.982.247-25"), true);
  });

  it("recusa CPF com digito verificador errado", () => {
    assert.equal(isValidCpf("52998224724"), false);
  });

  it("recusa CPF com todos os digitos iguais", () => {
    assert.equal(isValidCpf("11111111111"), false);
  });

  it("recusa CPF com tamanho diferente de 11", () => {
    assert.equal(isValidCpf("5299822472"), false);
    assert.equal(isValidCpf("529982247250"), false);
  });

  it("recusa entrada vazia ou nao numerica", () => {
    assert.equal(isValidCpf(""), false);
    assert.equal(isValidCpf("abcdefghijk"), false);
  });
});

describe("parseBirthDate", () => {
  it("aceita data no formato YYYY-MM-DD", () => {
    assert.equal(parseBirthDate("1990-05-20").toISOString(), "1990-05-20T00:00:00.000Z");
  });

  it("recusa formato ambíguo ou inexistente", () => {
    assert.equal(parseBirthDate("20/05/1990"), null);
    assert.equal(parseBirthDate("1990-02-30"), null);
    assert.equal(parseBirthDate(""), null);
  });
});

describe("calculateAge", () => {
  const today = new Date("2026-10-22T12:00:00.000Z");

  it("conta ano completo no dia do aniversario", () => {
    assert.equal(calculateAge("1990-10-22", today), 36);
  });

  it("nao adianta o ano na vespera do aniversario", () => {
    assert.equal(calculateAge("1990-10-23", today), 35);
  });

  it("calcula idade de nascido em 29 de fevereiro", () => {
    assert.equal(calculateAge("2000-02-29", new Date("2026-02-28T12:00:00.000Z")), 25);
    assert.equal(calculateAge("2000-02-29", new Date("2026-03-01T12:00:00.000Z")), 26);
  });

  it("devolve null para data invalida", () => {
    assert.equal(calculateAge("1990-02-30", today), null);
  });
});

describe("validatePersonInput", () => {
  const today = new Date("2026-10-22T12:00:00.000Z");
  const valid = { cpf: "529.982.247-25", nome: "  Maria Silva  ", dataNascimento: "1990-05-20" };

  it("normaliza cpf e nome quando o payload e valido", () => {
    assert.deepEqual(validatePersonInput(valid, { today }), {
      valid: true,
      value: { cpf: "52998224725", nome: "Maria Silva", dataNascimento: "1990-05-20" },
    });
  });

  it("acumula erros por campo", () => {
    const result = validatePersonInput(
      { cpf: "11111111111", nome: "M", dataNascimento: "2999-01-01" },
      { today },
    );

    assert.equal(result.valid, false);
    assert.deepEqual(Object.keys(result.errors), ["cpf", "nome", "dataNascimento"]);
  });

  it("recusa data de nascimento futura", () => {
    const result = validatePersonInput({ ...valid, dataNascimento: "2026-10-23" }, { today });

    assert.equal(result.valid, false);
    assert.match(result.errors.dataNascimento, /futura/);
  });

  it("aceita nascimento no dia de hoje", () => {
    const result = validatePersonInput({ ...valid, dataNascimento: "2026-10-22" }, { today });

    assert.equal(result.valid, true);
  });

  it("recusa payload ausente", () => {
    assert.equal(validatePersonInput(undefined, { today }).valid, false);
  });
});
