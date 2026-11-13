import { queryAll } from "~/database/bibleDb";
import { BookRow } from "~/types/bible";

const SQL = `SELECT DISTINCT BOOKS.BOOK_ID, BOOKS.BOOK_NAME_NORM, BOOKS.BOOK_NAME, COUNT(DISTINCT VERSES.CHAPTER) AS CHAPTERS, BIBLES.BIBLE_NAME 
  FROM BOOKS 
  INNER JOIN VERSES ON BOOKS.BOOK_ID = VERSES.BOOK_ID 
  INNER JOIN BIBLES ON BOOKS.BIBLE_ID = BIBLES.ID 
  GROUP BY BOOKS.BOOK_ID`;

export const getBooksModel = (): Promise<BookRow[]> => queryAll(SQL);
