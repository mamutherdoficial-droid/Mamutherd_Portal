import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
      "lib/supabase/tipos.ts",
      // Kit de marca: no se modifica (docs/mamut-herd/LEEME.md)
      "docs/mamut-herd/**",
    ],
  },
];

export default config;
