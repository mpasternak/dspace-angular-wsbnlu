import { Injectable } from '@angular/core';
import {
  PreloadingStrategy,
  Route,
} from '@angular/router';
import {
  mergeMap,
  Observable,
  of,
  timer,
} from 'rxjs';

/**
 * Selective preloading strategy that preloads high-priority routes
 * after a short delay, improving subsequent navigation performance
 * without impacting initial page load.
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  /**
   * Routes to preload after initial page load.
   * These are commonly visited routes that benefit from preloading.
   */
  private readonly priorityRoutes = [
    '',
    'home',
    'search',
    'browse',
    'communities',
    'collections',
    'items',
  ];

  /**
   * Delay before preloading starts (in ms).
   * Allows initial page to fully render first.
   */
  private readonly preloadDelay = 2000;

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (this.priorityRoutes.includes(route.path || '')) {
      return timer(this.preloadDelay).pipe(mergeMap(() => load()));
    }
    return of(null);
  }
}
