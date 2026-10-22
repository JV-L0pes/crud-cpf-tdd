import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidCpf, normalizeCpf } from "../../src/domain/person.js";

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
