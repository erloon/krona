# Development Workflow

This project is an Expo Router application with a local-first architecture. The development flow should optimize for fast UI iteration first, then move to development builds only when native behavior matters.

## Recommended Flow

1. Start with Expo Go for UI work, navigation, layout, and most JavaScript-only changes.
2. Switch to the dev client when testing native integrations, authentication edge cases, or anything that differs from Expo Go.
3. Use preview APK builds when you need to share an installable Android build with another tester.
4. Use production builds only for release candidates and store distribution.

## Local Commands

Install dependencies:

```bash
npm install
```

Fast local development:

```bash
npm run dev
```

Open the web target:

```bash
npm run dev:web
```

Use a development client:

```bash
npm run dev:client
```

Native run commands:

```bash
npm run android
npm run ios
```

Project health checks:

```bash
npm run lint
npm run typecheck
npm run doctor
```

## When To Use Expo Go vs Dev Client

Use Expo Go when:

- You are changing screens, presentation components, hooks, routing, or pure TypeScript logic.
- The feature does not depend on new native modules or native configuration changes.
- You want the fastest edit-refresh loop.

Use the dev client when:

- You need behavior closer to the final native app.
- You are validating native modules, deep-linking, or platform-specific behavior.
- Expo Go behaves differently than the installed native build.

This repository already includes `expo-dev-client`, and the app root imports it so development-build errors are surfaced earlier.

## EAS Build Profiles

`development`

- Internal distribution
- Development client enabled
- Uses the `development` update channel
- Best for ongoing developer testing on devices

`preview`

- Internal distribution
- Android APK output for easy sharing
- Uses the `preview` update channel
- Best for QA and stakeholder installs

`production`

- Store-oriented build profile
- Uses the `production` update channel
- Auto-increments app version metadata in EAS

## Build Commands

Android development client:

```bash
npm run build:android:development
```

Android preview APK:

```bash
npm run build:android:preview
```

Android production build:

```bash
npm run build:android:production
```

iOS development build:

```bash
npm run build:ios:development
```

iOS production build:

```bash
npm run build:ios:production
```

## OTA Updates

Push a preview update:

```bash
npm run update:preview
```

Push a production update:

```bash
npm run update:production
```

Only use OTA updates for JavaScript, asset, and configuration changes that are compatible with the installed native runtime.

## EAS Workflows

The repository includes three EAS workflows:

- `.eas/workflows/ci.yml` runs lint and typecheck on pull requests to `main` and on pushes to `main`.
- `.eas/workflows/development-build.yml` creates a manual Android development client build.
- `.eas/workflows/preview-build.yml` creates a manual Android preview APK build.

These workflows intentionally avoid automatic release or OTA publication. For this project, internal validation should stay explicit until the calculator logic and release process stabilize.
