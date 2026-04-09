# Tech Stack: Local-Only Android Application

## Overview
A modern, purely offline Android application built in 2026 using React Native and Expo. The app relies exclusively on local on-device storage with zero external database hosting, ensuring maximum privacy, zero latency, and no recurring server costs.

## Core Framework
* **Framework:** **Expo** (React Native) – The industry standard for mobile development, utilizing the modern New Architecture (Fabric/TurboModules).
* **Language:** **TypeScript** (Strict Mode) – Ensures end-to-end type safety across components and database queries.
* **Navigation:** **Expo Router** – File-based routing system (similar to Next.js) for clean, maintainable navigation flows.

## Data Layer (Local-First)
* **Database Engine:** `expo-sqlite` – Provides fully synchronous, high-performance SQLite access directly on the device using JSI. No network requests are made.
* **ORM:** **Drizzle ORM** – A lightweight, highly performant TypeScript ORM. It provides perfect type safety, seamless integration with `expo-sqlite`, and live-query support for reactive UI updates when the database changes.
* **Global UI State:** **Zustand** – A minimalistic, boilerplate-free state manager for handling ephemeral UI state (e.g., theme preferences, active tabs, modal visibility).
* **Backup for datbase** - export db to phone or google drive

## Styling & UI
* **Styling:** **NativeWind** – Utilizes Tailwind CSS utility classes customized for React Native, allowing for rapid, responsive UI development.
* **Icons:** **Expo Vector Icons** / **Lucide React Native** – For lightweight, scalable iconography.

## Build & Distribution 
* **Build System:** **EAS Build** (Expo Application Services) – Used to compile the TypeScript codebase into an Android App Bundle (`.aab`) in the cloud.
* **Distribution:** **Google Play Store** – One-time $25 developer account fee. The app lives on the user's phone, utilizing their local storage and compute power.
* **OTA Updates:** **EAS Update** – Enables pushing minor JavaScript/TypeScript bug fixes directly to users' devices without requiring a full app store review.