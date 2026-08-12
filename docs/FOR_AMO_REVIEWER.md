# Build Steps for Reviewers

1. Install Node.js 24.
2. Enable the pnpm version declared in `package.json`.
   ```sh
   $ corepack enable
   ```
3. Install dependencies.
   ```sh
   $ pnpm install --frozen-lockfile
   ```
4. Build the project.
   ```sh
   $ pnpm run build
   ```
