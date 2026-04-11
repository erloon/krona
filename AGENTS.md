# Repository Guidelines

## Project Structure & Module Organization
`src/app` contains Expo Router screens and layouts such as [`src/app/_layout.tsx`](C:/Playground/krona/src/app/_layout.tsx) and [`src/app/index.tsx`](C:/Playground/krona/src/app/index.tsx). Reusable UI lives in `src/components`, shared theme tokens in `src/constants`, hooks in `src/hooks`, and global web styles in `src/global.css`. Static assets are under `assets/images` and `assets/expo.icon`. Product notes, feature specs, and UI references live in `docs/`. Native Android project files are generated in `android/`.

## Build, Test, and Development Commands
Use `npm install` to sync dependencies. `npm run start` launches Expo locally, and `npm run web` starts the web target. `npm run android` builds and runs the Android app through Expo. `npm run lint` runs the Expo lint configuration and should pass before opening a PR. `npm run reset-project` restores the starter scaffold and should only be used intentionally.

## Coding Style & Naming Conventions
This project uses TypeScript with `strict` mode enabled in [`tsconfig.json`](C:/Playground/krona/tsconfig.json). Follow the existing style: 2-space indentation, semicolons, single quotes, and grouped imports with `@/` path aliases. Use PascalCase for React components (`ThemedView.tsx`), camelCase for hooks and helpers (`useTheme.ts`), and kebab-case only for asset-style filenames such as `animated-icon.module.css`. Prefer functional components and keep route files aligned with Expo Router naming.

## Testing Guidelines
There is no automated test suite configured yet. Until Jest or Expo testing is added, treat `npm run lint`, `npm run web`, and a manual smoke test on Android as the minimum validation path. When adding tests, place them beside the feature or in a nearby `__tests__` folder and use `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Recent history uses short Conventional Commit prefixes such as `feat:`, `fix:`, and `scaffold`. Keep subjects imperative and specific, for example `fix: update Android run script`. Pull requests should include a concise description, linked issue or task when available, and screenshots for UI changes. Note any doc updates in `docs/` when behavior or flows change.

## Configuration Notes
Do not commit secrets or local machine settings. Keep Expo configuration changes in `app.json`, and prefer updating shared theme values in `src/constants/theme.ts` instead of scattering hard-coded colors or spacing.
