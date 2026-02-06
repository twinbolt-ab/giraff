# Stuga - Home Assistant Dashboard

Stuga is a beautiful, opinionated, mobile-first Home Assistant dashboard designed for ease of use without complex configuration. It is built as a cross-platform application using React and Capacitor.

## Project Overview

- **Purpose:** A fast, polished alternative to the standard Home Assistant dashboard that requires zero configuration.
- **Core Technologies:**
  - **Frontend:** React 18, TypeScript, Vite
  - **Styling:** Tailwind CSS, Framer Motion (for animations), Lucide React (icons)
  - **Native Platform:** Capacitor (iOS/Android)
  - **Communication:** Home Assistant WebSocket API and OAuth2
  - **Analytics/Crashlytics:** Firebase (via Capacitor plugins)

## Architecture

- **`src/`**: Main source code.
  - **`components/`**: UI components categorized by feature (dashboard, devices, layout, etc.).
  - **`lib/`**: Core logic, including:
    - `ha-websocket/`: Manages the real-time connection to Home Assistant.
    - `ha-oauth.ts`: Handles authentication.
    - `storage/`: Abstracted storage layer (standard and secure).
    - `hooks/`: Custom React hooks.
  - **`providers/`**: React context providers for themes, toasts, and settings.
  - **`routes/`**: Main application routes (Home, Setup, Auth Callback).
  - **`types/`**: TypeScript type definitions, including Home Assistant entity types.
- **`android/`** & **`ios/`**: Native project directories managed by Capacitor.
- **`web/`**: Astro-based website for marketing or additional web content (separate from the main app).

## Building and Running

### Development
```bash
# Install dependencies
npm install

# Start the web development server (default port 3000)
npm run dev
```

### Native Development
```bash
# Build and sync for iOS
npm run ios:dev

# Build and sync for Android
npm run android:dev
```

### Testing
```bash
# Run unit tests with Vitest
npm run test

# Run tests once
npm run test:run
```

### Production Build
```bash
# Create a production build in the dist/ folder
npm run build
```

## Development Conventions

- **Path Aliases:** Use `@/` to refer to the `src/` directory (configured in `vite.config.ts` and `tsconfig.json`).
- **Icons:** Use `Lucide React` for most UI icons.
- **State Management:** Uses React Context for application state and a singleton pattern for the WebSocket connection state.
- **Styling:** Follow Tailwind CSS patterns. Use `clsx` or `tailwind-merge` for dynamic classes if needed (though `clsx` is explicitly in `package.json`).
- **Mobile-First:** Always consider how UI changes affect mobile devices (touch targets, screen real estate, notch/safe areas).
- **Native Plugins:** When using native features (Haptics, Secure Storage, Firebase), check for Capacitor plugin availability.

## Key Files

- `capacitor.config.ts`: Capacitor configuration for native platforms.
- `vite.config.ts`: Vite configuration, including path aliases and base path.
- `src/App.tsx`: Main application entry point and routing.
- `src/lib/ha-websocket/index.ts`: Entry point for Home Assistant interaction.
- `src/lib/ha-oauth.ts`: OAuth2 implementation for Home Assistant.
