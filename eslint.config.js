import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "evidencias/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: { ecmaVersion: 2024, sourceType: "module", globals: { ...globals.node } },
    rules: { eqeqeq: "error", "no-var": "error", "prefer-const": "error" },
  },
  {
    files: ["public/**/*.js"],
    languageOptions: { globals: { ...globals.browser } },
  },
];
