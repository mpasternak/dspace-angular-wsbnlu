# Angular Performance Optimizations

## 1. LCP (Largest Contentful Paint) Optimizations

### Image Optimization

**NgOptimizedImage directive (Angular 15+):**
```typescript
// app.config.ts
import { provideImageLoader, IMAGE_LOADER } from '@angular/common';

export const appConfig = {
  providers: [
    provideImageLoader((src) => `https://cdn.example.com/${src}`)
  ]
};

// component.ts
@Component({
  imports: [NgOptimizedImage],
  template: `
    <!-- Hero image with priority -->
    <img ngSrc="hero.webp" width="1200" height="630" priority fill />
    
    <!-- Below-fold images auto lazy-loaded -->
    <img ngSrc="gallery-1.webp" width="400" height="300" />
  `
})
```

**Key attributes:**
- `priority` - Disables lazy loading, adds preload hint (use for LCP images)
- `fill` - For responsive images that fill container
- `placeholder` - Shows blur placeholder during load
- `loaderParams` - Pass CDN-specific params (quality, format)

### SSR with Angular Universal

```bash
ng add @angular/ssr
```

```typescript
// app.config.server.ts
export const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideClientHydration()
  ]
};
```

**Critical for LCP:** Server-render above-fold content so browser receives HTML immediately.

### Preloading Strategies

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { 
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component'),
    data: { preload: true }
  }
];

// Custom preload strategy
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadAllModules {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return route.data?.['preload'] ? load() : of(null);
  }
}
```

### Font Optimization

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap">
```

```css
/* styles.css */
@font-face {
  font-family: 'Inter';
  font-display: swap; /* Prevents FOIT */
  src: local('Inter'), url('/fonts/inter.woff2') format('woff2');
}
```

---

## 2. CLS (Cumulative Layout Shift) Fixes

### Reserved Space Patterns

**Images:**
```html
<!-- Always specify dimensions -->
<img src="photo.jpg" width="800" height="600" alt="...">

<!-- Or use aspect-ratio CSS -->
<div class="img-container">
  <img src="photo.jpg" alt="...">
</div>

<style>
.img-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}
.img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
```

**Skeleton loaders:**
```typescript
@Component({
  template: `
    @if (loading) {
      <div class="skeleton" style="height: 200px; background: #e0e0e0;"></div>
    } @else {
      <actual-content [data]="data" />
    }
  `
})
```

**Ads and embeds:**
```html
<div class="ad-slot" style="min-height: 250px;">
  <ng-container *ngIf="adLoaded">
    <ad-component />
  </ng-container>
</div>
```

### Dynamic Content Insertion

**BAD - causes layout shift:**
```typescript
// Inserting content at top pushes everything down
this.notifications.unshift(newNotification);
```

**GOOD - use transforms/absolute positioning:**
```typescript
@Component({
  template: `
    <div class="notification-container" style="position: relative; min-height: 60px;">
      <div class="notification" 
           [style.transform]="'translateY(' + offset + 'px)'"
           style="position: absolute; top: 0;">
        {{ notification.message }}
      </div>
    </div>
  `
})
```

### Web Fonts CLS Prevention

```css
/* Use font-display: optional for non-critical fonts */
@font-face {
  font-family: 'Decorative';
  font-display: optional;
  src: url('/fonts/decorative.woff2') format('woff2');
}

/* Fallback font matching */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  /* Match metrics to reduce shift */
  font-size-adjust: 0.5;
}
```

---

## 3. INP (Interaction to Next Paint) Optimizations

### Change Detection

```typescript
// Use OnPush everywhere possible
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformantComponent {
  constructor(private cdr: ChangeDetectorRef) {}
  
  onUserAction() {
    // Manual trigger only when needed
    this.cdr.markForCheck();
  }
}
```

### Zone.js Optimization

```typescript
// Run heavy computations outside Angular zone
constructor(private ngZone: NgZone) {}

processLargeDataset(data: any[]) {
  this.ngZone.runOutsideAngular(() => {
    // Heavy processing here won't trigger change detection
    const result = data.map(/* ... */);
    
    // Re-enter zone only to update UI
    this.ngZone.run(() => {
      this.processedData = result;
    });
  });
}
```

### Zoneless Angular (Angular 18+)

```typescript
// app.config.ts
export const appConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection()
  ]
};

// Components must use signals
@Component({
  template: `<div>{{ count() }}</div>`
})
export class ZonelessComponent {
  count = signal(0);
  
  increment() {
    this.count.update(c => c + 1);
  }
}
```

### Event Handler Optimization

```typescript
// Debounce user input
import { debounceTime } from 'rxjs';

@Component({
  template: `<input (input)="onSearch($event)">`
})
export class SearchComponent {
  private searchSubject = new Subject<string>();
  
  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(query => this.performSearch(query));
  }
  
  onSearch(event: Event) {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }
}
```

### Virtual Scrolling

```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items" class="item">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport { height: 400px; }
    .item { height: 50px; }
  `]
})
```

---

## 4. Bundle Optimization

### Route-Level Code Splitting

```typescript
// All routes should lazy load
export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
  }
];
```

### Defer Blocks (Angular 17+)

```html
<!-- Load when visible -->
@defer (on viewport) {
  <comments-section [postId]="post.id" />
} @placeholder {
  <div class="comments-skeleton">Loading comments...</div>
} @loading (minimum 500ms) {
  <spinner />
} @error {
  <p>Failed to load comments</p>
}

<!-- Load on interaction -->
@defer (on interaction) {
  <rich-text-editor />
} @placeholder {
  <textarea placeholder="Click to load editor..."></textarea>
}

<!-- Load after idle -->
@defer (on idle) {
  <analytics-widget />
}

<!-- Prefetch when visible, render on interaction -->
@defer (on interaction; prefetch on viewport) {
  <video-player [src]="videoUrl" />
}
```

### Build Optimization

```json
// angular.json
{
  "projects": {
    "app": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "budgets": [
                { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" },
                { "type": "anyComponentStyle", "maximumWarning": "4kb" }
              ],
              "optimization": true,
              "sourceMap": false,
              "namedChunks": false
            }
          }
        }
      }
    }
  }
}
```

### Tree Shaking Tips

```typescript
// BAD - imports entire library
import * as _ from 'lodash';

// GOOD - imports only what's needed
import debounce from 'lodash-es/debounce';

// Use Angular's built-in utilities when possible
import { formatDate, formatNumber } from '@angular/common';
```

---

## 5. Third-Party Script Management

```typescript
// Load after LCP
@Component({
  template: `...`
})
export class AppComponent implements AfterViewInit {
  ngAfterViewInit() {
    // Wait for LCP before loading analytics
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.loadAnalytics());
    } else {
      setTimeout(() => this.loadAnalytics(), 2500);
    }
  }
  
  private loadAnalytics() {
    const script = document.createElement('script');
    script.src = 'https://analytics.example.com/script.js';
    script.async = true;
    document.body.appendChild(script);
  }
}
```

---

## 6. Puppeteer Analysis Scripts

### Full Performance Audit
```javascript
// Run in puppeteer_evaluate
(async () => {
  const metrics = {};
  
  // LCP
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  metrics.lcp = lcpEntries.length ? lcpEntries[lcpEntries.length-1].startTime : null;
  
  // CLS
  let cls = 0;
  const clsEntries = performance.getEntriesByType('layout-shift');
  clsEntries.forEach(entry => { if (!entry.hadRecentInput) cls += entry.value; });
  metrics.cls = cls;
  
  // Resources
  metrics.resources = performance.getEntriesByType('resource').map(r => ({
    name: r.name.split('/').pop(),
    type: r.initiatorType,
    duration: Math.round(r.duration),
    size: r.transferSize
  })).sort((a,b) => b.size - a.size).slice(0, 20);
  
  // Long tasks
  metrics.longTasks = performance.getEntriesByType('longtask').length;
  
  return JSON.stringify(metrics, null, 2);
})();
```

### CLS Source Detection
```javascript
// Identify elements causing layout shifts
new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    if (entry.sources) {
      entry.sources.forEach(source => {
        console.log('CLS Source:', {
          node: source.node?.tagName,
          class: source.node?.className,
          previousRect: source.previousRect,
          currentRect: source.currentRect
        });
      });
    }
  });
}).observe({type: 'layout-shift', buffered: true});
```
