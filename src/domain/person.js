const CPF_LENGTH = 11;
const CPF_ALL_SAME_DIGITS = /^(\d)\1{10}$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const NAME_MIN_LENGTH = 2;

export function normalizeCpf(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function isValidCpf(value) {
  const cpf = normalizeCpf(value);
  if (cpf.length !== CPF_LENGTH || CPF_ALL_SAME_DIGITS.test(cpf)) return false;

  const digits = cpf.split("").map(Number);
  for (const position of [9, 10]) {
    const sum = digits
      .slice(0, position)
      .reduce((total, digit, index) => total + digit * (position + 1 - index), 0);
    const checkDigit = ((sum * 10) % 11) % 10;
    if (checkDigit !== digits[position]) return false;
  }

  return true;
}

export function parseBirthDate(value) {
  if (typeof value !== "string") return null;

  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

  return isRealDate ? date : null;
}

function toUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function calculateAge(dataNascimento, today = new Date()) {
  const birth = parseBirthDate(dataNascimento);
  if (!birth) return null;

  const reference = toUtcDay(today);
  let age = reference.getUTCFullYear() - birth.getUTCFullYear();
  const hadBirthdayThisYear =
    reference.getUTCMonth() > birth.getUTCMonth() ||
    (reference.getUTCMonth() === birth.getUTCMonth() &&
      reference.getUTCDate() >= birth.getUTCDate());

  if (!hadBirthdayThisYear) age -= 1;

  return age;
}

export function validatePersonInput(input, { today = new Date() } = {}) {
  const errors = {};
  const cpf = normalizeCpf(input?.cpf);

  if (!isValidCpf(cpf)) errors.cpf = "CPF inválido";

  const nome = typeof input?.nome === "string" ? input.nome.trim() : "";
  if (nome.length < NAME_MIN_LENGTH) errors.nome = "Nome deve ter ao menos 2 caracteres";

  const birth = parseBirthDate(input?.dataNascimento);
  if (!birth) {
    errors.dataNascimento = "Data de nascimento inválida";
  } else if (birth > today) {
    errors.dataNascimento = "Data de nascimento não pode ser futura";
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors };

  return { valid: true, value: { cpf, nome, dataNascimento: input.dataNascimento } };
}
