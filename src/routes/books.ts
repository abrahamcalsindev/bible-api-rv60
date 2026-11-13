import express from "express";

import { getBooksController } from "~/controllers/books";
import { asyncHandler } from "~/utils/asyncHandler";

const booksRouter = express.Router();

booksRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const books = await getBooksController();

    res.json(books);
  })
);

export default booksRouter;
