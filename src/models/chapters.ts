import { queryAll } from "~/database/bibleDb";
import { ChapterRow } from "~/types/bible";
import { normalizeBookName } from "~/utils/bookName";

const SQL = `SELECT VERSES.CHAPTER, COUNT(VERSES.ID) AS VERSES, VERSES.BOOK_ID 
  FROM VERSES 
  INNER JOIN BOOKS ON VERSES.BOOK_ID = BOOKS.BOOK_ID 
  WHERE BOOKS.BOOK_NAME_NORM = ? 
  GROUP BY VERSES.CHAPTER, VERSES.BOOK_ID 
  ORDER BY VERSES.CHAPTER ASC`;

export const getChaptersModel = (bookName: string): Promise<ChapterRow[]> =>
  queryAll(SQL, [normalizeBookName(bookName)]);
