import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".sites-runtime/**",
    ".gitnexus/**",
    ".wrangler/**",
    "vendor/**",
    "next-env.d.ts",
  ]),
  {
    // Existing map/coordination effects predate this auth change. Surface them
    // as warnings without weakening the rules for new account/session code.
    files: ["components/coordination.tsx", "components/open-work.tsx", "components/global-map.tsx"],
    rules: {"react-hooks/set-state-in-effect": "warn", "react-hooks/refs": "warn"},
  },
  {
    files: ["app/hub.tsx"],
    rules: {"@next/next/no-html-link-for-pages": "warn"},
  },
  {
    files: ["components/ui/**/*.{ts,tsx}", "hooks/use-mobile.ts"],
    rules: {
      // These files are vendored verbatim from shadcn@4.17.0. Keep the
      // registry source intact while applying the stricter rules to Site code.
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
