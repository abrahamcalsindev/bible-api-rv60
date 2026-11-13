interface BookRow {
  BOOK_ID: number;
  BOOK_NAME: string;
  BIBLE_NAME: string;
  BOOK_NAME_NORM: string;
  CHAPTERS: number;
}

interface ChapterRow {
  CHAPTER: number;
  BOOK_ID: number;
  VERSES: number;
}

interface VerseRow {
  VERSE_ID: number;
  VERSE_TEXT: string;
  SUBTITLE: string | null;
}

interface BookDto {
  book_id: number;
  book_name_id: string;
  book_name: string;
  chapters_count: number;
  translation_name: string;
}

interface ChapterDto {
  book_id: number;
  chapter: number;
  verses_count: number;
}

interface VerseDto {
  verse: number;
  text: string;
  subtitle: string | null;
}

export type { BookRow, ChapterRow, VerseRow, BookDto, ChapterDto, VerseDto };
