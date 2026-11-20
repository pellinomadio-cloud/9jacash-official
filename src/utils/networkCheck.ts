/**
 * Real internet connectivity verification that cannot be fooled by PWA service worker caches
 * or stale navigator.onLine = true states (e.g. Wi-Fi with no internet or exhausted mobile data).
 */

async function probeEndpoint(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  validateJsonOk = false
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      cache: 'no-store',
      signal: controller.signal,
    });
    if (validateJsonOk) {
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      return Boolean(data && data.ok === true);
    }
    // For no-cors opaque responses, fetch resolving without network error confirms real reachability
    return res.type === 'opaque' || res.ok || res.status === 204;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function verifyInternetConnection(timeoutMs = 3500): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  const ts = Date.now();

  // Run a live uncached same-origin API ping AND Google's official 204 reachability check in parallel.
  // Succeed as soon as ANY real network probe confirms live connectivity.
  const probes: Array<Promise<boolean>> = [
    probeEndpoint(`/api/ping?t=${ts}`, { method: 'GET' }, timeoutMs, true),
    probeEndpoint(`https://www.gstatic.com/generate_204?t=${ts}`, { method: 'GET', mode: 'no-cors' }, timeoutMs, false),
  ];

  const primaryOnline = await new Promise<boolean>((resolve) => {
    let settled = false;
    let remaining = probes.length;
    probes.forEach((p) => {
      p.then((ok) => {
        if (settled) return;
        if (ok) {
          settled = true;
          resolve(true);
        } else {
          remaining -= 1;
          if (remaining === 0) {
            settled = true;
            resolve(false);
          }
        }
      });
    });
  });

  if (primaryOnline) return true;

  // One final fallback probe in case primary CDN was momentarily slow
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  return probeEndpoint(
    `https://clients3.google.com/generate_204?t=${Date.now()}`,
    { method: 'GET', mode: 'no-cors' },
    2800,
    false
  );
}
