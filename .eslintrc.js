module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "preact",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended",
  ],
  ignorePatterns: ["build/"],
};
