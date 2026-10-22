import { createApp } from "./app.js";
import { createPersonRepository } from "./repository.js";

const port = Number(process.env.PORT ?? 3000);

createApp(createPersonRepository()).listen(port, () => {
  console.log(`crud-cpf-tdd listening on http://localhost:${port}`);
});
