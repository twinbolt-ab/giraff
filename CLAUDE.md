# Stuga - Home Assistant Dashboard

See @README.md for project overview and @package.json for available npm commands.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # TypeScript + Vite build
npm run lint         # ESLint
npm run test         # Vitest watch mode
npm run test:run     # Single test run
npm run ios:dev      # Build + run on iOS device
npm run android:dev  # Build + run on Android device
```

## Platform Rules

**This app runs on Web, iOS, and Android.** Always consider all platforms.

### Storage (CRITICAL)

- **NEVER** use `localStorage` directly
- **ALWAYS** use async APIs from `lib/storage`:
  - `getStorage()` for regular data
  - `getSecureStorage()` for OAuth tokens
- Sync functions like `getStoredCredentialsSync()` only work on web

### OAuth Differences

| Platform | Flow | Client ID |
|----------|------|-----------|
| Web | Redirect + PKCE → `/auth/callback` | `window.location.origin` |
| Native | OAuth2Client plugin + deep links | `https://twinbolt.se/stuga` |

Native apps need manual token exchange for HTTP (local HA instances).

## Gotchas

### Touch/Drag Events
- Use PointerEvent API consistently (not TouchEvent)
- `stopPropagation()` in parents blocks document listeners in children
- Set `touchAction: 'none'` and `pointerEvents: 'none'` on drag children
- Use `setPointerCapture()` for gesture ownership

### Room Reordering
- Order stored in HA using `stuga-room-order-XX` labels on areas
- Managed via WebSocket commands to label/area registry

## Code Style

- Prefer strict TypeScript; avoid `any` except in tests
- All UI text in `lib/i18n/en.json`—use `t.key` or `interpolate()`
- Satoshi font, warm brass accents (#C4A77D), no generic AI aesthetics

## Git Commits

- Concise, action-oriented messages (e.g., "Add dark mode toggle")
- Run `npm run lint && npm run test:run` before committing
- No "Co-Authored-By: Claude" or "Generated with Claude Code" footers

## Agent Notes

- **Verify first:** Check source code for facts; don't guess
- **Platform awareness:** Test changes on Web, iOS, and Android
- **Follow existing patterns:** Don't invent new approaches
- **Never edit:** `node_modules`, `ios/Pods/`, `android/.gradle/`
