/**
 * Conventional Commits con descripción en español.
 * Ejemplo: feat(products): agregar filtro por categoría
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "body-max-line-length": [1, "always", 120],
  },
};

export default config;
