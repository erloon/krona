# Project Structure: Pragmatic Clean Architecture

## Philosophy
This project follows a pragmatic approach to Clean Architecture adapted for React Native and Expo Router. The core principle is the Separation of Concerns: the UI (Presentation) should not know how data is saved (Data Layer), and the Database layer should not care about how things are displayed.

## Directory Tree

```text
my-offline-app/
├── app/                      # 1. PRESENTATION (ROUTING) - Expo Router
│   ├── (tabs)/               # Tab navigation routes
│   │   ├── index.tsx         # e.g., Home Screen
│   │   └── settings.tsx      # e.g., Settings Screen
│   ├── _layout.tsx           # Global app layout & providers
│   └── +not-found.tsx        # 404 fallback
│
├── src/                      # CORE APPLICATION CODE
│   ├── domain/               # 2. DOMAIN LAYER (Business Rules & Types)
│   │   ├── models/           # Core TypeScript types/interfaces (e.g., User, Note)
│   │   └── exceptions/       # Custom error classes
│   │
│   ├── data/                 # 3. DATA LAYER (Storage & Infrastructure)
│   │   ├── database/         # SQLite connection setup
│   │   ├── schema/           # Drizzle ORM schemas (Tables definition)
│   │   ├── migrations/       # SQL migration files
│   │   └── repositories/     # Functions interacting with Drizzle (e.g., NoteRepository)
│   │
│   ├── application/          # 4. APPLICATION LAYER (State & Use Cases)
│   │   ├── stores/           # Zustand stores (Global UI/App state)
│   │   └── useCases/         # Complex business logic combining multiple repositories
│   │
│   └── ui/                   # 5. PRESENTATION (COMPONENTS & DESIGN)
│       ├── components/       # Reusable, "dumb" UI components (Buttons, Cards)
│       ├── theme/            # NativeWind design tokens, colors, typography
│       └── utils/            # Simple formatting helpers (e.g., formatDate)
│
├── .eslintrc.js              
├── babel.config.js           
├── drizzle.config.ts         # Drizzle configuration
├── package.json
└── tsconfig.json
```

## Layer Responsibilities

### 1. `app/` (Expo Router Routes)
* **Rule:** Contains almost zero business logic.
* **Role:** Connects URLs/paths to screens. It reads state from `src/application/stores` and displays components from `src/ui/components`.

### 2. `src/domain/`
* **Rule:** Completely independent. Cannot import from `data`, `application`, or `ui`.
* **Role:** Holds the raw TypeScript definitions of what objects look like in your app (e.g., `type Task = { id: string, title: string, isDone: boolean }`).

### 3. `src/data/`
* **Rule:** The only place where `expo-sqlite` and `drizzle-orm` are imported.
* **Role:** Defines the database structure. Repositories act as a bridge: they take raw data from SQLite and return clean `domain` models to the rest of the app.

### 4. `src/application/`
* **Rule:** The orchestrator. Imports from `domain` and `data`.
* **Role:** Contains Zustand stores. If a user clicks "Add Task", the UI calls a function here. This layer validates the input, calls the `TaskRepository` to save it to SQLite, and updates the Zustand state so the UI reflects the change.

### 5. `src/ui/`
* **Rule:** Reusable visual building blocks. Cannot import from `data` or `application`.
* **Role:** Buttons, inputs, and layout wrappers styled with NativeWind. They just take `props` and emit `events`.
```