// Server-side polyfills are handled in server.ts (zone.js/node, reflect-metadata)
// Only import what's needed for SSR

// Angular localize for date/number pipes (used in SSR)
import '@angular/localize/init';

import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { serverAppConfig } from './modules/app/server-app.config';

const bootstrap = () => bootstrapApplication(AppComponent, serverAppConfig);

export default bootstrap;
