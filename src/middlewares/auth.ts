import crypto from "node:crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";

type ApiKey = string | string[];

const sha256 = (value: string): Buffer =>
  crypto.createHash("sha256").update(value).digest();

const matches = (provided: string, validKeys: ApiKey): boolean => {
  const candidates = Array.isArray(validKeys) ? validKeys : [validKeys];
  const providedHash = sha256(provided);

  return candidates.some((key) =>
    crypto.timingSafeEqual(providedHash, sha256(key))
  );
};

const extractApiKey = (req: Request): string | undefined => {
  const headerKey = req.header("x-api-key");

  if (headerKey) {
    return headerKey;
  }

  const [scheme, token] = (req.header("authorization") ?? "").split(" ");

  return scheme?.toLowerCase() === "bearer" ? token || undefined : undefined;
};

export const apiKeyAuth = (validKeys: ApiKey): RequestHandler => {
  const hasNoKeys = Array.isArray(validKeys)
    ? validKeys.length === 0
    : !validKeys;

  if (hasNoKeys) {
    throw new Error(
      "apiKeyAuth requires at least one API key. Set the API_KEY environment variable."
    );
  }

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") {
      return next();
    }

    const provided = extractApiKey(req);

    if (!provided || !matches(provided, validKeys)) {
      res.set("WWW-Authenticate", "Bearer");

      return res.status(401).json({ error: "Unauthorized" });
    }

    return next();
  };
};
