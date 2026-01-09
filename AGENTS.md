# Project Guidelines

---

## Package Management with Bun

This project uses **Bun** as the JavaScript package manager. Always use Bun instead of Node.js, npm, pnpm, or Vite.

### Core Commands

Default to using Bun for all JavaScript operations:

- **Install dependencies**: `bun install|add|remove` instead of `npm install`, `yarn install`, or `pnpm install`
- **Run scripts**: `bun run <script>` instead of `npm run <script>`, `yarn run <script>`, or `pnpm run <script>`
