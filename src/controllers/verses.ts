import { getVersesModel } from "~/models/verses";
import { VerseDto, VerseRow } from "~/types/bible";
import HttpError from "~/utils/httpError";
import {
  parseRangeParam,
  VerseRange,
} from "~/utils/verseRange";

const toVerseDto = (row: VerseRow): VerseDto => ({
  verse: row.VERSE_ID,
  text: row.VERSE_TEXT,
  subtitle: row.SUBTITLE,
});

export const getVersesController = async (
  bookName: string,
  chapter: string,
  range: VerseRange = {}
): Promise<VerseDto[]> => {
  const rows = await getVersesModel(bookName, chapter, range);

  if (rows.length === 0) {
    throw new HttpError(404, "Verses not found");
  }

  return rows.map(toVerseDto);
};

export const getVerseController = async (
  bookName: string,
  chapter: string,
  verse: number
): Promise<VerseDto> => {
  const [row] = await getVersesModel(bookName, chapter, {
    from: verse,
    to: verse,
  });

  if (!row) {
    throw new HttpError(404, "Verse not found");
  }

  return toVerseDto(row);
};

export const getVersesRangeController = (
  bookName: string,
  chapter: string,
  rangeParam: string
): Promise<VerseDto[]> => {
  return getVersesController(bookName, chapter, parseRangeParam(rangeParam));
};
