import { queryAll } from "~/database/bibleDb";
import { VerseRow } from "~/types/bible";
import { normalizeBookName } from "~/utils/bookName";
import { VerseRange } from "~/utils/verseRange";

const buildRangeFilter = (range: VerseRange) => {
  const { from, to } = range;

  if (from !== undefined && to !== undefined) {
    return { condition: "VERSE_ID BETWEEN ? AND ?", values: [from, to] };
  }

  if (from !== undefined) {
    return { condition: "VERSE_ID >= ?", values: [from] };
  }

  if (to !== undefined) {
    return { condition: "VERSE_ID <= ?", values: [to] };
  }

  return { condition: "", values: [] as number[] };
};

export const getVersesModel = (
  bookName: string,
  chapter: string,
  range: VerseRange = {}
): Promise<VerseRow[]> => {
  const { condition, values } = buildRangeFilter(range);

  const where = ["BOOKS.BOOK_NAME_NORM = ?", "CHAPTER = ?", condition]
    .filter(Boolean)
    .join(" AND ");

  const sql = `SELECT VERSE_ID, VERSE_TEXT, SUBTITLE 
    FROM VERSES 
    INNER JOIN BOOKS ON VERSES.BOOK_ID = BOOKS.BOOK_ID 
    WHERE ${where} 
    ORDER BY VERSE_ID ASC`;

  return queryAll(sql, [normalizeBookName(bookName), chapter, ...values]);
};
