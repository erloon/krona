# Project Structure: Expo + Pragmatic Clean Architecture

## Goal
This structure keeps Expo Router simple, while separating business rules, models, and persistence so the app can grow without mixing screen code with calculations.

It is designed for:
- easy addition of new screens and flows,
- isolated business logic for the B2B calculator,
- future local database work with `expo-sqlite` and Drizzle,
- reusable UI without coupling it to tax calculations.

## Main Rules
1. `src/app` is only for routing and screen entry points.
2. Business models and rules live outside the UI layer.
3. Feature-specific code stays inside its feature folder.
4. Shared UI and utilities live in `src/shared`.
5. Infrastructure code is the only place that should know about SQLite, storage, or external integrations.

## Recommended Directory Tree

```text
src/
├── app/                                 # Expo Router routes only
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── explore.tsx
│   ├── (app)/                           # future authenticated/main app routes
│   │   ├── calculator/
│   │   └── settings/
│   └── (modals)/                        # future modal routes
│
├── core/                                # app-wide technical setup
│   ├── config/                          # env, constants tied to runtime/app config
│   ├── database/                        # db client bootstrap, migrations entry
│   ├── providers/                       # React providers mounted near app root
│   └── store/                           # global app stores (theme, app shell state)
│
├── shared/                              # reusable across all features
│   ├── constants/                       # shared app constants
│   ├── lib/                             # pure helpers, formatters, utility functions
│   ├── theme/                           # design tokens, theme primitives
│   ├── types/                           # cross-feature shared types
│   └── ui/
│       ├── layout/                      # page shells, sections, wrappers
│       └── primitives/                  # buttons, inputs, cards, text, icons
│
├── features/
│   ├── calculator/                      # main MVP feature
│   │   ├── application/                 # use cases and app-facing orchestration
│   │   │   ├── services/
│   │   │   └── use-cases/
│   │   ├── domain/                      # pure business layer
│   │   │   ├── entities/                # income, cost, tax settings, results
│   │   │   ├── repositories/            # repository contracts/interfaces
│   │   │   ├── services/                # tax calculation rules
│   │   │   └── value-objects/           # money, rate, vat rate, contribution types
│   │   ├── infrastructure/              # storage and mapping details
│   │   │   ├── mappers/
│   │   │   ├── repositories/
│   │   │   └── sqlite/
│   │   └── presentation/                # feature UI only
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── screens/
│   │       └── view-models/
│   │
│   ├── settings/                        # app preferences and tax defaults later
│   │   └── presentation/
│   │       ├── components/
│   │       └── screens/
│   │
│   └── shared/                          # future cross-feature domain pieces
│       └── domain/
│           └── value-objects/
│
├── components/                          # current starter components, migrate gradually
├── constants/                           # current starter constants, migrate gradually
└── hooks/                               # current starter hooks, migrate gradually
```

## Layer Responsibilities

### `src/app`
- Keep route files thin.
- A route should import a screen from `src/features/.../presentation/screens`.
- Avoid placing tax calculations, mapping logic, or storage code here.

### `src/core`
- Holds app bootstrapping concerns.
- Good place for app providers, database initialization, and global Zustand stores.
- Should not contain feature business rules.

### `src/shared`
- Reusable code that does not belong to one feature.
- Use this for design system pieces, generic helpers, formatting, and common types.
- Shared code must stay generic and not depend on calculator-specific rules.

### `src/features/*/domain`
- Pure business models and rules.
- No React, no Expo APIs, no database imports.
- This is where the calculator formulas and domain types should live.

### `src/features/*/application`
- Coordinates domain logic for the app.
- Calls repositories, orchestrates use cases, prepares data for UI/state layers.
- Good place for actions like `calculateMonthlyNetIncome` or `saveCalculatorSnapshot`.

### `src/features/*/infrastructure`
- Concrete implementations for persistence and device integrations.
- SQLite repositories, DTO mapping, import/export, and future NBP rate caching belong here.

### `src/features/*/presentation`
- Components, screen containers, hooks, and view-model shaping for a single feature.
- Can use React, Expo Router, Zustand selectors, and shared UI primitives.
- Must not contain low-level persistence logic.

## How To Add New Work

### Add a new screen
1. Create a route file in `src/app/...`.
2. Create the screen in `src/features/<feature>/presentation/screens`.
3. Reuse primitives from `src/shared/ui`.

### Add new business logic
1. Put models in `domain/entities` or `domain/value-objects`.
2. Put pure calculations in `domain/services`.
3. Put the app action flow in `application/use-cases`.

### Add local persistence
1. Define repository contract in `domain/repositories`.
2. Implement it in `infrastructure/repositories`.
3. Keep SQLite-specific setup inside `core/database` or feature `infrastructure/sqlite`.

## Suggested MVP Mapping
- Revenue sources: `features/calculator/domain/entities`
- Costs and VAT categories: `features/calculator/domain/entities`
- Tax form, ZUS status, reliefs: `features/calculator/domain/value-objects`
- Monthly/annual calculation engine: `features/calculator/domain/services`
- Calculator state orchestration: `features/calculator/application/use-cases`
- Calculator form sections and result cards: `features/calculator/presentation/components`
- Main calculator screen: `features/calculator/presentation/screens`

## Migration Note
The current starter folders `src/components`, `src/constants`, and `src/hooks` are left in place so the app stays stable. New code should target the new structure, and the starter files can be moved gradually into `src/shared` or `src/features` as implementation grows.
