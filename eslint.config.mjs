import importPlugin from "eslint-plugin-import";
import tsEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

const eslintConfig = [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsEslint,
      import: importPlugin,
    },
    rules: {
      ...prettier.rules,
      quotes: ["error", "double"],
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
