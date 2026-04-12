# Krona

Krona is an Expo Router application for B2B finance workflows, structured with a feature-first clean architecture.

## Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run start
```

Use the platform scripts when needed:

```bash
npm run web
npm run android
npm run ios
```

Lint the project:

```bash
npm run lint
```

Recommended day-to-day workflow:

```bash
npm run dev
npm run dev:client
npm run typecheck
npm run doctor
```

Internal build and update commands:

```bash
npm run build:android:development
npm run build:android:preview
npm run update:preview
```

See [docs/development-workflow.md](/C:/Playground/krona/docs/development-workflow.md) for the full Expo development workflow used in this repository.

## Structure

- `src/app` contains route entrypoints only.
- `src/shared` contains reusable theme and UI primitives.
- `src/features` contains vertical slices for app features and screens.
- `docs` contains product, design, and UI reference material.
