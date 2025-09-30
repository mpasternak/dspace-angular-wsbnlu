# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is DSpace Angular - the frontend user interface for DSpace, an open-source repository application used by over 2,000 organizations worldwide for digital resource management. It's built with Angular 18, TypeScript, Angular Universal for SSR, and NgRx for state management.

## Key Development Commands

### Running the Application

```bash
# Install dependencies (Node v18.x or v20.x required)
npm install

# Development server with hot reload
npm run start:dev

# Production build and serve
npm start  # or npm run start:prod

# Build only
npm run build        # Development build
npm run build:prod   # Production build with SSR

# Server-side rendering
npm run build:ssr    # Build with SSR
npm run serve:ssr    # Serve SSR build
```

### Testing

```bash
# Unit tests
npm test                    # Run tests once
npm run test:watch         # Run tests in watch mode
npm run test:headless      # Run tests headless with coverage

# E2E tests (Cypress)
npm run e2e                # Run e2e tests
npm run cypress:open       # Open Cypress UI
npm run cypress:run        # Run Cypress headless

# Linting
npm run lint               # Run ESLint
npm run lint-fix           # Run ESLint with auto-fix
npm run test:lint          # Test custom lint rules
```

### Build and Clean

```bash
# Clean commands
npm run clean              # Full clean (dist, node_modules, cache, etc.)
npm run clean:prod         # Clean production artifacts
npm run clean:dist         # Clean dist folder only
npm run clean:node         # Clean node_modules

# Other utilities
npm run sync-i18n          # Sync i18n files
npm run merge-i18n         # Merge i18n files
npm run check-circ-deps    # Check for circular dependencies
```

## Architecture Overview

### Core Structure

The application follows Angular's modular architecture with:

- **Server-Side Rendering (SSR)**: Uses Angular Universal for better SEO and initial load performance
- **State Management**: NgRx for Redux-pattern state management across the application
- **REST API Integration**: Communicates with DSpace backend REST API (configured in `src/config/`)
- **Theming System**: Multiple themes support via `src/themes/` with runtime switching capability
- **Lazy Loading**: Module-based route lazy loading for optimal bundle sizes

### Configuration System

- **Environment-based**: Development (`src/environments/environment.ts`) and production (`src/environments/environment.production.ts`) configurations
- **Runtime Config**: `src/assets/config.json` loaded at runtime (generated from environment variables)
- **Default Config**: `src/config/default-app-config.ts` defines all configuration interfaces and defaults
- **UI Server Config**: Express server configuration for SSR in `server.ts`

### Key Directories

- `src/app/`: Main application code organized by feature modules
- `src/themes/`: Theme-specific components and styles (custom, dspace themes)
- `src/config/`: Configuration interfaces and utilities
- `src/assets/i18n/`: Internationalization files (JSON5 format)
- `cypress/`: E2E test specifications and utilities
- `lint/`: Custom ESLint rules specific to DSpace Angular

### Testing Strategy

- **Unit Tests**: Karma + Jasmine, located alongside components as `.spec.ts` files
- **E2E Tests**: Cypress for integration testing, specs in `cypress/integration/`
- **Custom Lint Rules**: Project-specific ESLint rules in `lint/src/rules/`
- **Coverage**: Istanbul for code coverage reporting

### Build Process

- **Webpack Custom Config**: Extended webpack configuration in `webpack/` directory
- **Angular Builders**: Uses `@angular-builders/custom-webpack` for custom build steps
- **Multiple Entry Points**: Browser (`main.browser.ts`) and server (`server.ts`) entry points
- **Bundle Analysis**: `npm run analyze` for webpack bundle analysis

### DSpace-Specific Features

- **Entity Management**: Support for DSpace entities (Items, Collections, Communities)
- **Submission System**: Configurable submission workflows
- **Browse/Search**: Faceted search with configurable discovery
- **Authentication**: Multiple auth methods (password, OIDC, Shibboleth)
- **Customizable Metadata**: Flexible metadata schema support

## Development Guidelines

When working with this codebase:

1. **Theme-aware Development**: Check if components need theme variants in `src/themes/`
2. **State Management**: Use NgRx store for shared state, avoid component-level state when data is needed elsewhere
3. **i18n Required**: All user-facing text must use translation keys from `src/assets/i18n/`
4. **Lazy Loading**: Large features should be in separate modules for lazy loading
5. **SSR Compatibility**: Ensure code works in both browser and Node.js environments
6. **REST API Contract**: Follow the contract defined at https://github.com/DSpace/RestContract

## CRITICAL - DO NOT RUN BUILD COMMANDS

**ABSOLUTELY NEVER run any of these commands:**
- `npm run build`
- `npm run build:prod`
- `npm run build:ssr`
- `ng build`
- Any other build-related commands

**THE USER IS ALREADY RUNNING BUILDS IN THE BACKGROUND.** Running additional build commands will cause conflicts and slow everything down. Only reference or document build commands when needed, but NEVER execute them.