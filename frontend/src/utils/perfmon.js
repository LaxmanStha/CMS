import { useEffect, useRef } from 'react';

const SLOW_RENDER_MS = 300;

export function logRenderTime(componentName, time, threshold = SLOW_RENDER_MS) {
  if (time > threshold) {
    // eslint-disable-next-line no-console
    console.warn(
      `%c[perf] ${componentName} took ${time.toFixed(1)}ms to render`,
      'color:#f59e0b;font-weight:600'
    );
  }
}

export function useRenderTracker(componentName, props) {
  const start = useRef(performance.now());
  const isFirst = useRef(true);

  useEffect(() => {
    const time = performance.now() - start.current;
    logRenderTime(componentName, time);
    if (isFirst.current) {
      isFirst.current = false;
    }
  });

  if (import.meta.env.DEV && typeof window !== 'undefined' && window.__PERF_LOGS__) {
    // eslint-disable-next-line no-console
    console.log(`[render] ${componentName}`, props);
  }
}

export default { logRenderTime, useRenderTracker };