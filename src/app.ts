import express from "express";
import cors from "cors";

import booksRouter from "./routes/books";
import chaptersRouter from "./routes/chapters";
import versesRouter from "./routes/verses";
import HttpError from "~/utils/httpError";
import { apiKeyAuth } from "~/middlewares/auth";
import { loadEnv } from "~/utils/loadEnv";

loadEnv();

const app = express();

const PORT = process.env.PORT || 8000;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error(
    "Missing API_KEY environment variable. Start the server with a key, e.g.: API_KEY=my-secret pnpm run devto"
  );

  process.exit(1);
}

app.use(
  cors({
    origin: "*",
  })
);

app.use("/api/bible", apiKeyAuth(API_KEY));

app.use("/api/bible/books", booksRouter);
app.use("/api/bible/books", chaptersRouter);
app.use("/api/bible/books", versesRouter);

app.get("/api", (_req, res) => {
  const apiInfo = {
    message: "Welcome to the Bible API RV60",
    authentication: {
      type: "API key",
      description:
        "All /api/bible endpoints require an API key. Send it via the 'x-api-key' header or 'Authorization: Bearer <key>'.",
    },
    endpoints: [
      {
        path: "/api/bible/books",
        description: "Get all the books from the Bible",
        queryParameters: [
          {
            name: "/:bookName/chapters",
            description: "Filter chapters by book name",
            type: "string",
          },
          {
            name: "/:bookName/chapters/:chapter/verses",
            description: "Filter verses by book name and chapter",
            type: "string",
          },
          {
            name: "/:bookName/chapters/:chapter/verses/:verseOrRange",
            description:
              "Get a single verse (/verses/5, returns one object) or a verse range (/verses/5-10, e.g. /salmos/chapters/2/verses/5-10, returns an array)",
            type: "string",
          },
          {
            name: "/:bookName/chapters/:chapter/verses/5/10",
            description:
              "Same range as above using two path segments (kept for compatibility)",
            type: "string",
          },
          {
            name: "/:bookName/chapters/:chapter/verses?from=5&to=10",
            description:
              "Get a range of verses using query parameters. 'from' and 'to' are independent: ?from=5 (5 to end), ?to=3 (1 to 3), or both (e.g. ?from=5&to=10)",
            type: "string",
          },
        ],
      },
    ],
  };

  return res.json(apiInfo);
});

app.get("/api/hello", (_req, res) => {
  return res.send("Hello WOrld");
});

app.use((_req, res) => {
  return res.status(404).json({ error: "Not found" });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const status = error instanceof HttpError ? error.status : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Internal server error";

    return res.status(status).json({ error: message });
  }
);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;
