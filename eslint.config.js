import tseslint from 'typescript-eslint';
import eslintConfigPrettier from "eslint-config-prettier";

import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import eslint from "@eslint/js";
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default tseslint.config(
    includeIgnoreFile(gitignorePath),
    eslintConfigPrettier,
    {
        ignores: [
          "**/test/*",
          "commitlint.config.cjs",
          "gulpfile.cjs"
        ],
      },{
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      tseslint.configs.eslintRecommended,
    ],
    rules: {
        '@typescript-eslint/no-explicit-any': ['warn'],
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                args: 'after-used',
                argsIgnorePattern: '_',
                ignoreRestSiblings: false,
                vars: 'all',
            },
        ],
    },
  },
);