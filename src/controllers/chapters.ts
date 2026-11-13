import { getChaptersModel } from "~/models/chapters";
import { ChapterDto, ChapterRow } from "~/types/bible";
import HttpError from "~/utils/httpError";

const toChapterDto = (row: ChapterRow): ChapterDto => ({
  book_id: row.BOOK_ID,
  chapter: row.CHAPTER,
  verses_count: row.VERSES,
});

export const getChaptersController = async (
  bookName: string
): Promise<ChapterDto[]> => {
  const rows = await getChaptersModel(bookName);

  if (rows.length === 0) {
    throw new HttpError(404, "Chapters not found");
  }

  return rows.map(toChapterDto);
};
