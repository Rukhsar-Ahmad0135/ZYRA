// Performance Monitoring Utility for ZYRA
// Add this to main.jsx or any component to track Core Web Vitals

// Core Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Track LCP (Largest Contentful Paint)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
    sendToAnalytics('LCP', lastEntry.startTime);
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  // Track FID (First Input Delay)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry) => {
      console.log('FID:', entry.processingStart - entry.startTime);
      sendToAnalytics('FID', entry.processingStart - entry.startTime);
    });
  }).observe({ type: 'first-input', buffered: true });

  // Track CLS (Cumulative Layout Shift)
  let clsValue = 0;
  new PerformanceObserver((entryList) => {
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        console.log('CLS:', clsValue);
        sendToAnalytics('CLS', clsValue);
      }
    });
  }).observe({ type: 'layout-shift', buffered: true });

  // Track FCP (First Contentful Paint)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        console.log('FCP:', entry.startTime);
        sendToAnalytics('FCP', entry.startTime);
      }
    });
  }).observe({ type: 'paint', buffered: true });

  // Track TTFB (Time to First Byte)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry) => {
      if (entry.entryType === 'navigation') {
        const ttfb = entry.responseStart - entry.requestStart;
        console.log('TTFB:', ttfb);
        sendToAnalytics('TTFB', ttfb);
      }
    });
  }).observe({ type: 'navigation', buffered: true });
}

// Send metrics to analytics endpoint
function sendToAnalytics(metricName, value) {
  // Send to your analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/web-vitals', JSON.stringify({
      metric: metricName,
      value: Math.round(value),
      url: window.location.href,
      timestamp: Date.now(),
    }));
  }
}

// Resource timing monitoring
export function trackResourceTiming() {
  if (typeof window === 'undefined') return;

  new PerformanceObserver((entryList) => {
    entries.forEach((entry) => {
      // Log slow resources (> 1000ms)
      if (entry.duration > 1000) {
        console.warn('Slow resource:', entry.name, `${entry.duration}ms`);
      }
    });
  }).observe({ type: 'resource', buffered: true });
}

// Long task monitoring
export function trackLongTasks() {
  if (typeof window === 'undefined') return;

  new PerformanceObserver((entryList) => {
    entries.forEach((entry) => {
      // Log tasks longer than 50ms
      if (entry.duration > 50) {
        console.warn('Long task:', entry.duration, 'ms', entry.name);
      }
    });
  }).observe({ type: 'longtask', buffered: true });
}

// Initialize all tracking
export function initPerformanceTracking() {
  if (typeof window === 'undefined') return;
  
  // Wait for page load
  if (document.readyState === 'complete') {
    trackWebVitals();
    trackResourceTiming();
    trackLongTasks();
  } else {
    window.addEventListener('load', () => {
      trackWebVitals();
      trackResourceTiming();
      trackLongTasks();
    });
  }
}

// Export for use in main.jsx
export default {
  trackWebVitals,
  trackResourceTiming,
  trackLongTasks,
  initPerformanceTracking,
};