import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Cache-Control value for responses whose content never changes. */
export const IMMUTABLE_CACHE_CONTROL =
  "public, max-age=31536000, s-maxage=31536000, immutable";

const MEMORY_CACHE_TTL_MS = 86_400_000;

const MAX_CACHE_ENTRIES = 2000;

/** Max time a coalesced request waits for the in-flight one to finish. */
const INFLIGHT_TIMEOUT_MS = 15_000;

type CacheEntry = { body: string; expiresAt: number };

const responseCache = new Map<string, CacheEntry>();

const inflight = new Map<string, Promise<void>>();

const isCacheableRequest = (req: Request): boolean =>
  req.method === "GET" || req.method === "HEAD";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const evictOneEntry = (): void => {
  const now = Date.now();

  for (const [key, entry] of responseCache) {
    if (entry.expiresAt <= now) {
      responseCache.delete(key);

      return;
    }
  }

  const oldest = responseCache.keys().next().value;

  if (oldest !== undefined) {
    responseCache.delete(oldest);
  }
};

const storeEntry = (key: string, body: string): void => {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    evictOneEntry();
  }

  responseCache.set(key, { body, expiresAt: Date.now() + MEMORY_CACHE_TTL_MS });
};

const serveFromCache = (key: string, res: Response): boolean => {
  const entry = responseCache.get(key);

  if (!entry || entry.expiresAt <= Date.now()) {
    return false;
  }

  responseCache.delete(key);
  responseCache.set(key, entry);

  applyCacheHeaders(res, true);
  res.set("X-Cache", "HIT");
  res.type("application/json").send(entry.body);

  return true;
};

/**
 * Cache headers must reflect the final status: only 2xx responses are
 * immutable, everything else must not be cached.
 */
const applyCacheHeaders = (res: Response, cacheable: boolean): void => {
  if (cacheable) {
    res.set("Cache-Control", IMMUTABLE_CACHE_CONTROL);
    res.set("Vary", "Accept-Encoding");
  } else {
    res.set("Cache-Control", "no-store");
  }
};

export const immutableCacheHeaders: RequestHandler = (
  req,
  _res,
  next: NextFunction,
) => {
  if (!isCacheableRequest(req)) {
    _res.set("Cache-Control", "no-store");
  }

  return next();
};

export const memoryCache: RequestHandler = (req, res, next: NextFunction) => {
  if (!isCacheableRequest(req)) {
    return next();
  }

  const key = req.originalUrl;

  if (serveFromCache(key, res)) {
    return;
  }

  const pending = inflight.get(key);

  if (pending) {
    res.set("X-Cache", "HIT");

    void Promise.race([pending, delay(INFLIGHT_TIMEOUT_MS)]).then(() => {
      if (res.headersSent || res.writableEnded) {
        return;
      }

      if (serveFromCache(key, res)) {
        return;
      }

      res.set("X-Cache", "MISS");
      next();
    });

    return;
  }

  let settleInflight!: () => void;

  inflight.set(
    key,
    new Promise<void>((resolve) => {
      settleInflight = resolve;
    }),
  );

  const settle = (): void => {
    inflight.delete(key);
    settleInflight();
  };

  res.once("finish", settle);
  res.once("close", settle);

  const originalJson = res.json.bind(res);

  res.json = (payload: unknown) => {
    const body = JSON.stringify(payload);
    const success = res.statusCode >= 200 && res.statusCode < 300;

    applyCacheHeaders(res, success);

    if (success) {
      storeEntry(key, body);
    }

    res.set("X-Cache", "MISS");

    return originalJson(payload);
  };

  return next();
};
