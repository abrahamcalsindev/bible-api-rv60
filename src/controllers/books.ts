import { getBooksModel } from "~/models/books";
import { BookDto, BookRow } from "~/types/bible";

const toBookDto = (row: BookRow): BookDto => ({
  book_id: row.BOOK_ID,
  book_name_id: row.BOOK_NAME_NORM,
  book_name: row.BOOK_NAME,
  chapters_count: row.CHAPTERS,
  translation_name: row.BIBLE_NAME,
});

export const getBooksController = async (): Promise<BookDto[]> => {
  const rows = await getBooksModel();

  return rows.map(toBookDto);
};
