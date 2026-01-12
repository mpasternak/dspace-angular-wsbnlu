# Core Web Vitals Deep Dive

## Metrics Overview

| Metric | Measures | Target | Angular Impact |
|--------|----------|--------|----------------|
| **LCP** | Loading performance | ≤2.5s | SSR, image optimization, bundle size |
| **CLS** | Visual stability | ≤0.1 | Dynamic content, images, fonts |
| **INP** | Interactivity | ≤200ms | Change detection, Zone.js, event handlers |

---

## LCP (Largest Contentful Paint)

### What It Measures
Time from navigation start until the largest content element is rendered in viewport.

### LCP Candidates
1. `<img>` elements
2. `<image>` inside `<svg>`
3. `<video>` poster images
4. Elements with `background-image: url()`
5. Block-level text elements (`<p>`, `<h1>`, etc.)

### Common Angular LCP Issues

| Issue | Detection | Fix |
|-------|-----------|-----|
| Large JS bundle blocking render | Check main.js size in Network | Code splitting, defer blocks |
| Unoptimized hero image | LCP element is `<img>` | NgOptimizedImage + priority |
| No SSR/SSG | First paint waits for JS | Angular Universal |
| Slow API calls in resolvers | Route resolver delays render | Move to component with skeleton |
| Third-party script blocking | Large scripts in `<head>` | Move to body, use async/defer |

### Puppeteer LCP Analysis
```javascript
// Get LCP details
const lcpData = await page.evaluate(() => {
  return new Promise(resolve => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries[entries.length - 1];
      resolve({
        time: lcp.startTime,
        element: lcp.element?.tagName,
        id: lcp.element?.id,
        class: lcp.element?.className,
        url: lcp.url, // For images
        size: lcp.size
      });
    }).observe({type: 'largest-contentful-paint', buffered: true});
    
    // Fallback timeout
    setTimeout(() => resolve(null), 5000);
  });
});
```

---

## CLS (Cumulative Layout Shift)

### What It Measures
Sum of all unexpected layout shift scores throughout page lifecycle.

### Layout Shift Score Calculation
```
shift_score = impact_fraction * distance_fraction
```
- **Impact fraction**: % of viewport affected
- **Distance fraction**: How far elements moved (max 0.5)

### Session Windows (CLS 2024 Update)
CLS now uses session windows:
- Groups shifts within 5 seconds
- Max 1 second gap between shifts
- Reports largest session window, not cumulative total

### Common Angular CLS Issues

| Issue | Detection | Fix |
|-------|-----------|-----|
| Images without dimensions | CLS source is `<img>` | Add width/height or aspect-ratio |
| Dynamic content insertion | Content appears above fold | Reserve space with min-height |
| Font loading | Text reflows after font loads | font-display: swap + preload |
| Ads/embeds loading late | Third-party iframes cause shift | Reserve exact ad slot size |
| Route transitions | Content jumps during navigation | Maintain scroll position |

### Puppeteer CLS Debugging
```javascript
// Track CLS sources in real-time
await page.evaluate(() => {
  const shifts = [];
  new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
      if (!entry.hadRecentInput && entry.sources?.length) {
        entry.sources.forEach(source => {
          shifts.push({
            value: entry.value,
            element: source.node?.outerHTML?.substring(0, 100),
            from: source.previousRect,
            to: source.currentRect
          });
        });
      }
    });
    console.log('CLS Shifts:', JSON.stringify(shifts, null, 2));
  }).observe({type: 'layout-shift', buffered: true});
});
```

---

## INP (Interaction to Next Paint)

### What It Measures
Time from user interaction (click, tap, keypress) to next visual update.

### INP Calculation
- Tracks all interactions during page lifecycle
- Reports 98th percentile (ignores outliers)
- Replaced FID in March 2024

### Interaction Phases
```
Total INP = Input Delay + Processing Time + Presentation Delay

1. Input Delay: Time until event handler starts (main thread blocked)
2. Processing Time: Event handler execution time
3. Presentation Delay: Time to render the visual update
```

### Common Angular INP Issues

| Issue | Detection | Fix |
|-------|-----------|-----|
| Heavy change detection | Long tasks after click | OnPush, runOutsideAngular |
| Synchronous operations | Main thread blocked | Use Web Workers, async |
| Large component trees | Re-render of entire tree | trackBy, memoization |
| Third-party scripts | Blocking main thread | Lazy load, requestIdleCallback |
| Complex animations | Frame drops during interaction | Use CSS transforms, will-change |

### Puppeteer INP Analysis
```javascript
// Measure interaction responsiveness
await page.evaluate(() => {
  const interactions = [];
  
  new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
      interactions.push({
        name: entry.name,
        duration: entry.duration,
        processingStart: entry.processingStart,
        processingEnd: entry.processingEnd,
        startTime: entry.startTime
      });
    });
  }).observe({type: 'event', buffered: true, durationThreshold: 16});
  
  // Click a button and measure
  document.querySelector('button')?.click();
  
  setTimeout(() => {
    console.log('Interactions:', JSON.stringify(interactions));
  }, 1000);
});
```

---

## Measurement Tools via Puppeteer

### Comprehensive Audit Script
```javascript
const runAudit = async () => {
  const audit = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    metrics: {},
    issues: []
  };
  
  // Navigation timing
  const navTiming = performance.getEntriesByType('navigation')[0];
  audit.metrics.ttfb = navTiming.responseStart;
  audit.metrics.domContentLoaded = navTiming.domContentLoadedEventEnd;
  audit.metrics.load = navTiming.loadEventEnd;
  
  // LCP
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  if (lcpEntries.length) {
    const lcp = lcpEntries[lcpEntries.length - 1];
    audit.metrics.lcp = {
      time: lcp.startTime,
      element: lcp.element?.tagName,
      url: lcp.url
    };
    if (lcp.startTime > 2500) {
      audit.issues.push({ type: 'LCP', severity: 'high', message: `LCP is ${lcp.startTime}ms` });
    }
  }
  
  // CLS
  let cls = 0;
  const clsEntries = performance.getEntriesByType('layout-shift');
  const clsSources = [];
  clsEntries.forEach(entry => {
    if (!entry.hadRecentInput) {
      cls += entry.value;
      entry.sources?.forEach(s => clsSources.push(s.node?.tagName));
    }
  });
  audit.metrics.cls = { value: cls, sources: [...new Set(clsSources)] };
  if (cls > 0.1) {
    audit.issues.push({ type: 'CLS', severity: 'high', message: `CLS is ${cls.toFixed(3)}` });
  }
  
  // Long tasks
  const longTasks = performance.getEntriesByType('longtask');
  audit.metrics.longTasks = longTasks.length;
  if (longTasks.length > 0) {
    audit.issues.push({ 
      type: 'INP', 
      severity: 'medium', 
      message: `${longTasks.length} long tasks detected` 
    });
  }
  
  // Resource analysis
  const resources = performance.getEntriesByType('resource');
  const jsSize = resources
    .filter(r => r.name.endsWith('.js'))
    .reduce((sum, r) => sum + r.transferSize, 0);
  audit.metrics.jsSize = Math.round(jsSize / 1024) + 'KB';
  
  if (jsSize > 500000) {
    audit.issues.push({ 
      type: 'Bundle', 
      severity: 'high', 
      message: `JS bundle is ${audit.metrics.jsSize}` 
    });
  }
  
  // Images without dimensions
  const imagesNoDimensions = [...document.querySelectorAll('img')]
    .filter(img => !img.width && !img.height && !img.style.width && !img.style.height)
    .map(img => img.src);
  
  if (imagesNoDimensions.length) {
    audit.issues.push({
      type: 'CLS',
      severity: 'medium',
      message: `${imagesNoDimensions.length} images without dimensions`,
      details: imagesNoDimensions
    });
  }
  
  return audit;
};

runAudit();
```

---

## Chrome DevTools Protocol via Puppeteer

### Enable Performance Tracing
```javascript
// Start tracing
await page.tracing.start({ 
  categories: ['devtools.timeline', 'blink.user_timing'] 
});

// Navigate and interact
await page.goto('https://example.com');
await page.click('button');

// Stop and get trace
const trace = await page.tracing.stop();
```

### Network Throttling (Simulate 3G)
```javascript
const client = await page.target().createCDPSession();
await client.send('Network.enable');
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
  uploadThroughput: 750 * 1024 / 8,           // 750 Kbps
  latency: 40                                  // 40ms RTT
});
```

### CPU Throttling
```javascript
const client = await page.target().createCDPSession();
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 }); // 4x slowdown
```
