const CPF_LENGTH = 11;
const CPF_ALL_SAME_DIGITS = /^(\d)\1{10}$/;

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
