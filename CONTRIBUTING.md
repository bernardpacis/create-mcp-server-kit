# Contributing

Thanks for helping make this starter better.

## Development setup

- **Node.js**: 18+

```bash
npm install
npm run check
npm test
```

## Adding a new template

Templates live under `templates/<template-name>/`.

Required files:

- `package.json` (must contain `__PACKAGE_NAME__` and `__DESCRIPTION__`)
- `README.md` (must contain `__PROJECT_NAME__`)
- `gitignore` (will be renamed to `.gitignore` when copied)

Notes:

- Prefer **official MCP SDK** patterns.
- Keep templates runnable with **one command** (`npm run dev`).


