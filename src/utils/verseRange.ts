import HttpError from "~/utils/httpError";

const POSITIVE_INT_PATTERN = /^\d+$/;

export interface VerseRange {
  from?: number;
  to?: number;
}

const parseVerseNumber = (value: string): number => {
  if (!POSITIVE_INT_PATTERN.test(value) || Number(value) === 0) {
    throw new HttpError(
      400,
      "Invalid verse range: verse numbers must be positive integers"
    );
  }

  return Number(value);
};

export const parseVerseParam = (verse: string): number =>
  parseVerseNumber(verse);

const assertAscending = (from: number, to: number): void => {
  if (from > to) {
    throw new HttpError(
      400,
      "Invalid verse range: 'from' must be less than or equal to 'to'"
    );
  }
};

export const parseRangeParam = (range: string): { from: number; to: number } => {
  const parts = range.split("-");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new HttpError(400, "Invalid verse range: use the format 5-10");
  }

  const from = parseVerseNumber(parts[0]);
  const to = parseVerseNumber(parts[1]);

  assertAscending(from, to);

  return { from, to };
};

export const parseRangeQuery = (from?: string, to?: string): VerseRange => {
  const range: VerseRange = {};

  if (from) range.from = parseVerseNumber(from);
  if (to) range.to = parseVerseNumber(to);

  if (range.from !== undefined && range.to !== undefined) {
    assertAscending(range.from, range.to);
  }

  return range;
};
