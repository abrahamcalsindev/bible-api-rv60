import express from "express";

import {
  getVerseController,
  getVersesController,
  getVersesRangeController,
} from "~/controllers/verses";
import { asyncHandler } from "~/utils/asyncHandler";
import { requireParam } from "~/utils/requestParams";
import { parseRangeQuery, parseVerseParam } from "~/utils/verseRange";

const versesRouter = express.Router();

versesRouter.get(
  "/:bookName/chapters/:chapter/verses/:verseOrRange",
  asyncHandler(async (req, res) => {
    const bookName = requireParam(req.params.bookName, "bookName");
    const chapter = requireParam(req.params.chapter, "chapter");
    const verseOrRange = requireParam(req.params.verseOrRange, "verseOrRange");

    if (verseOrRange.includes("-")) {
      const verses = await getVersesRangeController(
        bookName,
        chapter,
        verseOrRange
      );

      return res.json(verses);
    }

    const verse = await getVerseController(
      bookName,
      chapter,
      parseVerseParam(verseOrRange)
    );

    return res.json(verse);
  })
);

versesRouter.get(
  "/:bookName/chapters/:chapter/verses/:from/:to",
  asyncHandler(async (req, res) => {
    const bookName = requireParam(req.params.bookName, "bookName");
    const chapter = requireParam(req.params.chapter, "chapter");
    const from = requireParam(req.params.from, "from");
    const to = requireParam(req.params.to, "to");
    const verses = await getVersesRangeController(bookName, chapter, `${from}-${to}`);

    res.json(verses);
  })
);

versesRouter.get(
  "/:bookName/chapters/:chapter/verses",
  asyncHandler(async (req, res) => {
    const bookName = requireParam(req.params.bookName, "bookName");
    const chapter = requireParam(req.params.chapter, "chapter");
    const { from, to } = parseRangeQuery(
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    const verses = await getVersesController(bookName, chapter, { from, to });

    res.json(verses);
  })
);

export default versesRouter;
