const API = "/api/persons";

const form = document.querySelector("#person-form");
const idField = document.querySelector("#person-id");
const cpfField = document.querySelector("#cpf");
const nomeField = document.querySelector("#nome");
const birthField = document.querySelector("#dataNascimento");
const feedback = document.querySelector("#feedback");
const rows = document.querySelector("#person-rows");
const emptyState = document.querySelector("#empty-state");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-button");

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("error", isError);
}

function formatCpf(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;

  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Falha na requisição");

  return body;
}

function resetForm() {
  form.reset();
  idField.value = "";
  submitButton.textContent = "Cadastrar";
  cancelButton.hidden = true;
}

function render(persons) {
  rows.replaceChildren();
  emptyState.hidden = persons.length > 0;

  for (const person of persons) {
    const row = document.createElement("tr");

    for (const value of [
      formatCpf(person.cpf),
      person.nome,
      person.dataNascimento,
      String(person.idade),
    ]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }

    const actions = document.createElement("td");
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "ghost";
    editButton.textContent = "Editar";
    editButton.addEventListener("click", () => startEdit(person));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";
    deleteButton.addEventListener("click", () => removePerson(person));

    actions.append(editButton, deleteButton);
    row.append(actions);
    rows.append(row);
  }
}

async function load() {
  try {
    render(await request(API));
  } catch (error) {
    showFeedback(error.message, true);
  }
}

function startEdit(person) {
  idField.value = person.id;
  cpfField.value = formatCpf(person.cpf);
  nomeField.value = person.nome;
  birthField.value = person.dataNascimento;
  submitButton.textContent = "Salvar";
  cancelButton.hidden = false;
  nomeField.focus();
  showFeedback(`Editando ${person.nome}`);
}

async function removePerson(person) {
  if (!confirm(`Excluir ${person.nome}?`)) return;

  try {
    await request(`${API}/${person.id}`, { method: "DELETE" });
    showFeedback("Pessoa excluída.");
    await load();
  } catch (error) {
    showFeedback(error.message, true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    cpf: cpfField.value,
    nome: nomeField.value,
    dataNascimento: birthField.value,
  };
  const id = idField.value;

  try {
    await request(id ? `${API}/${id}` : API, {
      method: id ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    showFeedback(id ? "Pessoa atualizada." : "Pessoa cadastrada.");
    resetForm();
    await load();
  } catch (error) {
    showFeedback(error.message, true);
  }
});

cancelButton.addEventListener("click", () => {
  resetForm();
  showFeedback("");
});

load();
