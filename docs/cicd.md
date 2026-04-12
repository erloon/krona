# CI/CD Setup

This repository now supports a branch-based Expo deployment flow through GitHub Actions.

## Branch Strategy

- `dev` is the integration branch for ongoing work.
- `main` is the production branch.
- Feature branches should open pull requests into `dev`.
- Releases should merge `dev` into `main` through a reviewed pull request.

## What Deploys Automatically

- Pushes and pull requests to `dev` or `main` run GitHub Actions CI (`lint` + `typecheck`).
- Pushes to `dev` publish an EAS Update to the `development` branch using the `development` EAS environment.
- Pushes to `main` publish an EAS Update to the `production` branch using the `production` EAS environment.

These automatic deployments are OTA updates. They are appropriate for JavaScript, styling, assets, and other changes that do not require a new native binary.

## App Variants

The app now uses `APP_VARIANT` to separate build identities:

- `development` -> `com.sparkdatapl.krona.dev`
- `preview` -> `com.sparkdatapl.krona.preview`
- `production` -> `com.sparkdatapl.krona`

This prevents development and preview builds from overwriting the production app on a device.

## Required GitHub Secrets

Create these secrets before enabling the deployment workflows:

- `EXPO_TOKEN`: Expo personal access token with access to the `sparkdatapl/krona` project.

If you later automate store submissions, add the platform-specific secrets or connect credentials in EAS first.

## Required GitHub Environments

Create two GitHub environments:

- `development`
- `production`

At minimum, use them for visibility. For stronger controls, require approvals on `production`.

## Required Expo Setup

Before relying on CI/CD, confirm these are already completed in Expo:

1. The EAS project is initialized and linked to this repository's project ID.
2. At least one successful local build has already run for each target platform and profile you want CI to use.
3. EAS environment variables are configured separately for the `development`, `preview`, and `production` environments when needed.

## Recommended GitHub Repository Rules

- Protect `main` against direct pushes.
- Protect `dev` against force pushes.
- Require pull requests for merges into `main`.
- Require the `CI` workflow to pass before merging into `dev` or `main`.

## Recommended Release Process

1. Developers branch from `dev`.
2. Pull requests merge into `dev`.
3. `dev` automatically publishes development OTA updates for internal testing.
4. When ready to release, open a pull request from `dev` to `main`.
5. After merge, `main` automatically publishes the production OTA update.
6. Trigger native store builds separately when the release includes native changes.

## What Else You Still Need

For professional app delivery, the workflows in this repository are only part of the setup. You should also have:

- Apple Developer and Google Play release credentials configured in EAS.
- A deliberate native release process for changes that require a new binary.
- Branch protection rules in GitHub.
- A rollback plan for production updates.
- Clear ownership over Expo and store credentials.
