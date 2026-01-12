---
name: angular-pagespeed-optimizer
description: "Optimize Angular apps for Core Web Vitals (CLS, LCP, INP) using Chrome MCP puppeteer. Use when user asks to analyze PageSpeed, fix CLS/LCP/INP, optimize Angular performance, run Lighthouse audits, or debug layout shifts. Requires MCP puppeteer connection."
---

# Angular PageSpeed Optimizer

Optimize Angular applications for Core Web Vitals using Chrome MCP puppeteer for live analysis and Lighthouse audits.

## Prerequisites

Ensure MCP puppeteer server is connected. Verify with:
```
mcp__puppeteer__puppeteer_navigate to any URL
```

## Workflow

### 1. Initial Analysis

Run Lighthouse audit via puppeteer:

```javascript
// Navigate to target URL
mcp__puppeteer__puppeteer_navigate({ url: "https://target-site.com" })

// Take screenshot for visual reference
mcp__puppeteer__puppeteer_screenshot()

// Execute Lighthouse in browser console
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Check for layout shifts
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('Layout Shift:', entry.value, entry.sources);
      }
    }).observe({type: 'layout-shift', buffered: true});
    
    // Check LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
    }).observe({type: 'largest-contentful-paint', buffered: true});
  `
})
```

### 2. Identify Issues

Use puppeteer to detect common Angular performance problems:

**CLS Detection:**
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Find elements without explicit dimensions
    [...document.querySelectorAll('img:not([width]):not([height])')].map(el => ({
      src: el.src,
      classes: el.className
    }));
  `
})
```

**LCP Element Identification:**
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Get LCP element
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcpEntry = entries[entries.length - 1];
      console.log('LCP Element:', lcpEntry.element?.tagName, lcpEntry.element?.className);
    }).observe({type: 'largest-contentful-paint', buffered: true});
  `
})
```

### 3. Angular-Specific Optimizations

See [references/angular-optimizations.md](references/angular-optimizations.md) for detailed patterns.

**Quick fixes checklist:**

| Issue | Solution | Priority |
|-------|----------|----------|
| Images without dimensions | Add `width`/`height` or use `NgOptimizedImage` | CLS - High |
| No lazy loading | Add `@defer` blocks or `loadChildren` | LCP - High |
| Heavy initial bundle | Enable route-level code splitting | LCP - High |
| Font flash (FOUT/FOIT) | Add `font-display: swap` + preload | CLS - Medium |
| Third-party scripts | Use `async`/`defer` or load after LCP | LCP - Medium |
| Zone.js overhead | Use `OnPush` + `runOutsideAngular` | INP - Medium |

### 4. Validate Changes

After implementing fixes, re-run analysis:

```javascript
// Hard refresh to bypass cache
mcp__puppeteer__puppeteer_navigate({ url: "https://target-site.com" })

// Compare metrics
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        console.log(entry.entryType + ':', entry.value || entry.duration);
      });
    });
    observer.observe({entryTypes: ['layout-shift', 'largest-contentful-paint', 'first-input']});
  `
})
```

## Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤2.5s | 2.5s–4s | >4s |
| CLS | ≤0.1 | 0.1–0.25 | >0.25 |
| INP | ≤200ms | 200ms–500ms | >500ms |

## Common Angular Patterns

### NgOptimizedImage (Angular 15+)
```typescript
import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage],
  template: `
    <img ngSrc="/hero.jpg" width="800" height="600" priority />
  `
})
```

### Defer Blocks (Angular 17+)
```html
@defer (on viewport) {
  <heavy-component />
} @placeholder {
  <div class="skeleton" style="height: 400px;"></div>
}
```

### OnPush Change Detection
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

## Debugging Tools via Puppeteer

**Network waterfall analysis:**
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    performance.getEntriesByType('resource').map(r => ({
      name: r.name.split('/').pop(),
      duration: Math.round(r.duration),
      size: r.transferSize
    })).sort((a,b) => b.duration - a.duration).slice(0, 10);
  `
})
```

**Bundle size check:**
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    performance.getEntriesByType('resource')
      .filter(r => r.name.includes('.js'))
      .reduce((acc, r) => acc + r.transferSize, 0) / 1024;
  `
})
```

For comprehensive optimization strategies, load [references/angular-optimizations.md](references/angular-optimizations.md).
For Core Web Vitals deep dive, load [references/core-web-vitals.md](references/core-web-vitals.md).
