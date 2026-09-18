import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React Compiler no esta habilitado en este proyecto (next.config.ts no
      // define experimental.reactCompiler); estos diagnosticos de preparacion
      // para el compilador no aplican a un patron estandar y verificado
      // (resetear un formulario cuando un dialogo se abre).
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/incompatible-library": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
