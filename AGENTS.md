# Repository Guidelines

## Project Structure & Module Organization
This Expo project uses a pragmatic clean architecture so routing, UI, business logic, and persistence stay separated as the app grows.

- `src/app` contains Expo Router route files and layout entry points; keep these files thin and focused on navigation.
- `src/core` contains app-wide technical setup such as providers, runtime configuration, database bootstrap, and global shell state.
- `src/core/config` stores app configuration and environment-derived values used across the project.
- `src/core/database` stores database bootstrap code, migration entry points, and shared persistence setup.
- `src/core/providers` stores React providers mounted near the app root.
- `src/core/store` stores global Zustand state that is not owned by a single feature.
- `src/shared` contains reusable code that can be used by any feature without carrying feature-specific rules.
- `src/shared/constants` stores app-wide constants that are not tied to one feature.
- `src/shared/lib` stores pure helper functions, formatters, and utility code.
- `src/shared/theme` stores design tokens, theme primitives, and styling foundations.
- `src/shared/types` stores shared cross-feature TypeScript types.
- `src/shared/ui` stores reusable UI building blocks shared across features.
- `src/shared/ui/primitives` stores low-level UI elements such as buttons, inputs, cards, and text wrappers.
- `src/shared/ui/layout` stores layout helpers such as shells, sections, wrappers, and spacing structures.
- `src/features` contains vertical feature slices so business logic and screens evolve together by domain.
- `src/features/calculator` contains the main B2B calculator feature for the MVP.
- `src/features/calculator/domain` stores pure calculator business models and rules with no React or storage dependencies.
- `src/features/calculator/domain/entities` stores core domain models such as income sources, costs, tax settings, and result aggregates.
- `src/features/calculator/domain/value-objects` stores constrained business values such as money, VAT rate, tax form, and ZUS status.
- `src/features/calculator/domain/services` stores pure calculation logic and tax rule engines.
- `src/features/calculator/domain/repositories` stores repository contracts that describe required persistence behavior.
- `src/features/calculator/application` stores feature orchestration that coordinates domain logic for app use cases.
- `src/features/calculator/application/use-cases` stores user-driven actions such as calculate results, save drafts, or reset state.
- `src/features/calculator/application/services` stores application-level services that combine repositories and domain services.
- `src/features/calculator/infrastructure` stores concrete technical implementations for persistence and mapping.
- `src/features/calculator/infrastructure/sqlite` stores calculator-specific SQLite integration details.
- `src/features/calculator/infrastructure/repositories` stores repository implementations backed by SQLite or other local storage.
- `src/features/calculator/infrastructure/mappers` stores mapping code between storage records and domain models.
- `src/features/calculator/presentation` stores UI code for the calculator feature.
- `src/features/calculator/presentation/screens` stores full screen components rendered by route files.
- `src/features/calculator/presentation/components` stores calculator-specific UI sections and composed view pieces.
- `src/features/calculator/presentation/hooks` stores feature-specific React hooks for UI behavior.
- `src/features/calculator/presentation/view-models` stores UI-facing data shaping between use cases and screen components.
- `src/features/settings` stores settings and preferences screens added later.
- `src/features/settings/presentation` stores UI code for settings-related screens and components.
- `src/features/shared` stores future shared domain pieces that are common across multiple features.
- `src/components`, `src/constants`, and `src/hooks` are starter folders kept temporarily for compatibility and should be migrated gradually into `src/shared` or `src/features`.
- `src/global.css` stores global web styling used by the Expo web target.
- `assets/images` stores image assets used by the application.
- `assets/expo.icon` stores Expo icon assets and related branding files.
- `docs` stores product notes, feature definitions, UI references, and architecture documents.
- `android` stores generated native Android project files.

### Architecture Conventions
- Route files in `src/app` should import screens from `src/features/*/presentation/screens` instead of holding feature logic inline.
- Business logic, calculation rules, and domain models must stay outside UI folders.
- SQLite, storage adapters, and external integrations must stay inside `infrastructure` or `core/database`.
- Shared code in `src/shared` must remain generic and must not depend on calculator-specific rules.
- New functionality should default to a feature-first structure inside `src/features/<feature>`.

## Build, Test, and Development Commands
Use `npm install` to sync dependencies. `npm run start` launches Expo locally, and `npm run web` starts the web target. `npm run android` builds and runs the Android app through Expo. `npm run lint` runs the Expo lint configuration and should pass before opening a PR. `npm run reset-project` restores the starter scaffold and should only be used intentionally.

## Coding Style & Naming Conventions
This project uses TypeScript with `strict` mode enabled in [`tsconfig.json`](C:/Playground/krona/tsconfig.json). Follow the existing style: 2-space indentation, semicolons, single quotes, and grouped imports with `@/` path aliases. Use PascalCase for React components (`ThemedView.tsx`), camelCase for hooks and helpers (`useTheme.ts`), and kebab-case only for asset-style filenames such as `animated-icon.module.css`. Prefer functional components and keep route files aligned with Expo Router naming.

## Testing Guidelines
There is no automated test suite configured yet. Until Jest or Expo testing is added, treat `npm run lint`, `npm run web`, and a manual smoke test on Android as the minimum validation path. When adding tests, place them beside the feature or in a nearby `__tests__` folder and use `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Recent history uses short Conventional Commit prefixes such as `feat:`, `fix:`, and `scaffold`. Keep subjects imperative and specific, for example `fix: update Android run script`. Pull requests should include a concise description, linked issue or task when available, and screenshots for UI changes. Note any doc updates in `docs/` when behavior or flows change.

## Configuration Notes
Do not commit secrets or local machine settings. Keep Expo configuration changes in `app.json`, and prefer updating shared theme values in `src/shared/theme` or [`src/constants/theme.ts`](C:/Playground/krona/src/constants/theme.ts) until the migration is complete instead of scattering hard-coded colors or spacing.
