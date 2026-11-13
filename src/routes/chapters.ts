import express from "express";

import { getChaptersController } from "~/controllers/chapters";
import { asyncHandler } from "~/utils/asyncHandler";
import { requireParam } from "~/utils/requestParams";

const chaptersRouter = express.Router();

chaptersRouter.get(
  "/:bookName/chapters",
  asyncHandler(async (req, res) => {
    const bookName = requireParam(req.params.bookName, "bookName");
    const chapters = await getChaptersController(bookName);

    res.json(chapters);
  })
);

export default chaptersRouter;
