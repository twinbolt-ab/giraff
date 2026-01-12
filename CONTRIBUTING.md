# Contributing to Giraff

Thank you for your interest in contributing to Giraff! This document provides guidelines and information to help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Be kind and respectful. We're all here to build something useful for the Home Assistant community.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Home Assistant instance for testing
- A long-lived access token from Home Assistant

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/giraff.git
   cd giraff
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the dashboard**

   Navigate to `http://localhost:3000` and follow the setup wizard to connect to Home Assistant.

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-media-player-controls`
- `fix/brightness-slider-not-updating`
- `docs/update-installation-guide`

### Commit Messages

Write clear, concise commit messages:
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep the first line under 72 characters

**Good examples:**
```
Add brightness gesture control for lights
Fix WebSocket reconnection on network change
Update README with Docker instructions
```

## Pull Request Process

1. **Ensure your code passes linting**
   ```bash
   npm run lint
   ```

2. **Test your changes** with an actual Home Assistant instance

3. **Update documentation** if you've changed functionality

4. **Create a pull request** with:
   - A clear title describing the change
   - A description of what changed and why
   - Screenshots for UI changes
   - Reference to any related issues

5. **Wait for review** — maintainers will review your PR and may request changes

## Style Guide

### Code Style

- **TypeScript** — Use TypeScript for all new code
- **Formatting** — The project uses ESLint; run `npm run lint` before committing
- **Imports** — Use absolute imports with `@/` prefix
  ```tsx
  import { Card } from '@/components/ui/Card'
  import { useDevices } from '@/lib/hooks/useDevices'
  ```

### Component Structure

```tsx
interface Props {
  // Define typed props
}

export function ComponentName({ prop }: Props) {
  // 1. Hooks first
  // 2. Derived state
  // 3. Event handlers
  // 4. Render
}
```

### File Naming

- Components: PascalCase (`RoomCard.tsx`)
- Hooks: camelCase with `use` prefix (`useDevices.ts`)
- Utilities: camelCase (`formatTemperature.ts`)

### UI Guidelines

- **Mobile-first** — Design for phones, scale up
- **Touch-friendly** — Minimum 44px tap targets
- **Warm colors** — Use the existing color palette (brass accents, warm grays)
- **Satoshi font** — Use the project's typography system

### What to Avoid

- Generic UI patterns that feel "AI-generated"
- Purple gradients, generic blue accents
- Inter, Roboto, or system fonts in visible UI
- Over-engineering or premature abstraction

## Reporting Issues

### Bug Reports

When reporting a bug, please include:
- **Description** — What happened?
- **Expected behavior** — What should have happened?
- **Steps to reproduce** — How can we recreate the issue?
- **Environment** — Browser, OS, Home Assistant version
- **Screenshots** — If applicable

### Feature Requests

For feature requests:
- **Use case** — Why do you need this feature?
- **Proposed solution** — How do you envision it working?
- **Alternatives** — Have you considered other approaches?

---

## Questions?

Feel free to open a [discussion](https://github.com/twinbolt/giraff/discussions) if you have questions about contributing.

Thank you for helping make Giraff better!
