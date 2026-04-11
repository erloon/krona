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

## Structure

- `src/app` contains route entrypoints only.
- `src/shared` contains reusable theme and UI primitives.
- `src/features` contains vertical slices for app features and screens.
- `docs` contains product, design, and UI reference material.
